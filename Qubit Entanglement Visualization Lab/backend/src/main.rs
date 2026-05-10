use axum::{
    extract::{State, Json, Path},
    http::StatusCode,
    routing::{get, post},
    Router,
    response::IntoResponse,
};
use serde_json::json;
use std::sync::Arc;
use tower_http::cors::{Any, CorsLayer};
use tracing_subscriber;

mod models;
mod quantum;
mod database;
mod presets;

use models::{SimulationRequest, QuantumCircuit, EvolutionResult};

#[derive(Clone)]
struct AppState {
    pool: Arc<sqlx::SqlitePool>,
}

async fn simulate(
    State(state): State<AppState>,
    Json(request): Json<SimulationRequest>,
) -> impl IntoResponse {
    let (dm, entropy_trajectory, measurement_probs, decoherence_times) = quantum::simulate_evolution(
        request.qubit_count,
        &request.gates,
        &request.noise_params,
        request.steps,
        request.dt,
    );
    
    let result = EvolutionResult {
        density_matrix: dm,
        entropy_trajectory,
        measurement_probabilities: measurement_probs,
        decoherence_times,
    };
    
    (StatusCode::OK, Json(result))
}

async fn list_presets() -> impl IntoResponse {
    let presets = presets::list_presets();
    (StatusCode::OK, Json(presets))
}

async fn load_preset(Path(id): Path<String>) -> impl IntoResponse {
    match presets::get_preset_by_id(&id) {
        Some(circuit) => (StatusCode::OK, Json(circuit)),
        None => (StatusCode::NOT_FOUND, Json(json!({"error": "Preset not found"}))),
    }
}

async fn save_circuit(
    State(state): State<AppState>,
    Json(circuit): Json<QuantumCircuit>,
) -> impl IntoResponse {
    match database::save_circuit(&state.pool, &circuit).await {
        Ok(_) => (StatusCode::OK, Json(json!({"success": true}))),
        Err(e) => (StatusCode::INTERNAL_SERVER_ERROR, Json(json!({"error": e.to_string()}))),
    }
}

async fn get_circuit(
    State(state): State<AppState>,
    Path(id): Path<String>,
) -> impl IntoResponse {
    use uuid::Uuid;
    let uuid = match Uuid::parse_str(&id) {
        Ok(u) => u,
        Err(_) => return (StatusCode::BAD_REQUEST, Json(json!({"error": "Invalid UUID"}))),
    };
    
    match database::get_circuit(&state.pool, uuid).await {
        Ok(Some(circuit)) => (StatusCode::OK, Json(circuit)),
        Ok(None) => (StatusCode::NOT_FOUND, Json(json!({"error": "Circuit not found"}))),
        Err(e) => (StatusCode::INTERNAL_SERVER_ERROR, Json(json!({"error": e.to_string()}))),
    }
}

async fn list_circuits(State(state): State<AppState>) -> impl IntoResponse {
    match database::list_circuits(&state.pool).await {
        Ok(circuits) => (StatusCode::OK, Json(circuits)),
        Err(e) => (StatusCode::INTERNAL_SERVER_ERROR, Json(json!({"error": e.to_string()}))),
    }
}

async fn health_check() -> impl IntoResponse {
    (StatusCode::OK, Json(json!({"status": "ok"})))
}

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    tracing_subscriber::fmt::init();
    
    let db_path = "sqlite:quantum.db";
    let pool = database::create_pool(db_path).await?;
    let shared_state = AppState {
        pool: Arc::new(pool),
    };
    
    let cors = CorsLayer::new()
        .allow_origin(Any)
        .allow_methods(Any)
        .allow_headers(Any);
    
    let app = Router::new()
        .route("/health", get(health_check))
        .route("/simulate", post(simulate))
        .route("/presets", get(list_presets))
        .route("/presets/:id", get(load_preset))
        .route("/circuits", post(save_circuit))
        .route("/circuits", get(list_circuits))
        .route("/circuits/:id", get(get_circuit))
        .with_state(shared_state)
        .layer(cors);
    
    let listener = tokio::net::TcpListener::bind("0.0.0.0:3001").await?;
    tracing::info!("Quantum backend running on http://localhost:3001");
    axum::serve(listener, app).await?;
    
    Ok(())
}
