const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const dataDir = path.join(__dirname, '..', 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'ray-tracing.db');
const db = new Database(dbPath);

db.exec(`
  CREATE TABLE IF NOT EXISTS scenes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS obstacles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    scene_id INTEGER NOT NULL,
    x1 REAL NOT NULL,
    y1 REAL NOT NULL,
    x2 REAL NOT NULL,
    y2 REAL NOT NULL,
    material TEXT DEFAULT 'mirror',
    refractive_index REAL DEFAULT 1.5,
    FOREIGN KEY (scene_id) REFERENCES scenes(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS lights (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    scene_id INTEGER NOT NULL,
    x REAL NOT NULL,
    y REAL NOT NULL,
    type TEXT DEFAULT 'point',
    angle REAL DEFAULT 0,
    beam_width REAL DEFAULT 100,
    beam_step REAL DEFAULT 5,
    num_rays INTEGER DEFAULT 36,
    FOREIGN KEY (scene_id) REFERENCES scenes(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS presets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT
  );
`);

function createScene(name) {
  const stmt = db.prepare('INSERT INTO scenes (name) VALUES (?)');
  const result = stmt.run(name);
  return result.lastInsertRowid;
}

function getScenes() {
  return db.prepare('SELECT * FROM scenes ORDER BY created_at DESC').all();
}

function deleteScene(id) {
  db.prepare('DELETE FROM scenes WHERE id = ?').run(id);
}

function addObstacle(sceneId, obstacle) {
  const stmt = db.prepare(`
    INSERT INTO obstacles (scene_id, x1, y1, x2, y2, material, refractive_index)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  const result = stmt.run(
    sceneId,
    obstacle.x1, obstacle.y1,
    obstacle.x2, obstacle.y2,
    obstacle.material || 'mirror',
    obstacle.refractiveIndex || 1.5
  );
  return result.lastInsertRowid;
}

function getObstacles(sceneId) {
  return db.prepare('SELECT * FROM obstacles WHERE scene_id = ?').all(sceneId);
}

function deleteObstacle(id) {
  db.prepare('DELETE FROM obstacles WHERE id = ?').run(id);
}

function addLight(sceneId, light) {
  const stmt = db.prepare(`
    INSERT INTO lights (scene_id, x, y, type, angle, beam_width, beam_step, num_rays)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const result = stmt.run(
    sceneId,
    light.x, light.y,
    light.type || 'point',
    light.angle || 0,
    light.beamWidth || 100,
    light.beamStep || 5,
    light.numRays || 36
  );
  return result.lastInsertRowid;
}

function getLights(sceneId) {
  return db.prepare('SELECT * FROM lights WHERE scene_id = ?').all(sceneId);
}

function deleteLight(id) {
  db.prepare('DELETE FROM lights WHERE id = ?').run(id);
}

const presets = [
  {
    name: '平行光束进入半圆形透镜的聚焦发散异常',
    obstacles: [
      { x1: 300, y1: 100, x2: 500, y2: 100, material: 'transparent', refractiveIndex: 1.5 },
      { x1: 500, y1: 100, x2: 550, y2: 150, material: 'transparent', refractiveIndex: 1.5 },
      { x1: 550, y1: 150, x2: 550, y2: 250, material: 'transparent', refractiveIndex: 1.5 },
      { x1: 550, y1: 250, x2: 500, y2: 300, material: 'transparent', refractiveIndex: 1.5 },
      { x1: 500, y1: 300, x2: 300, y2: 300, material: 'transparent', refractiveIndex: 1.5 }
    ],
    lights: [{ x: 100, y: 200, type: 'parallel', angle: 0, beamWidth: 150, beamStep: 3 }]
  },
  {
    name: '多反射面形成闭合光路的无限循环检测',
    obstacles: [
      { x1: 200, y1: 150, x2: 400, y2: 150, material: 'mirror' },
      { x1: 400, y1: 150, x2: 450, y2: 300, material: 'mirror' },
      { x1: 450, y1: 300, x2: 300, y2: 350, material: 'mirror' },
      { x1: 300, y1: 350, x2: 200, y2: 250, material: 'mirror' },
      { x1: 200, y1: 250, x2: 200, y2: 150, material: 'mirror' }
    ],
    lights: [{ x: 300, y: 250, type: 'point', numRays: 12 }]
  },
  {
    name: '完全吸收边界的能量突然归零',
    obstacles: [
      { x1: 100, y1: 100, x2: 700, y2: 100, material: 'absorber' },
      { x1: 700, y1: 100, x2: 700, y2: 400, material: 'absorber' },
      { x1: 700, y1: 400, x2: 100, y2: 400, material: 'absorber' },
      { x1: 100, y1: 400, x2: 100, y2: 100, material: 'absorber' },
      { x1: 300, y1: 200, x2: 500, y2: 200, material: 'mirror' }
    ],
    lights: [{ x: 400, y: 300, type: 'point', numRays: 24 }]
  },
  {
    name: '掠入射时的全反射临界角可视化',
    obstacles: [
      { x1: 350, y1: 50, x2: 350, y2: 400, material: 'transparent', refractiveIndex: 1.5 },
      { x1: 350, y1: 50, x2: 650, y2: 50, material: 'transparent', refractiveIndex: 1.5 },
      { x1: 650, y1: 50, x2: 650, y2: 400, material: 'transparent', refractiveIndex: 1.5 },
      { x1: 650, y1: 400, x2: 350, y2: 400, material: 'transparent', refractiveIndex: 1.5 }
    ],
    lights: [{ x: 150, y: 225, type: 'parallel', angle: 0.3, beamWidth: 200, beamStep: 2 }]
  }
];

function getPresets() {
  return presets;
}

function loadPreset(index) {
  if (index < 0 || index >= presets.length) return null;
  return presets[index];
}

module.exports = {
  createScene,
  getScenes,
  deleteScene,
  addObstacle,
  getObstacles,
  deleteObstacle,
  addLight,
  getLights,
  deleteLight,
  getPresets,
  loadPreset
};
