const db = require('../config/database');

const Device = {
  getAll: (presetId) => {
    if (presetId) {
      return db.prepare('SELECT * FROM devices WHERE preset_id = ? ORDER BY id').all(presetId);
    }
    return db.prepare('SELECT * FROM devices ORDER BY id').all();
  },

  getById: (id) => {
    return db.prepare('SELECT * FROM devices WHERE id = ?').get(id);
  },

  getByType: (presetId, type) => {
    return db.prepare('SELECT * FROM devices WHERE preset_id = ? AND type = ?').all(presetId, type);
  },

  create: (data) => {
    const result = db.prepare(`
      INSERT INTO devices (preset_id, type, name, status, power, last_maintenance)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(data.preset_id, data.type, data.name, data.status || 'running', data.power || 100, data.last_maintenance);
    return { id: result.lastInsertRowid, ...data };
  },

  update: (id, data) => {
    db.prepare(`
      UPDATE devices SET 
        type = ?, name = ?, status = ?, power = ?, 
        last_maintenance = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(data.type, data.name, data.status, data.power, data.last_maintenance, id);
    return Device.getById(id);
  },

  updateStatus: (id, status, power) => {
    db.prepare(`
      UPDATE devices SET status = ?, power = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?
    `).run(status, power, id);
    return Device.getById(id);
  },

  delete: (id) => {
    const result = db.prepare('DELETE FROM devices WHERE id = ?').run(id);
    return result.changes > 0;
  }
};

module.exports = Device;
