const db = require('../config/database');

const DeviceLog = {
  getAll: (deviceId, limit = 100) => {
    if (deviceId) {
      return db.prepare(`
        SELECT * FROM device_logs 
        WHERE device_id = ? 
        ORDER BY created_at DESC 
        LIMIT ?
      `).all(deviceId, limit);
    }
    return db.prepare(`
      SELECT * FROM device_logs 
      ORDER BY created_at DESC 
      LIMIT ?
    `).all(limit);
  },

  create: (data) => {
    const result = db.prepare(`
      INSERT INTO device_logs (device_id, event_type, details)
      VALUES (?, ?, ?)
    `).run(data.device_id, data.event_type, data.details);
    return { id: result.lastInsertRowid, ...data };
  },

  delete: (id) => {
    const result = db.prepare('DELETE FROM device_logs WHERE id = ?').run(id);
    return result.changes > 0;
  }
};

module.exports = DeviceLog;
