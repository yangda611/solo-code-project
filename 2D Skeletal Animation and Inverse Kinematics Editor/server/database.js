const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'skeletal_editor.db');
const db = new sqlite3.Database(dbPath);

function initDatabase() {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      db.run(`CREATE TABLE IF NOT EXISTS presets (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE,
        description TEXT,
        bones_data TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`);

      db.run(`CREATE TABLE IF NOT EXISTS keyframes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        preset_id INTEGER,
        frame_number INTEGER NOT NULL,
        bones_angles TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (preset_id) REFERENCES presets(id)
      )`);

      db.run(`CREATE TABLE IF NOT EXISTS skin_weights (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        preset_id INTEGER,
        vertex_index INTEGER NOT NULL,
        bone_id TEXT NOT NULL,
        weight REAL NOT NULL,
        FOREIGN KEY (preset_id) REFERENCES presets(id)
      )`);

      db.run(`CREATE TABLE IF NOT EXISTS mesh_vertices (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        preset_id INTEGER,
        vertex_index INTEGER NOT NULL,
        x REAL NOT NULL,
        y REAL NOT NULL,
        FOREIGN KEY (preset_id) REFERENCES presets(id)
      )`);

      resolve();
    });
  });
}

function savePreset(name, description, bonesData) {
  return new Promise((resolve, reject) => {
    db.run(
      `INSERT OR REPLACE INTO presets (name, description, bones_data) VALUES (?, ?, ?)`,
      [name, description, JSON.stringify(bonesData)],
      function(err) {
        if (err) reject(err);
        else resolve(this.lastID);
      }
    );
  });
}

function getPreset(name) {
  return new Promise((resolve, reject) => {
    db.get(`SELECT * FROM presets WHERE name = ?`, [name], (err, row) => {
      if (err) reject(err);
      else if (row) {
        row.bones_data = JSON.parse(row.bones_data);
        resolve(row);
      } else {
        resolve(null);
      }
    });
  });
}

function getAllPresets() {
  return new Promise((resolve, reject) => {
    db.all(`SELECT id, name, description, created_at FROM presets`, [], (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
}

function saveKeyframe(presetId, frameNumber, bonesAngles) {
  return new Promise((resolve, reject) => {
    db.run(
      `INSERT OR REPLACE INTO keyframes (preset_id, frame_number, bones_angles) VALUES (?, ?, ?)`,
      [presetId, frameNumber, JSON.stringify(bonesAngles)],
      function(err) {
        if (err) reject(err);
        else resolve(this.lastID);
      }
    );
  });
}

function getKeyframes(presetId) {
  return new Promise((resolve, reject) => {
    db.all(`SELECT * FROM keyframes WHERE preset_id = ? ORDER BY frame_number`, [presetId], (err, rows) => {
      if (err) reject(err);
      else {
        rows.forEach(row => {
          row.bones_angles = JSON.parse(row.bones_angles);
        });
        resolve(rows);
      }
    });
  });
}

function saveMesh(presetId, vertices) {
  return new Promise((resolve, reject) => {
    const stmt = db.prepare(`INSERT OR REPLACE INTO mesh_vertices (preset_id, vertex_index, x, y) VALUES (?, ?, ?, ?)`);
    vertices.forEach((v, i) => {
      stmt.run(presetId, i, v.x, v.y);
    });
    stmt.finalize((err) => {
      if (err) reject(err);
      else resolve();
    });
  });
}

function saveSkinWeights(presetId, weights) {
  return new Promise((resolve, reject) => {
    const stmt = db.prepare(`INSERT OR REPLACE INTO skin_weights (preset_id, vertex_index, bone_id, weight) VALUES (?, ?, ?, ?)`);
    weights.forEach(w => {
      stmt.run(presetId, w.vertexIndex, w.boneId, w.weight);
    });
    stmt.finalize((err) => {
      if (err) reject(err);
      else resolve();
    });
  });
}

function getMeshAndWeights(presetId) {
  return new Promise((resolve, reject) => {
    db.all(`SELECT * FROM mesh_vertices WHERE preset_id = ? ORDER BY vertex_index`, [presetId], (err, vertices) => {
      if (err) {
        reject(err);
        return;
      }
      db.all(`SELECT * FROM skin_weights WHERE preset_id = ?`, [presetId], (err, weights) => {
        if (err) reject(err);
        else resolve({ vertices, weights });
      });
    });
  });
}

module.exports = {
  db,
  initDatabase,
  savePreset,
  getPreset,
  getAllPresets,
  saveKeyframe,
  getKeyframes,
  saveMesh,
  saveSkinWeights,
  getMeshAndWeights
};
