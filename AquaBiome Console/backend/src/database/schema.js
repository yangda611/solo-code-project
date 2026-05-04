const db = require('../config/database');

function initDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS presets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      description TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS fish (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      preset_id INTEGER,
      species TEXT NOT NULL,
      name TEXT,
      quantity INTEGER DEFAULT 1,
      health_status TEXT DEFAULT 'healthy',
      behavior TEXT,
      last_fed DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (preset_id) REFERENCES presets(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS corals (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      preset_id INTEGER,
      species TEXT NOT NULL,
      name TEXT,
      health_status TEXT DEFAULT 'healthy',
      position TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (preset_id) REFERENCES presets(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS devices (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      preset_id INTEGER,
      type TEXT NOT NULL,
      name TEXT NOT NULL,
      status TEXT DEFAULT 'running',
      power INTEGER DEFAULT 100,
      last_maintenance DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (preset_id) REFERENCES presets(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS water_parameters (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      preset_id INTEGER,
      temperature REAL DEFAULT 25.0,
      ph REAL DEFAULT 7.0,
      ammonia REAL DEFAULT 0.0,
      nitrite REAL DEFAULT 0.0,
      nitrate REAL DEFAULT 20.0,
      oxygen REAL DEFAULT 8.0,
      salinity REAL DEFAULT 1.025,
      clarity REAL DEFAULT 100,
      algae_level REAL DEFAULT 0,
      recorded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (preset_id) REFERENCES presets(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS lighting_schedule (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      preset_id INTEGER,
      name TEXT NOT NULL,
      start_time TIME NOT NULL,
      end_time TIME NOT NULL,
      intensity INTEGER DEFAULT 100,
      color_temperature INTEGER DEFAULT 6500,
      is_active BOOLEAN DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (preset_id) REFERENCES presets(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS feeding_schedule (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      preset_id INTEGER,
      name TEXT NOT NULL,
      time TIME NOT NULL,
      amount REAL DEFAULT 1.0,
      food_type TEXT DEFAULT 'flakes',
      is_active BOOLEAN DEFAULT 1,
      last_executed DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (preset_id) REFERENCES presets(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS device_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      device_id INTEGER,
      event_type TEXT NOT NULL,
      details TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (device_id) REFERENCES devices(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS alerts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      preset_id INTEGER,
      type TEXT NOT NULL,
      severity TEXT DEFAULT 'warning',
      message TEXT NOT NULL,
      is_resolved BOOLEAN DEFAULT 0,
      resolved_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (preset_id) REFERENCES presets(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS current_state (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      active_preset_id INTEGER,
      last_updated DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (active_preset_id) REFERENCES presets(id)
    );
  `);

  console.log('Database tables initialized successfully');
}

module.exports = { initDatabase };
