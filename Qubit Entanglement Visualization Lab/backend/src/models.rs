use serde::{Deserialize, Serialize};
use uuid::Uuid;
use chrono::{DateTime, Utc};
use num_complex::Complex64;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct QubitNode {
    pub id: Uuid,
    pub position: [f64; 3],
    pub state: (Complex64, Complex64),
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum GateType {
    H,
    X,
    Y,
    Z,
    S,
    T,
    Rx { theta: f64 },
    Ry { theta: f64 },
    Rz { theta: f64 },
    CNOT,
    CZ,
    Swap,
    Toffoli,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GateOperation {
    pub id: Uuid,
    pub gate_type: GateType,
    pub qubits: Vec<usize>,
    pub parameters: Vec<f64>,
    pub timestamp: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct QuantumCircuit {
    pub id: Uuid,
    pub name: String,
    pub qubit_count: usize,
    pub topology: Vec<QubitNode>,
    pub gates: Vec<GateOperation>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DensityMatrix {
    pub data: Vec<Vec<Complex64>>,
    pub size: usize,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct EntropyTrajectory {
    pub timestep: usize,
    pub entropy: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MeasurementResult {
    pub bitstring: String,
    pub probability: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct EvolutionResult {
    pub density_matrix: DensityMatrix,
    pub entropy_trajectory: Vec<EntropyTrajectory>,
    pub measurement_probabilities: Vec<MeasurementResult>,
    pub decoherence_times: Vec<f64>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NoiseParameters {
    pub decoherence_rate: f64,
    pub calibration_error: f64,
    pub crosstalk_coupling: f64,
    pub measurement_basis_error: f64,
    pub temperature: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SimulationRequest {
    pub circuit_id: Option<Uuid>,
    pub qubit_count: usize,
    pub gates: Vec<GateOperation>,
    pub noise_params: NoiseParameters,
    pub steps: usize,
    pub dt: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DecoherenceRecord {
    pub id: Uuid,
    pub circuit_id: Uuid,
    pub qubit_index: usize,
    pub timestep: usize,
    pub coherence: f64,
    pub timestamp: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PresetInfo {
    pub id: String,
    pub name: String,
    pub description: String,
}
