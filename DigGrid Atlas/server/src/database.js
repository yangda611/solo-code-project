const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, '../data/archaeology.db');
const DB_DIR = path.join(__dirname, '../data');

let db = null;

async function initDatabase() {
  if (!fs.existsSync(DB_DIR)) {
    fs.mkdirSync(DB_DIR, { recursive: true });
  }

  const SQL = await initSqlJs();
  
  if (fs.existsSync(DB_PATH)) {
    const buffer = fs.readFileSync(DB_PATH);
    db = new SQL.Database(buffer);
  } else {
    db = new SQL.Database();
  }

  createTables();
  
  if (!fs.existsSync(DB_PATH)) {
    insertPresetData();
  }
  
  saveDatabase();
  
  return db;
}

function createTables() {
  db.run(`
    CREATE TABLE IF NOT EXISTS squares (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      code TEXT NOT NULL UNIQUE,
      description TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS layers (
      id TEXT PRIMARY KEY,
      square_id TEXT NOT NULL,
      name TEXT NOT NULL,
      color TEXT DEFAULT '#8B4513',
      depth_start REAL DEFAULT 0,
      depth_end REAL DEFAULT 0,
      description TEXT,
      order_index INTEGER DEFAULT 0,
      is_stripped INTEGER DEFAULT 0,
      FOREIGN KEY (square_id) REFERENCES squares(id)
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS artifacts (
      id TEXT PRIMARY KEY,
      square_id TEXT NOT NULL,
      layer_id TEXT,
      code TEXT NOT NULL,
      type TEXT NOT NULL,
      name TEXT,
      description TEXT,
      position_x REAL DEFAULT 0,
      position_y REAL DEFAULT 0,
      position_z REAL DEFAULT 0,
      status TEXT DEFAULT 'found',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (square_id) REFERENCES squares(id),
      FOREIGN KEY (layer_id) REFERENCES layers(id)
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS boundaries (
      id TEXT PRIMARY KEY,
      square_id TEXT NOT NULL,
      layer_id TEXT,
      name TEXT NOT NULL,
      type TEXT DEFAULT 'relic',
      points TEXT NOT NULL,
      color TEXT DEFAULT '#FF0000',
      description TEXT,
      FOREIGN KEY (square_id) REFERENCES squares(id),
      FOREIGN KEY (layer_id) REFERENCES layers(id)
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS logs (
      id TEXT PRIMARY KEY,
      square_id TEXT NOT NULL,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (square_id) REFERENCES squares(id)
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS presets (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      code TEXT NOT NULL UNIQUE,
      description TEXT,
      data TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);
}

function insertPresetData() {
  const presets = [
    {
      id: 'preset-complete-tomb',
      name: '完整墓葬探方',
      code: 'complete-tomb',
      description: '包含完整墓葬结构的标准探方场景',
      data: JSON.stringify({
        square: {
          name: '完整墓葬探方',
          code: 'T1',
          description: '包含完整墓葬结构的标准探方场景'
        },
        layers: [
          { name: '表土层', color: '#654321', depth_start: 0, depth_end: 0.3, order_index: 0 },
          { name: '近代层', color: '#8B7355', depth_start: 0.3, depth_end: 0.8, order_index: 1 },
          { name: '汉代层', color: '#A0522D', depth_start: 0.8, depth_end: 1.5, order_index: 2 },
          { name: '墓葬层', color: '#5C4033', depth_start: 1.5, depth_end: 2.5, order_index: 3 }
        ],
        artifacts: [
          { code: 'W001', type: 'pottery', name: '陶鼎', position_x: 1, position_y: -1.8, position_z: 1 },
          { code: 'W002', type: 'pottery', name: '陶壶', position_x: -1, position_y: -1.8, position_z: 1 },
          { code: 'W003', type: 'bone', name: '人骨遗骸', position_x: 0, position_y: -2, position_z: 0 },
          { code: 'W004', type: 'copper', name: '铜镜', position_x: 0.5, position_y: -1.9, position_z: 0 },
          { code: 'W005', type: 'stone', name: '石璧', position_x: -0.5, position_y: -1.9, position_z: 0 }
        ],
        boundaries: [
          { name: '墓葬边界', type: 'tomb', points: JSON.stringify([
            { x: -1.5, y: 0, z: -2 },
            { x: 1.5, y: 0, z: -2 },
            { x: 1.5, y: 0, z: 2 },
            { x: -1.5, y: 0, z: 2 }
          ]), color: '#FF4444' }
        ]
      })
    },
    {
      id: 'preset-chaotic-layers',
      name: '土层混乱探方',
      code: 'chaotic-layers',
      description: '包含多个扰动层和混合堆积的复杂场景',
      data: JSON.stringify({
        square: {
          name: '土层混乱探方',
          code: 'T2',
          description: '包含多个扰动层和混合堆积的复杂场景'
        },
        layers: [
          { name: '表土层', color: '#654321', depth_start: 0, depth_end: 0.4, order_index: 0 },
          { name: '扰动层A', color: '#9E8B6D', depth_start: 0.4, depth_end: 0.9, order_index: 1 },
          { name: '近代层', color: '#8B7355', depth_start: 0.9, depth_end: 1.2, order_index: 2 },
          { name: '扰动层B', color: '#A67B5B', depth_start: 1.2, depth_end: 1.8, order_index: 3 },
          { name: '宋代层', color: '#8B6914', depth_start: 1.8, depth_end: 2.2, order_index: 4 }
        ],
        artifacts: [
          { code: 'W006', type: 'pottery', name: '瓷片', position_x: 0.8, position_y: -0.6, position_z: 0.5 },
          { code: 'W007', type: 'stone', name: '石斧残片', position_x: -0.5, position_y: -1.5, position_z: 0.3 },
          { code: 'W008', type: 'pottery', name: '陶碗', position_x: 0.3, position_y: -1, position_z: -0.8 },
          { code: 'W009', type: 'copper', name: '铜钱', position_x: -1, position_y: -2, position_z: 0 }
        ],
        boundaries: [
          { name: '灰坑H1', type: 'pit', points: JSON.stringify([
            { x: -0.5, y: 0, z: -0.5 },
            { x: 0.8, y: 0, z: -0.5 },
            { x: 0.8, y: 0, z: 0.8 },
            { x: -0.5, y: 0, z: 0.8 }
          ]), color: '#44AA44' }
        ]
      })
    },
    {
      id: 'preset-mislabeled-artifacts',
      name: '文物标记错误',
      code: 'mislabeled-artifacts',
      description: '包含标记错误文物的教学场景',
      data: JSON.stringify({
        square: {
          name: '文物标记错误探方',
          code: 'T3',
          description: '包含标记错误文物的教学场景'
        },
        layers: [
          { name: '表土层', color: '#654321', depth_start: 0, depth_end: 0.35, order_index: 0 },
          { name: '清代层', color: '#8B7355', depth_start: 0.35, depth_end: 0.8, order_index: 1 },
          { name: '明代层', color: '#A0522D', depth_start: 0.8, depth_end: 1.5, order_index: 2 }
        ],
        artifacts: [
          { code: 'W010', type: 'pottery', name: '青花瓷碗', position_x: 1, position_y: -0.5, position_z: 0.5 },
          { code: 'W011', type: 'copper', name: '铜簪', position_x: -0.8, position_y: -1, position_z: -0.3 },
          { code: 'W012', type: 'bone', name: '兽骨', position_x: 0.2, position_y: -1.2, position_z: 0.8 },
          { code: 'W013', type: 'pottery', name: '陶罐', position_x: -0.3, position_y: -0.6, position_z: 1 }
        ],
        boundaries: []
      })
    },
    {
      id: 'preset-standard-teaching',
      name: '标准教学探方',
      code: 'standard-teaching',
      description: '适合考古教学的标准层位探方',
      data: JSON.stringify({
        square: {
          name: '标准教学探方',
          code: 'T4',
          description: '适合考古教学的标准层位探方'
        },
        layers: [
          { name: '表土层', color: '#654321', depth_start: 0, depth_end: 0.3, order_index: 0 },
          { name: '现代层', color: '#7B6B4F', depth_start: 0.3, depth_end: 0.5, order_index: 1 },
          { name: '近代层', color: '#8B7355', depth_start: 0.5, depth_end: 0.9, order_index: 2 },
          { name: '明清层', color: '#9B7B55', depth_start: 0.9, depth_end: 1.3, order_index: 3 },
          { name: '宋元层', color: '#A0522D', depth_start: 1.3, depth_end: 1.8, order_index: 4 },
          { name: '唐代层', color: '#8B6914', depth_start: 1.8, depth_end: 2.3, order_index: 5 },
          { name: '汉代层', color: '#5C4033', depth_start: 2.3, depth_end: 3, order_index: 6 }
        ],
        artifacts: [
          { code: 'W014', type: 'pottery', name: '瓷片（近代）', position_x: 0.5, position_y: -0.7, position_z: 0.3 },
          { code: 'W015', type: 'copper', name: '铜钱（明清）', position_x: -0.6, position_y: -1.1, position_z: 0.5 },
          { code: 'W016', type: 'pottery', name: '瓷碗（宋元）', position_x: 0.8, position_y: -1.5, position_z: -0.4 },
          { code: 'W017', type: 'bone', name: '人骨（唐代）', position_x: 0, position_y: -2, position_z: 0 },
          { code: 'W018', type: 'stone', name: '石砚（汉代）', position_x: -0.5, position_y: -2.6, position_z: 0.2 }
        ],
        boundaries: [
          { name: '房基F1', type: 'foundation', points: JSON.stringify([
            { x: -2, y: 0, z: -1 },
            { x: 2, y: 0, z: -1 },
            { x: 2, y: 0, z: 1 },
            { x: -2, y: 0, z: 1 }
          ]), color: '#4444FF' }
        ]
      })
    }
  ];

  const stmt = db.prepare(`
    INSERT OR IGNORE INTO presets (id, name, code, description, data, created_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  for (const preset of presets) {
    stmt.run([
      preset.id,
      preset.name,
      preset.code,
      preset.description,
      preset.data,
      new Date().toISOString()
    ]);
  }

  stmt.free();
}

function saveDatabase() {
  if (db) {
    const data = db.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(DB_PATH, buffer);
  }
}

function getDatabase() {
  return db;
}

module.exports = {
  initDatabase,
  getDatabase,
  saveDatabase
};