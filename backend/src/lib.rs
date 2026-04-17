pub mod cache;
pub mod hue;
pub mod settings;
pub mod weather;

use std::sync::Arc;

use actix_cors::Cors;
use actix_files::Files;
use actix_web::{middleware, web, App, HttpResponse, HttpServer};
use tokio::sync::broadcast;
use utoipa::OpenApi;
use utoipa_swagger_ui::SwaggerUi;

use cache::Cache;
use settings::Settings;

pub struct AppState {
    pub settings: Settings,
    pub http_client: reqwest::Client,
    pub hue_client: reqwest::Client,
    pub hue_cache: Cache<hue::models::HueResponse>,
    pub tomorrow_cache: Cache<serde_json::Value>,
    pub hue_events_tx: broadcast::Sender<hue::events::HueLiveEvent>,
    pub discovery_cache: Cache<Vec<hue::migrate::DiscoveredBridge>>,
    pub migration: tokio::sync::RwLock<Option<hue::migrate::MigrationSession>>,
}

#[derive(OpenApi)]
#[openapi(
    paths(
        weather::handlers::tomorrow,
        hue::handlers::get_data,
        hue::handlers::events_sse,
        hue::handlers::pair,
        hue::handlers::toggle_group,
        status,
    ),
    components(schemas(
        hue::models::HueResponse,
        hue::models::Sensor,
        hue::models::Group,
        hue::models::GroupState,
        hue::models::RoomType,
        hue::events::HueLiveEvent,
        hue::handlers::PairRequest,
        hue::handlers::PairResponse,
        StatusResponse,
    ))
)]
struct ApiDoc;

#[derive(serde::Serialize, utoipa::ToSchema)]
struct StatusResponse {
    hue: bool,
    weather: bool,
}

#[utoipa::path(
    get,
    path = "/status",
    responses(
        (status = 200, description = "Service health check", body = StatusResponse)
    )
)]
pub async fn status(state: web::Data<Arc<AppState>>) -> HttpResponse {
    let hue = hue::client::check_connection(&state).await;
    let weather = state.tomorrow_cache.has_data().await;
    HttpResponse::Ok().json(StatusResponse { hue, weather })
}

pub fn create_app(
    state: Arc<AppState>,
    static_dir: &str,
) -> App<
    impl actix_web::dev::ServiceFactory<
        actix_web::dev::ServiceRequest,
        Config = (),
        Response = actix_web::dev::ServiceResponse<impl actix_web::body::MessageBody>,
        Error = actix_web::Error,
        InitError = (),
    >,
> {
    let openapi = ApiDoc::openapi();
    let static_dir = static_dir.to_string();

    App::new()
        .app_data(web::Data::new(state))
        .wrap(middleware::Logger::default())
        .wrap(Cors::permissive())
        .route("/status", web::get().to(status))
        .service(
            web::scope("/api")
                .service(
                    web::scope("/weather")
                        .route("/tomorrow", web::get().to(weather::handlers::tomorrow)),
                )
                .service(
                    web::scope("/hue")
                        .route("", web::get().to(hue::handlers::get_data))
                        .route("/events", web::get().to(hue::handlers::events_sse))
                        .route("/pair", web::post().to(hue::handlers::pair))
                        .route(
                            "/toggleGroup/{id}",
                            web::post().to(hue::handlers::toggle_group),
                        ),
                )
                .service(
                    web::scope("/migrate")
                        .route("/discover", web::get().to(hue::migrate::discover))
                        .route("/connect", web::post().to(hue::migrate::connect))
                        .route("/export", web::get().to(hue::migrate::export))
                        .route("/import", web::post().to(hue::migrate::import))
                        .route("/snapshot", web::get().to(hue::migrate::get_snapshot))
                        .route("/create-rooms", web::post().to(hue::migrate::create_rooms))
                        .route("/devices", web::get().to(hue::migrate::list_devices))
                        .route("/identify/{device_id}", web::post().to(hue::migrate::identify))
                        .route("/move-device", web::post().to(hue::migrate::move_device))
                        .route("/search", web::post().to(hue::migrate::search))
                        .route("/assign", web::post().to(hue::migrate::assign))
                        .route("/unassign", web::post().to(hue::migrate::unassign))
                        .route("/status", web::get().to(hue::migrate::status)),
                ),
        )
        .service(SwaggerUi::new("/docs/{_:.*}").url("/api-doc/openapi.json", openapi))
        .service({
            let index_path = format!("{static_dir}/index.html");
            Files::new("/", &static_dir)
                .index_file("index.html")
                .default_handler(actix_web::dev::fn_service(
                    move |req: actix_web::dev::ServiceRequest| {
                        let index_path = index_path.clone();
                        async move {
                            let (req, _) = req.into_parts();
                            let file = actix_files::NamedFile::open_async(&index_path).await?;
                            let res = file.into_response(&req);
                            Ok(actix_web::dev::ServiceResponse::new(req, res))
                        }
                    },
                ))
        })
}

pub fn create_test_app_state() -> Arc<AppState> {
    create_test_app_state_with(Settings::test_defaults())
}

pub fn create_test_app_state_with(settings: Settings) -> Arc<AppState> {
    let hue_client = reqwest::Client::builder()
        .danger_accept_invalid_certs(true)
        .build()
        .expect("Failed to build Hue HTTP client");

    let (hue_events_tx, _) = broadcast::channel(256);

    Arc::new(AppState {
        settings,
        http_client: reqwest::Client::new(),
        hue_client,
        hue_cache: Cache::new(std::time::Duration::from_secs(3)),
        tomorrow_cache: Cache::new(std::time::Duration::from_secs(3600)),
        hue_events_tx,
        discovery_cache: Cache::new(std::time::Duration::from_secs(300)),
        migration: tokio::sync::RwLock::new(None),
    })
}

pub async fn run_server() -> std::io::Result<()> {
    dotenvy::dotenv().ok();

    tracing_subscriber::fmt()
        .with_env_filter(
            tracing_subscriber::EnvFilter::try_from_default_env()
                .unwrap_or_else(|_| tracing_subscriber::EnvFilter::new("info")),
        )
        .init();

    let settings = Settings::from_env();
    let port = settings.port;
    let static_dir = settings.static_dir.clone();

    let hue_client = reqwest::Client::builder()
        .danger_accept_invalid_certs(true)
        .build()
        .expect("Failed to build Hue HTTP client");

    let (hue_events_tx, _) = broadcast::channel(256);

    let state = Arc::new(AppState {
        settings,
        http_client: reqwest::Client::new(),
        hue_client,
        hue_cache: Cache::new(std::time::Duration::from_secs(3)),
        tomorrow_cache: Cache::new(std::time::Duration::from_secs(3600)),
        hue_events_tx: hue_events_tx.clone(),
        discovery_cache: Cache::new(std::time::Duration::from_secs(300)),
        migration: tokio::sync::RwLock::new(None),
    });

    hue::events::start_stream_loop(state.clone());

    tracing::info!("Starting server on port {port}");

    HttpServer::new(move || create_app(state.clone(), &static_dir))
        .bind(("0.0.0.0", port))?
        .run()
        .await
}
