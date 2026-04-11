#[actix_web::main]
async fn main() -> std::io::Result<()> {
    hcc_backend::run_server().await
}
