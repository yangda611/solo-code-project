import initSqlJs from 'sql.js';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

let db = null;

export async function initDatabase() {
  const SQL = await initSqlJs();
  
  db = new SQL.Database();
  
  db.run(`
    CREATE TABLE IF NOT EXISTS games (
      id TEXT PRIMARY KEY,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      game_data TEXT NOT NULL
    )
  `);
  
  db.run(`
    CREATE TABLE IF NOT EXISTS replays (
      id TEXT PRIMARY KEY,
      game_id TEXT NOT NULL,
      created_at TEXT NOT NULL,
      replay_data TEXT NOT NULL,
      FOREIGN KEY (game_id) REFERENCES games(id)
    )
  `);
  
  db.run(`
    CREATE TABLE IF NOT EXISTS rules (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      config TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )
  `);
  
  const defaultConfig = JSON.stringify({
    name: '国标麻将',
    type: 'guobiao',
    totalTiles: 144,
    handSize: 13,
    allowChi: true,
    allowPeng: true,
    allowGang: true,
    allowHu: true,
    allowKongAfterKong: true,
    allowRobKong: true,
    allowLastTileHu: true,
    allowSelfDrawn: true,
    minFan: 8,
    fanTypes: []
  });
  
  const existing = db.exec("SELECT id FROM rules WHERE name = '国标麻将'");
  if (existing.length === 0 || existing[0].values.length === 0) {
    const now = new Date().toISOString();
    db.run(
      'INSERT INTO rules (name, config, created_at, updated_at) VALUES (?, ?, ?, ?)',
      ['国标麻将', defaultConfig, now, now]
    );
  }
  
  return db;
}

export function getDatabase() {
  if (!db) {
    throw new Error('数据库未初始化');
  }
  return db;
}
