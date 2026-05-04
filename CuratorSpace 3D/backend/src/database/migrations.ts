import { db } from './db';

const migrations = [
  `
  CREATE TABLE IF NOT EXISTS exhibits (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    description TEXT,
    model_path TEXT,
    texture_path TEXT,
    metadata TEXT NOT NULL DEFAULT '{}',
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
  )
  `,
  `
  CREATE TABLE IF NOT EXISTS galleries (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    preset_type TEXT,
    width REAL NOT NULL,
    depth REAL NOT NULL,
    height REAL NOT NULL,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
  )
  `,
  `
  CREATE TABLE IF NOT EXISTS gallery_layouts (
    id TEXT PRIMARY KEY,
    gallery_id TEXT NOT NULL,
    exhibit_id TEXT NOT NULL,
    position TEXT NOT NULL,
    rotation TEXT NOT NULL,
    scale TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    FOREIGN KEY (gallery_id) REFERENCES galleries(id),
    FOREIGN KEY (exhibit_id) REFERENCES exhibits(id)
  )
  `,
  `
  CREATE TABLE IF NOT EXISTS light_configs (
    id TEXT PRIMARY KEY,
    gallery_id TEXT NOT NULL,
    type TEXT NOT NULL,
    name TEXT NOT NULL,
    color TEXT NOT NULL,
    intensity REAL NOT NULL,
    position TEXT NOT NULL,
    rotation TEXT NOT NULL,
    target_position TEXT,
    distance REAL,
    angle REAL,
    penumbra REAL,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,
    FOREIGN KEY (gallery_id) REFERENCES galleries(id)
  )
  `,
  `
  CREATE TABLE IF NOT EXISTS tour_paths (
    id TEXT PRIMARY KEY,
    gallery_id TEXT NOT NULL,
    name TEXT NOT NULL,
    points TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,
    FOREIGN KEY (gallery_id) REFERENCES galleries(id)
  )
  `,
  `
  CREATE TABLE IF NOT EXISTS exhibition_versions (
    id TEXT PRIMARY KEY,
    gallery_id TEXT NOT NULL,
    version INTEGER NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    layout_snapshot TEXT NOT NULL,
    lights_snapshot TEXT NOT NULL,
    tour_paths_snapshot TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    FOREIGN KEY (gallery_id) REFERENCES galleries(id),
    UNIQUE(gallery_id, version)
  )
  `,
];

export function runMigrations(): void {
  migrations.forEach((migration) => {
    db.exec(migration);
  });
  console.log('Database migrations completed');
}
