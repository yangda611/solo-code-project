const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '../fluid_optimizer.db');
let db;

function initDatabase() {
  return new Promise((resolve, reject) => {
    db = new sqlite3.Database(dbPath, (err) => {
      if (err) {
        reject(err);
        return;
      }
      console.log('SQLite 数据库连接成功');
      createTables();
      resolve();
    });
  });
}

function createTables() {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      const queries = [
        `CREATE TABLE IF NOT EXISTS projects (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          grid_size_x INTEGER,
          grid_size_y INTEGER,
          grid_size_z INTEGER,
          reynolds_min REAL,
          reynolds_max REAL,
          pressure_drop_constraint REAL,
          min_feature_size REAL
        )`,
        `CREATE TABLE IF NOT EXISTS density_fields (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          project_id INTEGER,
          iteration INTEGER,
          density_data TEXT,
          objective_value REAL,
          pressure_drop REAL,
          FOREIGN KEY (project_id) REFERENCES projects(id)
        )`,
        `CREATE TABLE IF NOT EXISTS velocity_fields (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          project_id INTEGER,
          iteration INTEGER,
          velocity_data TEXT,
          pressure_data TEXT,
          FOREIGN KEY (project_id) REFERENCES projects(id)
        )`,
        `CREATE TABLE IF NOT EXISTS boundary_conditions (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          project_id INTEGER,
          type TEXT,
          position_x REAL,
          position_y REAL,
          position_z REAL,
          size_x REAL,
          size_y REAL,
          size_z REAL,
          value REAL,
          FOREIGN KEY (project_id) REFERENCES projects(id)
        )`,
        `CREATE TABLE IF NOT EXISTS stl_exports (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          project_id INTEGER,
          filename TEXT,
          stl_data TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (project_id) REFERENCES projects(id)
        )`
      ];
      
      let completed = 0;
      queries.forEach(query => {
        db.run(query, (err) => {
          if (err) {
            console.error('创建表错误:', err);
            reject(err);
            return;
          }
          completed++;
          if (completed === queries.length) {
            console.log('数据库表创建完成');
            resolve();
          }
        });
      });
    });
  });
}

function runQuery(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function(err) {
      if (err) reject(err);
      else resolve({ lastID: this.lastID, changes: this.changes });
    });
  });
}

function getQuery(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
}

function allQuery(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
}

module.exports = {
  initDatabase,
  runQuery,
  getQuery,
  allQuery
};
