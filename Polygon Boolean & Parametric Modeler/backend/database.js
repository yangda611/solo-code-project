const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');

class PolygonDatabase {
  constructor() {
    this.dbPath = path.join(__dirname, 'polygons.db');
    this.db = null;
    this.SQL = null;
  }

  async init() {
    this.SQL = await initSqlJs();
    
    if (fs.existsSync(this.dbPath)) {
      const fileBuffer = fs.readFileSync(this.dbPath);
      this.db = new this.SQL.Database(fileBuffer);
    } else {
      this.db = new this.SQL.Database();
    }
    
    this.createTables();
    this.saveToFile();
  }

  createTables() {
    this.db.run(`
      CREATE TABLE IF NOT EXISTS polygons (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT,
        points TEXT NOT NULL,
        is_hole INTEGER DEFAULT 0,
        color TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    this.db.run(`
      CREATE TABLE IF NOT EXISTS operations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        operation_type TEXT NOT NULL,
        subject_id INTEGER,
        clip_id INTEGER,
        result_points TEXT,
        status TEXT DEFAULT 'completed',
        error_message TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (subject_id) REFERENCES polygons (id),
        FOREIGN KEY (clip_id) REFERENCES polygons (id)
      )
    `);

    this.db.run(`
      CREATE TABLE IF NOT EXISTS intersection_points (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        operation_id INTEGER,
        x REAL NOT NULL,
        y REAL NOT NULL,
        type TEXT,
        FOREIGN KEY (operation_id) REFERENCES operations (id)
      )
    `);
  }

  saveToFile() {
    const data = this.db.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(this.dbPath, buffer);
  }

  savePolygon(name, points, isHole = false, color = '#4A90D9') {
    const pointsJson = JSON.stringify(points);
    const stmt = this.db.prepare(
      'INSERT INTO polygons (name, points, is_hole, color) VALUES (?, ?, ?, ?)'
    );
    stmt.run([name, pointsJson, isHole ? 1 : 0, color]);
    const id = this.db.exec('SELECT last_insert_rowid() as id')[0].values[0][0];
    this.saveToFile();
    return Promise.resolve({ 
      id, 
      name, 
      points, 
      isHole, 
      color 
    });
  }

  getPolygon(id) {
    const stmt = this.db.prepare('SELECT * FROM polygons WHERE id = ?');
    const result = stmt.getAsObject([id]);
    const rows = this.db.exec('SELECT * FROM polygons WHERE id = ?', [id]);
    if (rows.length > 0 && rows[0].values.length > 0) {
      const values = rows[0].values[0];
      const columns = rows[0].columns;
      const row = {};
      columns.forEach((col, i) => row[col] = values[i]);
      row.points = JSON.parse(row.points);
      row.is_hole = row.is_hole === 1;
      return Promise.resolve(row);
    }
    return Promise.resolve(null);
  }

  getAllPolygons() {
    const rows = this.db.exec('SELECT * FROM polygons ORDER BY created_at DESC');
    const result = [];
    if (rows.length > 0) {
      const columns = rows[0].columns;
      rows[0].values.forEach(values => {
        const row = {};
        columns.forEach((col, i) => row[col] = values[i]);
        row.points = JSON.parse(row.points);
        row.is_hole = row.is_hole === 1;
        result.push(row);
      });
    }
    return Promise.resolve(result);
  }

  saveOperation(operationType, subjectId, clipId, resultPoints, intersections = []) {
    const resultJson = JSON.stringify(resultPoints);
    const stmt = this.db.prepare(
      'INSERT INTO operations (operation_type, subject_id, clip_id, result_points) VALUES (?, ?, ?, ?)'
    );
    stmt.run([operationType, subjectId, clipId, resultJson]);
    const operationId = this.db.exec('SELECT last_insert_rowid() as id')[0].values[0][0];
    
    this.saveIntersections(operationId, intersections);
    this.saveToFile();
    return Promise.resolve({ 
      id: operationId, 
      operationType, 
      subjectId, 
      clipId, 
      resultPoints, 
      intersections 
    });
  }

  saveIntersections(operationId, intersections) {
    const stmt = this.db.prepare(
      'INSERT INTO intersection_points (operation_id, x, y, type) VALUES (?, ?, ?, ?)'
    );
    intersections.forEach(intersection => {
      stmt.run([
        operationId, 
        intersection.point.x, 
        intersection.point.y, 
        intersection.type || 'normal'
      ]);
    });
  }

  getOperationHistory(limit = 50) {
    const rows = this.db.exec('SELECT * FROM operations ORDER BY created_at DESC LIMIT ?', [limit]);
    const result = [];
    if (rows.length > 0) {
      const columns = rows[0].columns;
      rows[0].values.forEach(values => {
        const row = {};
        columns.forEach((col, i) => row[col] = values[i]);
        row.result_points = JSON.parse(row.result_points);
        result.push(row);
      });
    }
    return Promise.resolve(result);
  }

  getOperationIntersections(operationId) {
    const rows = this.db.exec('SELECT * FROM intersection_points WHERE operation_id = ?', [operationId]);
    const result = [];
    if (rows.length > 0) {
      const columns = rows[0].columns;
      rows[0].values.forEach(values => {
        const row = {};
        columns.forEach((col, i) => row[col] = values[i]);
        result.push(row);
      });
    }
    return Promise.resolve(result);
  }

  deletePolygon(id) {
    const stmt = this.db.prepare('DELETE FROM polygons WHERE id = ?');
    stmt.run([id]);
    this.saveToFile();
    return Promise.resolve();
  }

  close() {
    if (this.db) {
      this.saveToFile();
      this.db.close();
    }
    return Promise.resolve();
  }
}

module.exports = PolygonDatabase;
