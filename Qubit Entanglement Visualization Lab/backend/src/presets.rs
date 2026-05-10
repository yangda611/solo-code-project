use uuid::Uuid;
use chrono::Utc;
use num_complex::Complex64;
use crate::models::{QuantumCircuit, QubitNode, GateOperation, GateType, PresetInfo};

pub fn list_presets() -> Vec<PresetInfo> {
    vec![
        PresetInfo {
            id: "bell-state".to_string(),
            name: "贝尔态制备预设".to_string(),
            description: "制备两量子比特的最大纠缠贝尔态 |Φ⁺⟩ = (|00⟩ + |11⟩)/√2".to_string(),
        },
        PresetInfo {
            id: "quantum-teleportation".to_string(),
            name: "量子隐形传态预设".to_string(),
            description: "使用量子纠缠在两个量子比特之间传输未知量子态".to_string(),
        },
        PresetInfo {
            id: "grover-search".to_string(),
            name: "Grover搜索算法预设".to_string(),
            description: "量子搜索算法，在无序数据库中实现二次加速".to_string(),
        },
        PresetInfo {
            id: "surface-code".to_string(),
            name: "表面码纠错预设".to_string(),
            description: "拓扑量子纠错码，实现容错量子计算".to_string(),
        },
    ]
}

pub fn create_bell_state_circuit() -> QuantumCircuit {
    let now = Utc::now();
    QuantumCircuit {
        id: Uuid::new_v4(),
        name: "贝尔态制备".to_string(),
        qubit_count: 2,
        topology: vec![
            QubitNode {
                id: Uuid::new_v4(),
                position: [-1.0, 0.0, 0.0],
                state: (Complex64::new(1.0, 0.0), Complex64::new(0.0, 0.0)),
            },
            QubitNode {
                id: Uuid::new_v4(),
                position: [1.0, 0.0, 0.0],
                state: (Complex64::new(1.0, 0.0), Complex64::new(0.0, 0.0)),
            },
        ],
        gates: vec![
            GateOperation {
                id: Uuid::new_v4(),
                gate_type: GateType::H,
                qubits: vec![0],
                parameters: vec![],
                timestamp: now,
            },
            GateOperation {
                id: Uuid::new_v4(),
                gate_type: GateType::CNOT,
                qubits: vec![0, 1],
                parameters: vec![],
                timestamp: now,
            },
        ],
        created_at: now,
        updated_at: now,
    }
}

pub fn create_teleportation_circuit() -> QuantumCircuit {
    let now = Utc::now();
    QuantumCircuit {
        id: Uuid::new_v4(),
        name: "量子隐形传态".to_string(),
        qubit_count: 3,
        topology: vec![
            QubitNode {
                id: Uuid::new_v4(),
                position: [-2.0, 0.0, 0.0],
                state: (Complex64::new(1.0 / 2.0_f64.sqrt(), 0.0), Complex64::new(1.0 / 2.0_f64.sqrt(), 0.0)),
            },
            QubitNode {
                id: Uuid::new_v4(),
                position: [0.0, 0.0, 0.0],
                state: (Complex64::new(1.0, 0.0), Complex64::new(0.0, 0.0)),
            },
            QubitNode {
                id: Uuid::new_v4(),
                position: [2.0, 0.0, 0.0],
                state: (Complex64::new(1.0, 0.0), Complex64::new(0.0, 0.0)),
            },
        ],
        gates: vec![
            GateOperation {
                id: Uuid::new_v4(),
                gate_type: GateType::H,
                qubits: vec![1],
                parameters: vec![],
                timestamp: now,
            },
            GateOperation {
                id: Uuid::new_v4(),
                gate_type: GateType::CNOT,
                qubits: vec![1, 2],
                parameters: vec![],
                timestamp: now,
            },
            GateOperation {
                id: Uuid::new_v4(),
                gate_type: GateType::CNOT,
                qubits: vec![0, 1],
                parameters: vec![],
                timestamp: now,
            },
            GateOperation {
                id: Uuid::new_v4(),
                gate_type: GateType::H,
                qubits: vec![0],
                parameters: vec![],
                timestamp: now,
            },
        ],
        created_at: now,
        updated_at: now,
    }
}

pub fn create_grover_circuit() -> QuantumCircuit {
    let now = Utc::now();
    QuantumCircuit {
        id: Uuid::new_v4(),
        name: "Grover搜索算法".to_string(),
        qubit_count: 3,
        topology: vec![
            QubitNode {
                id: Uuid::new_v4(),
                position: [-2.0, 0.0, 0.0],
                state: (Complex64::new(1.0, 0.0), Complex64::new(0.0, 0.0)),
            },
            QubitNode {
                id: Uuid::new_v4(),
                position: [0.0, 0.0, 0.0],
                state: (Complex64::new(1.0, 0.0), Complex64::new(0.0, 0.0)),
            },
            QubitNode {
                id: Uuid::new_v4(),
                position: [2.0, 0.0, 0.0],
                state: (Complex64::new(1.0, 0.0), Complex64::new(0.0, 0.0)),
            },
        ],
        gates: vec![
            GateOperation {
                id: Uuid::new_v4(),
                gate_type: GateType::H,
                qubits: vec![0],
                parameters: vec![],
                timestamp: now,
            },
            GateOperation {
                id: Uuid::new_v4(),
                gate_type: GateType::H,
                qubits: vec![1],
                parameters: vec![],
                timestamp: now,
            },
            GateOperation {
                id: Uuid::new_v4(),
                gate_type: GateType::H,
                qubits: vec![2],
                parameters: vec![],
                timestamp: now,
            },
            GateOperation {
                id: Uuid::new_v4(),
                gate_type: GateType::CZ,
                qubits: vec![0, 1],
                parameters: vec![],
                timestamp: now,
            },
            GateOperation {
                id: Uuid::new_v4(),
                gate_type: GateType::H,
                qubits: vec![0],
                parameters: vec![],
                timestamp: now,
            },
            GateOperation {
                id: Uuid::new_v4(),
                gate_type: GateType::H,
                qubits: vec![1],
                parameters: vec![],
                timestamp: now,
            },
            GateOperation {
                id: Uuid::new_v4(),
                gate_type: GateType::Z,
                qubits: vec![0],
                parameters: vec![],
                timestamp: now,
            },
            GateOperation {
                id: Uuid::new_v4(),
                gate_type: GateType::Z,
                qubits: vec![1],
                parameters: vec![],
                timestamp: now,
            },
            GateOperation {
                id: Uuid::new_v4(),
                gate_type: GateType::CZ,
                qubits: vec![0, 1],
                parameters: vec![],
                timestamp: now,
            },
        ],
        created_at: now,
        updated_at: now,
    }
}

pub fn create_surface_code_circuit() -> QuantumCircuit {
    let now = Utc::now();
    QuantumCircuit {
        id: Uuid::new_v4(),
        name: "表面码纠错".to_string(),
        qubit_count: 5,
        topology: vec![
            QubitNode {
                id: Uuid::new_v4(),
                position: [-2.0, 1.0, 0.0],
                state: (Complex64::new(1.0, 0.0), Complex64::new(0.0, 0.0)),
            },
            QubitNode {
                id: Uuid::new_v4(),
                position: [0.0, 1.0, 0.0],
                state: (Complex64::new(1.0, 0.0), Complex64::new(0.0, 0.0)),
            },
            QubitNode {
                id: Uuid::new_v4(),
                position: [2.0, 1.0, 0.0],
                state: (Complex64::new(1.0, 0.0), Complex64::new(0.0, 0.0)),
            },
            QubitNode {
                id: Uuid::new_v4(),
                position: [-1.0, -1.0, 0.0],
                state: (Complex64::new(1.0, 0.0), Complex64::new(0.0, 0.0)),
            },
            QubitNode {
                id: Uuid::new_v4(),
                position: [1.0, -1.0, 0.0],
                state: (Complex64::new(1.0, 0.0), Complex64::new(0.0, 0.0)),
            },
        ],
        gates: vec![
            GateOperation {
                id: Uuid::new_v4(),
                gate_type: GateType::H,
                qubits: vec![0],
                parameters: vec![],
                timestamp: now,
            },
            GateOperation {
                id: Uuid::new_v4(),
                gate_type: GateType::CNOT,
                qubits: vec![0, 1],
                parameters: vec![],
                timestamp: now,
            },
            GateOperation {
                id: Uuid::new_v4(),
                gate_type: GateType::CNOT,
                qubits: vec![1, 2],
                parameters: vec![],
                timestamp: now,
            },
            GateOperation {
                id: Uuid::new_v4(),
                gate_type: GateType::CNOT,
                qubits: vec![0, 3],
                parameters: vec![],
                timestamp: now,
            },
            GateOperation {
                id: Uuid::new_v4(),
                gate_type: GateType::CNOT,
                qubits: vec![1, 3],
                parameters: vec![],
                timestamp: now,
            },
            GateOperation {
                id: Uuid::new_v4(),
                gate_type: GateType::CNOT,
                qubits: vec![1, 4],
                parameters: vec![],
                timestamp: now,
            },
            GateOperation {
                id: Uuid::new_v4(),
                gate_type: GateType::CNOT,
                qubits: vec![2, 4],
                parameters: vec![],
                timestamp: now,
            },
        ],
        created_at: now,
        updated_at: now,
    }
}

pub fn get_preset_by_id(id: &str) -> Option<QuantumCircuit> {
    match id {
        "bell-state" => Some(create_bell_state_circuit()),
        "quantum-teleportation" => Some(create_teleportation_circuit()),
        "grover-search" => Some(create_grover_circuit()),
        "surface-code" => Some(create_surface_code_circuit()),
        _ => None,
    }
}
