const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'origami.db');
const db = new Database(dbPath);

db.exec(`
  CREATE TABLE IF NOT EXISTS crease_patterns (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    vertices TEXT NOT NULL,
    edges TEXT NOT NULL,
    faces TEXT NOT NULL,
    panel_thickness REAL NOT NULL DEFAULT 0.1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS dihedral_sequences (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    crease_pattern_id INTEGER NOT NULL,
    sequence_data TEXT NOT NULL,
    is_rigid_foldable BOOLEAN DEFAULT 0,
    degrees_of_freedom INTEGER DEFAULT 0,
    FOREIGN KEY (crease_pattern_id) REFERENCES crease_patterns(id)
  );

  CREATE TABLE IF NOT EXISTS energy_landscapes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    crease_pattern_id INTEGER NOT NULL,
    potential_data TEXT NOT NULL,
    wells_data TEXT NOT NULL,
    barriers_data TEXT NOT NULL,
    is_bistable BOOLEAN DEFAULT 0,
    FOREIGN KEY (crease_pattern_id) REFERENCES crease_patterns(id)
  );
`);

module.exports = db;
