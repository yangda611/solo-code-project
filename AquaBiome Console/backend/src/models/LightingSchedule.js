const db = require('../config/database');

const LightingSchedule = {
  getAll: (presetId) => {
    if (presetId) {
      return db.prepare('SELECT * FROM lighting_schedule WHERE preset_id = ? ORDER BY id').all(presetId);
    }
    return db.prepare('SELECT * FROM lighting_schedule ORDER BY id').all();
  },

  getById: (id) => {
    return db.prepare('SELECT * FROM lighting_schedule WHERE id = ?').get(id);
  },

  create: (data) => {
    const result = db.prepare(`
      INSERT INTO lighting_schedule (preset_id, name, start_time, end_time, intensity, color_temperature, is_active)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(data.preset_id, data.name, data.start_time, data.end_time, data.intensity || 100, data.color_temperature || 6500, data.is_active !== false ? 1 : 0);
    return { id: result.lastInsertRowid, ...data };
  },

  update: (id, data) => {
    db.prepare(`
      UPDATE lighting_schedule SET 
        name = ?, start_time = ?, end_time = ?, intensity = ?, 
        color_temperature = ?, is_active = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(data.name, data.start_time, data.end_time, data.intensity, data.color_temperature, data.is_active ? 1 : 0, id);
    return LightingSchedule.getById(id);
  },

  toggleActive: (id) => {
    const current = LightingSchedule.getById(id);
    const newStatus = current.is_active ? 0 : 1;
    db.prepare('UPDATE lighting_schedule SET is_active = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(newStatus, id);
    return LightingSchedule.getById(id);
  },

  delete: (id) => {
    const result = db.prepare('DELETE FROM lighting_schedule WHERE id = ?').run(id);
    return result.changes > 0;
  }
};

module.exports = LightingSchedule;
