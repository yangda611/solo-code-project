import Database from 'better-sqlite3';
import path from 'path';

const dbPath = path.join(process.cwd(), 'phononic.db');
const db = new Database(dbPath);

db.exec(`
  CREATE TABLE IF NOT EXISTS simulations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    lattice_type TEXT NOT NULL,
    scatterer_shape TEXT NOT NULL,
    filling_fraction REAL NOT NULL,
    lattice_constant REAL NOT NULL,
    matrix_modulus REAL NOT NULL,
    scatterer_modulus REAL NOT NULL,
    matrix_density REAL NOT NULL,
    scatterer_density REAL NOT NULL
  )
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS band_data (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    simulation_id INTEGER NOT NULL,
    k REAL NOT NULL,
    frequency REAL NOT NULL,
    band_index INTEGER NOT NULL,
    FOREIGN KEY (simulation_id) REFERENCES simulations(id)
  )
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS band_gaps (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    simulation_id INTEGER NOT NULL,
    start_frequency REAL NOT NULL,
    end_frequency REAL NOT NULL,
    normalized_width REAL NOT NULL,
    FOREIGN KEY (simulation_id) REFERENCES simulations(id)
  )
`);

export default db;
