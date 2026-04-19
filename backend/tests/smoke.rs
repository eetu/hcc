use actix_web::{test, web, App};
use hcc_backend::settings::Settings;
use hcc_backend::{create_test_app_state, create_test_app_state_with, hue, weather};
use wiremock::matchers::{method, path};
use wiremock::{Mock, MockServer, ResponseTemplate};

/// Build a test app with only the API routes (no static file serving).
fn test_app(
    state: std::sync::Arc<hcc_backend::AppState>,
) -> App<
    impl actix_web::dev::ServiceFactory<
        actix_web::dev::ServiceRequest,
        Config = (),
        Response = actix_web::dev::ServiceResponse<impl actix_web::body::MessageBody>,
        Error = actix_web::Error,
        InitError = (),
    >,
> {
    App::new()
        .app_data(web::Data::new(state))
        .route("/status", web::get().to(hcc_backend::status))
        .service(
            web::scope("/api")
                .service(
                    web::scope("/weather")
                        .route("/fmi", web::get().to(weather::handlers::fmi))
                        .route("/tomorrow", web::get().to(weather::handlers::tomorrow)),
                )
                .service(
                    web::scope("/hue")
                        .route("", web::get().to(hue::handlers::get_data))
                        .route("/pair", web::post().to(hue::handlers::pair))
                        .route(
                            "/toggleGroup/{id}",
                            web::post().to(hue::handlers::toggle_group),
                        ),
                ),
        )
}

fn test_settings_with_mock(mock_url: &str) -> Settings {
    Settings {
        tomorrow_io_api_key: "test-key".into(),
        tomorrow_io_base_url: mock_url.into(),
        fmi_base_url: mock_url.into(),
        position_lat: "60.17".into(),
        position_lon: "24.94".into(),
        language: "fi".into(),
        hue_bridge_address: mock_url.into(),
        hue_bridge_user: "test-user".into(),
        hue_room_types: "{}".into(),
        static_dir: "./dist".into(),
        port: 3000,
        history_retention_days: 90,
    }
}

// ---- Status endpoint ----

#[actix_web::test]
async fn status_returns_200() {
    let state = create_test_app_state();
    let app = test::init_service(test_app(state)).await;
    let req = test::TestRequest::get().uri("/status").to_request();
    let resp = test::call_service(&app, req).await;

    assert_eq!(resp.status(), 200);

    let body: serde_json::Value = test::read_body_json(resp).await;
    assert!(body.get("hue").is_some());
    assert!(body.get("weather").is_some());
}

#[actix_web::test]
async fn status_reports_services_down_without_config() {
    let state = create_test_app_state();
    let app = test::init_service(test_app(state)).await;
    let req = test::TestRequest::get().uri("/status").to_request();
    let resp = test::call_service(&app, req).await;

    let body: serde_json::Value = test::read_body_json(resp).await;
    assert_eq!(body["hue"], false);
    assert_eq!(body["weather"], false);
}

#[actix_web::test]
async fn status_reports_hue_up_with_mock_bridge() {
    let mock_server = MockServer::start().await;

    Mock::given(method("GET"))
        .and(path("/clip/v2/resource/bridge"))
        .respond_with(ResponseTemplate::new(200).set_body_json(serde_json::json!({
            "data": [{"id": "bridge-1"}]
        })))
        .mount(&mock_server)
        .await;

    let settings = test_settings_with_mock(&mock_server.uri());
    let state = create_test_app_state_with(settings);
    let app = test::init_service(test_app(state)).await;

    let req = test::TestRequest::get().uri("/status").to_request();
    let resp = test::call_service(&app, req).await;

    let body: serde_json::Value = test::read_body_json(resp).await;
    assert_eq!(body["hue"], true);
}

// ---- Weather endpoint ----

#[actix_web::test]
async fn weather_returns_data_from_api() {
    let mock_server = MockServer::start().await;

    let weather_data = serde_json::json!({
        "data": {"timelines": []}
    });

    Mock::given(method("GET"))
        .and(path("/v4/timelines"))
        .respond_with(ResponseTemplate::new(200).set_body_json(&weather_data))
        .mount(&mock_server)
        .await;

    let settings = test_settings_with_mock(&mock_server.uri());
    let state = create_test_app_state_with(settings);
    let app = test::init_service(test_app(state)).await;

    let req = test::TestRequest::get()
        .uri("/api/weather/tomorrow")
        .to_request();
    let resp = test::call_service(&app, req).await;

    assert_eq!(resp.status(), 200);
    let body: serde_json::Value = test::read_body_json(resp).await;
    assert_eq!(body, weather_data);
}

#[actix_web::test]
async fn weather_returns_502_when_api_fails() {
    let mock_server = MockServer::start().await;

    Mock::given(method("GET"))
        .and(path("/v4/timelines"))
        .respond_with(ResponseTemplate::new(500))
        .mount(&mock_server)
        .await;

    let settings = test_settings_with_mock(&mock_server.uri());
    let state = create_test_app_state_with(settings);
    let app = test::init_service(test_app(state)).await;

    let req = test::TestRequest::get()
        .uri("/api/weather/tomorrow")
        .to_request();
    let resp = test::call_service(&app, req).await;

    assert_eq!(resp.status(), 502);
}

#[actix_web::test]
async fn weather_returns_cached_data() {
    let state = create_test_app_state();
    let cached = serde_json::json!({"test": "weather_data"});
    state.tomorrow_cache.set(cached.clone()).await;

    let app = test::init_service(test_app(state)).await;

    let req = test::TestRequest::get()
        .uri("/api/weather/tomorrow")
        .to_request();
    let resp = test::call_service(&app, req).await;

    assert_eq!(resp.status(), 200);
    let body: serde_json::Value = test::read_body_json(resp).await;
    assert_eq!(body["test"], "weather_data");
}

#[actix_web::test]
async fn weather_serves_from_cache_over_api() {
    let mock_server = MockServer::start().await;

    Mock::given(method("GET"))
        .and(path("/v4/timelines"))
        .respond_with(ResponseTemplate::new(500))
        .expect(0) // Should not be called when cache is fresh
        .mount(&mock_server)
        .await;

    let settings = test_settings_with_mock(&mock_server.uri());
    let state = create_test_app_state_with(settings);
    state
        .tomorrow_cache
        .set(serde_json::json!({"cached": true}))
        .await;

    let app = test::init_service(test_app(state)).await;

    let req = test::TestRequest::get()
        .uri("/api/weather/tomorrow")
        .to_request();
    let resp = test::call_service(&app, req).await;

    assert_eq!(resp.status(), 200);
    let body: serde_json::Value = test::read_body_json(resp).await;
    assert_eq!(body["cached"], true);
}

// ---- Hue endpoints ----

#[actix_web::test]
async fn hue_get_returns_error_without_credentials() {
    let state = create_test_app_state();
    let app = test::init_service(test_app(state)).await;
    let req = test::TestRequest::get().uri("/api/hue").to_request();
    let resp = test::call_service(&app, req).await;

    assert_eq!(resp.status(), 502);
}

#[actix_web::test]
async fn hue_get_returns_data_from_bridge() {
    let mock_server = MockServer::start().await;

    // Mock all 7 endpoints that fetch_hue_data calls
    let empty_list = serde_json::json!({"data": []});

    for endpoint in [
        "/clip/v2/resource/room",
        "/clip/v2/resource/temperature",
        "/clip/v2/resource/grouped_light",
        "/clip/v2/resource/device_power",
        "/clip/v2/resource/device",
        "/clip/v2/resource/motion",
        "/clip/v2/resource/zigbee_connectivity",
    ] {
        Mock::given(method("GET"))
            .and(path(endpoint))
            .respond_with(ResponseTemplate::new(200).set_body_json(&empty_list))
            .mount(&mock_server)
            .await;
    }

    let settings = test_settings_with_mock(&mock_server.uri());
    let state = create_test_app_state_with(settings);
    let app = test::init_service(test_app(state)).await;

    let req = test::TestRequest::get().uri("/api/hue").to_request();
    let resp = test::call_service(&app, req).await;

    assert_eq!(resp.status(), 200);
    let body: serde_json::Value = test::read_body_json(resp).await;
    assert!(body["sensors"].as_array().unwrap().is_empty());
    assert!(body["groups"].as_array().unwrap().is_empty());
}

#[actix_web::test]
async fn hue_get_returns_cached_data() {
    let state = create_test_app_state();
    let cached = hue::models::HueResponse {
        sensors: vec![],
        groups: vec![hue::models::Group {
            id: "g1".into(),
            name: "Living Room".into(),
            state: hue::models::GroupState { on: true },
        }],
    };
    state.hue_cache.set(cached).await;

    let app = test::init_service(test_app(state)).await;
    let req = test::TestRequest::get().uri("/api/hue").to_request();
    let resp = test::call_service(&app, req).await;

    assert_eq!(resp.status(), 200);
    let body: serde_json::Value = test::read_body_json(resp).await;
    assert_eq!(body["groups"][0]["name"], "Living Room");
}

#[actix_web::test]
async fn hue_pair_requires_bridge_ip() {
    let state = create_test_app_state();
    let app = test::init_service(test_app(state)).await;
    let req = test::TestRequest::post()
        .uri("/api/hue/pair")
        .set_json(serde_json::json!({}))
        .to_request();
    let resp = test::call_service(&app, req).await;

    assert_eq!(resp.status(), 400);
    let body: serde_json::Value = test::read_body_json(resp).await;
    assert!(body["error"].as_str().unwrap().contains("bridgeIp"));
}

#[actix_web::test]
async fn hue_pair_successful() {
    let mock_server = MockServer::start().await;

    Mock::given(method("POST"))
        .and(path("/api"))
        .respond_with(ResponseTemplate::new(200).set_body_json(serde_json::json!([
            {"success": {"username": "test-user-123", "clientkey": "test-key-456"}}
        ])))
        .mount(&mock_server)
        .await;

    let state = create_test_app_state();
    let app = test::init_service(test_app(state)).await;

    let req = test::TestRequest::post()
        .uri("/api/hue/pair")
        .set_json(serde_json::json!({"bridgeIp": mock_server.uri()}))
        .to_request();
    let resp = test::call_service(&app, req).await;

    assert_eq!(resp.status(), 200);
    let body: serde_json::Value = test::read_body_json(resp).await;
    assert_eq!(body["HUE_BRIDGE_USER"], "test-user-123");
    assert_eq!(body["HUE_BRIDGE_USER_CLIENT_KEY"], "test-key-456");
}

#[actix_web::test]
async fn hue_pair_button_not_pressed() {
    let mock_server = MockServer::start().await;

    Mock::given(method("POST"))
        .and(path("/api"))
        .respond_with(ResponseTemplate::new(200).set_body_json(serde_json::json!([
            {"error": {"type": 101, "description": "link button not pressed"}}
        ])))
        .mount(&mock_server)
        .await;

    let state = create_test_app_state();
    let app = test::init_service(test_app(state)).await;

    let req = test::TestRequest::post()
        .uri("/api/hue/pair")
        .set_json(serde_json::json!({"bridgeIp": mock_server.uri()}))
        .to_request();
    let resp = test::call_service(&app, req).await;

    assert_eq!(resp.status(), 400);
    let body: serde_json::Value = test::read_body_json(resp).await;
    assert!(body["error"]
        .as_str()
        .unwrap()
        .contains("link button not pressed"));
}

#[actix_web::test]
async fn hue_toggle_returns_error_without_credentials() {
    let state = create_test_app_state();
    let app = test::init_service(test_app(state)).await;
    let req = test::TestRequest::post()
        .uri("/api/hue/toggleGroup/some-id")
        .to_request();
    let resp = test::call_service(&app, req).await;

    assert_eq!(resp.status(), 502);
}

#[actix_web::test]
async fn hue_toggle_toggles_group() {
    let mock_server = MockServer::start().await;

    Mock::given(method("GET"))
        .and(path("/clip/v2/resource/grouped_light/group-1"))
        .respond_with(ResponseTemplate::new(200).set_body_json(serde_json::json!({
            "data": [{"id": "group-1", "owner": {"rid": "room-1", "rtype": "room"}, "on": {"on": true}}]
        })))
        .mount(&mock_server)
        .await;

    Mock::given(method("PUT"))
        .and(path("/clip/v2/resource/grouped_light/group-1"))
        .respond_with(ResponseTemplate::new(200))
        .mount(&mock_server)
        .await;

    let settings = test_settings_with_mock(&mock_server.uri());
    let state = create_test_app_state_with(settings);
    let app = test::init_service(test_app(state)).await;

    let req = test::TestRequest::post()
        .uri("/api/hue/toggleGroup/group-1")
        .to_request();
    let resp = test::call_service(&app, req).await;

    assert_eq!(resp.status(), 200);
}

// ---- Routing ----

#[actix_web::test]
async fn unknown_api_route_returns_404() {
    let state = create_test_app_state();
    let app = test::init_service(test_app(state)).await;
    let req = test::TestRequest::get()
        .uri("/api/nonexistent")
        .to_request();
    let resp = test::call_service(&app, req).await;

    assert_eq!(resp.status(), 404);
}
