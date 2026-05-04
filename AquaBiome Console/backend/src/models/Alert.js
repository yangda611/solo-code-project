const db = require('../config/database');

const Alert = {
  getAll: (presetId, includeResolved = false) => {
    let query = 'SELECT * FROM alerts WHERE 1=1';
    const params = [];
    
    if (presetId) {
      query += ' AND preset_id = ?';
      params.push(presetId);
    }
    
    if (!includeResolved) {
      query += ' AND is_resolved = 0';
    }
    
    query += ' ORDER BY created_at DESC';
    
    return db.prepare(query).all(...params);
  },

  getById: (id) => {
    return db.prepare('SELECT * FROM alerts WHERE id = ?').get(id);
  },

  create: (data) => {
    const result = db.prepare(`
      INSERT INTO alerts (preset_id, type, severity, message, is_resolved)
      VALUES (?, ?, ?, ?, ?)
    `).run(data.preset_id, data.type, data.severity || 'warning', data.message, 0);
    return { id: result.lastInsertRowid, ...data, is_resolved: 0 };
  },

  resolve: (id) => {
    db.prepare(`
      UPDATE alerts SET is_resolved = 1, resolved_at = CURRENT_TIMESTAMP WHERE id = ?
    `).run(id);
    return Alert.getById(id);
  },

  delete: (id) => {
    const result = db.prepare('DELETE FROM alerts WHERE id = ?').run(id);
    return result.changes > 0;
  }
};

module.exports = Alert;
