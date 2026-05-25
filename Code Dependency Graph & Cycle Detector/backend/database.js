const initSqlJs = require('sql.js');
const path = require('path');
const fs = require('fs');

const dbPath = path.join(__dirname, 'dependency_analyzer.db');

let db = null;
let SQL = null;

async function initDatabase() {
  if (db) return db;

  try {
    SQL = await initSqlJs();
    
    if (fs.existsSync(dbPath)) {
      const fileBuffer = fs.readFileSync(dbPath);
      db = new SQL.Database(fileBuffer);
      console.log('Loaded existing database from file');
    } else {
      db = new SQL.Database();
      console.log('Created new in-memory database');
    }

    db.run(`
      CREATE TABLE IF NOT EXISTS snapshots (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        graph_data TEXT NOT NULL
      )
    `);

    db.run(`
      CREATE TABLE IF NOT EXISTS refactoring_suggestions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        snapshot_id INTEGER,
        cycle_path TEXT NOT NULL,
        suggestion TEXT NOT NULL,
        impact_score REAL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (snapshot_id) REFERENCES snapshots(id)
      )
    `);

    saveToFile();
    console.log('Database initialized successfully');
    return db;
  } catch (error) {
    console.error('Failed to initialize database:', error);
    throw error;
  }
}

function saveToFile() {
  try {
    const data = db.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(dbPath, buffer);
  } catch (error) {
    console.error('Failed to save database to file:', error);
  }
}

function saveSnapshot(name, graphData) {
  return new Promise(async (resolve, reject) => {
    try {
      if (!db) await initDatabase();
      
      const stmt = db.prepare(
        'INSERT INTO snapshots (name, graph_data) VALUES (?, ?)'
      );
      stmt.run([name, JSON.stringify(graphData)]);
      stmt.free();
      
      const result = db.exec('SELECT last_insert_rowid() as id');
      const id = result[0].values[0][0];
      
      saveToFile();
      resolve(id);
    } catch (error) {
      reject(error);
    }
  });
}

function getSnapshots() {
  return new Promise(async (resolve, reject) => {
    try {
      if (!db) await initDatabase();
      
      const result = db.exec(
        'SELECT * FROM snapshots ORDER BY created_at DESC'
      );
      
      if (result.length === 0) {
        resolve([]);
        return;
      }
      
      const columns = result[0].columns;
      const rows = result[0].values.map(values => {
        const row = {};
        columns.forEach((col, i) => {
          row[col] = values[i];
        });
        return row;
      });
      
      resolve(rows);
    } catch (error) {
      reject(error);
    }
  });
}

function getSnapshot(id) {
  return new Promise(async (resolve, reject) => {
    try {
      if (!db) await initDatabase();
      
      const result = db.exec(
        'SELECT * FROM snapshots WHERE id = ?',
        [parseInt(id)]
      );
      
      if (result.length === 0 || result[0].values.length === 0) {
        resolve(null);
        return;
      }
      
      const columns = result[0].columns;
      const values = result[0].values[0];
      const row = {};
      columns.forEach((col, i) => {
        row[col] = values[i];
      });
      
      if (row.graph_data) {
        row.graph_data = JSON.parse(row.graph_data);
      }
      
      resolve(row);
    } catch (error) {
      reject(error);
    }
  });
}

function saveRefactoringSuggestion(snapshotId, cyclePath, suggestion, impactScore) {
  return new Promise(async (resolve, reject) => {
    try {
      if (!db) await initDatabase();
      
      const stmt = db.prepare(
        'INSERT INTO refactoring_suggestions (snapshot_id, cycle_path, suggestion, impact_score) VALUES (?, ?, ?, ?)'
      );
      stmt.run([parseInt(snapshotId), cyclePath, suggestion, impactScore || 0]);
      stmt.free();
      
      const result = db.exec('SELECT last_insert_rowid() as id');
      const id = result[0].values[0][0];
      
      saveToFile();
      resolve({ lastID: id, changes: 1 });
    } catch (error) {
      reject(error);
    }
  });
}

function getRefactoringSuggestions(snapshotId) {
  return new Promise(async (resolve, reject) => {
    try {
      if (!db) await initDatabase();
      
      const result = db.exec(
        'SELECT * FROM refactoring_suggestions WHERE snapshot_id = ? ORDER BY impact_score DESC',
        [parseInt(snapshotId)]
      );
      
      if (result.length === 0) {
        resolve([]);
        return;
      }
      
      const columns = result[0].columns;
      const rows = result[0].values.map(values => {
        const row = {};
        columns.forEach((col, i) => {
          row[col] = values[i];
        });
        return row;
      });
      
      resolve(rows);
    } catch (error) {
      reject(error);
    }
  });
}

initDatabase().catch(err => {
  console.error('Database initialization failed on startup:', err);
});

module.exports = {
  initDatabase,
  saveSnapshot,
  getSnapshots,
  getSnapshot,
  saveRefactoringSuggestion,
  getRefactoringSuggestions
};
