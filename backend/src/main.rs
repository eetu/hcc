#[actix_web::main]
async fn main() -> std::io::Result<()> {
    halo_backend::run_server().await
}
