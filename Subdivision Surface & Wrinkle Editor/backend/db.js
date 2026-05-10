import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(__dirname, 'subdivision.db');
const db = new Database(dbPath);

db.exec(`
  CREATE TABLE IF NOT EXISTS projects (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS meshes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id INTEGER,
    subdivision_level INTEGER DEFAULT 0,
    vertices TEXT NOT NULL,
    faces TEXT NOT NULL,
    creases TEXT DEFAULT '[]',
    normals TEXT,
    uv TEXT,
    FOREIGN KEY (project_id) REFERENCES projects(id)
  );

  CREATE TABLE IF NOT EXISTS crease_fields (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id INTEGER,
    edge_data TEXT NOT NULL,
    weight_map TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES projects(id)
  );

  CREATE TABLE IF NOT EXISTS history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id INTEGER,
    action_type TEXT NOT NULL,
    mesh_snapshot TEXT NOT NULL,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES projects(id)
  );
`);

export default db;
