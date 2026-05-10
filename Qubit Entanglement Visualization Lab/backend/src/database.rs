use sqlx::{SqlitePool, sqlite::SqlitePoolOptions, Row};
use uuid::Uuid;
use chrono::{Utc, DateTime};
use crate::models::{QuantumCircuit, QubitNode, GateOperation, GateType, DecoherenceRecord};

pub async fn create_pool(db_path: &str) -> Result<SqlitePool, sqlx::Error> {
    let pool = SqlitePoolOptions::new()
        .max_connections(5)
        .connect(db_path)
        .await?;
    
    sqlx::query(
        r#"
        CREATE TABLE IF NOT EXISTS quantum_circuits (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            qubit_count INTEGER NOT NULL,
            topology TEXT NOT NULL,
            gates TEXT NOT NULL,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
        )
        "#
    )
    .execute(&pool)
    .await?;
    
    sqlx::query(
        r#"
        CREATE TABLE IF NOT EXISTS decoherence_records (
            id TEXT PRIMARY KEY,
            circuit_id TEXT NOT NULL,
            qubit_index INTEGER NOT NULL,
            timestep INTEGER NOT NULL,
            coherence REAL NOT NULL,
            timestamp TEXT NOT NULL,
            FOREIGN KEY (circuit_id) REFERENCES quantum_circuits(id)
        )
        "#
    )
    .execute(&pool)
    .await?;
    
    Ok(pool)
}

pub async fn save_circuit(pool: &SqlitePool, circuit: &QuantumCircuit) -> Result<(), sqlx::Error> {
    let topology_json = serde_json::to_string(&circuit.topology).unwrap();
    let gates_json = serde_json::to_string(&circuit.gates).unwrap();
    
    sqlx::query(
        r#"
        INSERT OR REPLACE INTO quantum_circuits 
        (id, name, qubit_count, topology, gates, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        "#
    )
    .bind(circuit.id.to_string())
    .bind(&circuit.name)
    .bind(circuit.qubit_count as i64)
    .bind(topology_json)
    .bind(gates_json)
    .bind(circuit.created_at.to_rfc3339())
    .bind(circuit.updated_at.to_rfc3339())
    .execute(pool)
    .await?;
    
    Ok(())
}

pub async fn get_circuit(pool: &SqlitePool, id: Uuid) -> Result<Option<QuantumCircuit>, sqlx::Error> {
    let row = sqlx::query(
        r#"
        SELECT id, name, qubit_count, topology, gates, created_at, updated_at
        FROM quantum_circuits WHERE id = ?
        "#
    )
    .bind(id.to_string())
    .fetch_optional(pool)
    .await?;
    
    Ok(row.map(|r| {
        let id_str: String = r.get("id");
        let topology_str: String = r.get("topology");
        let gates_str: String = r.get("gates");
        let created_at_str: String = r.get("created_at");
        let updated_at_str: String = r.get("updated_at");
        
        QuantumCircuit {
            id: Uuid::parse_str(&id_str).unwrap(),
            name: r.get("name"),
            qubit_count: r.get::<i64, _>("qubit_count") as usize,
            topology: serde_json::from_str(&topology_str).unwrap(),
            gates: serde_json::from_str(&gates_str).unwrap(),
            created_at: DateTime::parse_from_rfc3339(&created_at_str).unwrap().with_timezone(&Utc),
            updated_at: DateTime::parse_from_rfc3339(&updated_at_str).unwrap().with_timezone(&Utc),
        }
    }))
}

pub async fn list_circuits(pool: &SqlitePool) -> Result<Vec<QuantumCircuit>, sqlx::Error> {
    let rows = sqlx::query(
        r#"
        SELECT id, name, qubit_count, topology, gates, created_at, updated_at
        FROM quantum_circuits ORDER BY updated_at DESC
        "#
    )
    .fetch_all(pool)
    .await?;
    
    Ok(rows.into_iter().map(|r| {
        let id_str: String = r.get("id");
        let topology_str: String = r.get("topology");
        let gates_str: String = r.get("gates");
        let created_at_str: String = r.get("created_at");
        let updated_at_str: String = r.get("updated_at");
        
        QuantumCircuit {
            id: Uuid::parse_str(&id_str).unwrap(),
            name: r.get("name"),
            qubit_count: r.get::<i64, _>("qubit_count") as usize,
            topology: serde_json::from_str(&topology_str).unwrap(),
            gates: serde_json::from_str(&gates_str).unwrap(),
            created_at: DateTime::parse_from_rfc3339(&created_at_str).unwrap().with_timezone(&Utc),
            updated_at: DateTime::parse_from_rfc3339(&updated_at_str).unwrap().with_timezone(&Utc),
        }
    }).collect())
}

pub async fn save_decoherence_record(pool: &SqlitePool, record: &DecoherenceRecord) -> Result<(), sqlx::Error> {
    sqlx::query(
        r#"
        INSERT INTO decoherence_records 
        (id, circuit_id, qubit_index, timestep, coherence, timestamp)
        VALUES (?, ?, ?, ?, ?, ?)
        "#
    )
    .bind(record.id.to_string())
    .bind(record.circuit_id.to_string())
    .bind(record.qubit_index as i64)
    .bind(record.timestep as i64)
    .bind(record.coherence)
    .bind(record.timestamp.to_rfc3339())
    .execute(pool)
    .await?;
    
    Ok(())
}

pub async fn get_decoherence_records(pool: &SqlitePool, circuit_id: Uuid) -> Result<Vec<DecoherenceRecord>, sqlx::Error> {
    let rows = sqlx::query(
        r#"
        SELECT id, circuit_id, qubit_index, timestep, coherence, timestamp
        FROM decoherence_records WHERE circuit_id = ? ORDER BY timestep ASC
        "#
    )
    .bind(circuit_id.to_string())
    .fetch_all(pool)
    .await?;
    
    Ok(rows.into_iter().map(|r| {
        let id_str: String = r.get("id");
        let circuit_id_str: String = r.get("circuit_id");
        let timestamp_str: String = r.get("timestamp");
        
        DecoherenceRecord {
            id: Uuid::parse_str(&id_str).unwrap(),
            circuit_id: Uuid::parse_str(&circuit_id_str).unwrap(),
            qubit_index: r.get::<i64, _>("qubit_index") as usize,
            timestep: r.get::<i64, _>("timestep") as usize,
            coherence: r.get("coherence"),
            timestamp: DateTime::parse_from_rfc3339(&timestamp_str).unwrap().with_timezone(&Utc),
        }
    }).collect())
}
