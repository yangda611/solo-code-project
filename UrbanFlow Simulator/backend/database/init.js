const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'urbanflow.db');
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
  // 路口表
  db.run(`
    CREATE TABLE IF NOT EXISTS intersections (
      id TEXT PRIMARY KEY,
      x REAL NOT NULL,
      y REAL NOT NULL,
      name TEXT,
      type TEXT DEFAULT 'normal',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // 道路表
  db.run(`
    CREATE TABLE IF NOT EXISTS roads (
      id TEXT PRIMARY KEY,
      start_intersection_id TEXT NOT NULL,
      end_intersection_id TEXT NOT NULL,
      name TEXT,
      length REAL NOT NULL,
      lanes INTEGER DEFAULT 2,
      speed_limit INTEGER DEFAULT 60,
      capacity INTEGER DEFAULT 100,
      direction TEXT DEFAULT 'two-way',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (start_intersection_id) REFERENCES intersections(id),
      FOREIGN KEY (end_intersection_id) REFERENCES intersections(id)
    )
  `);

  // 红绿灯表
  db.run(`
    CREATE TABLE IF NOT EXISTS traffic_lights (
      id TEXT PRIMARY KEY,
      intersection_id TEXT NOT NULL,
      road_id TEXT NOT NULL,
      phase INTEGER DEFAULT 0,
      green_duration INTEGER DEFAULT 30,
      yellow_duration INTEGER DEFAULT 3,
      red_duration INTEGER DEFAULT 30,
      current_color TEXT DEFAULT 'red',
      timer INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (intersection_id) REFERENCES intersections(id),
      FOREIGN KEY (road_id) REFERENCES roads(id)
    )
  `);

  // 车辆生成点表
  db.run(`
    CREATE TABLE IF NOT EXISTS spawn_points (
      id TEXT PRIMARY KEY,
      road_id TEXT NOT NULL,
      position REAL DEFAULT 0,
      direction TEXT DEFAULT 'forward',
      spawn_rate INTEGER DEFAULT 5,
      min_speed INTEGER DEFAULT 40,
      max_speed INTEGER DEFAULT 60,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (road_id) REFERENCES roads(id)
    )
  `);

  // 仿真统计数据表
  db.run(`
    CREATE TABLE IF NOT EXISTS simulation_stats (
      id TEXT PRIMARY KEY,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      total_vehicles INTEGER DEFAULT 0,
      congestion_index REAL DEFAULT 0,
      avg_travel_time REAL DEFAULT 0,
      accident_risk REAL DEFAULT 0,
      avg_speed REAL DEFAULT 0
    )
  `);

  console.log('数据库初始化完成');
});

db.close();
