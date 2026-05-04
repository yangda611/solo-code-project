const db = require('../config/database');

const FeedingSchedule = {
  getAll: (presetId) => {
    if (presetId) {
      return db.prepare('SELECT * FROM feeding_schedule WHERE preset_id = ? ORDER BY id').all(presetId);
    }
    return db.prepare('SELECT * FROM feeding_schedule ORDER BY id').all();
  },

  getById: (id) => {
    return db.prepare('SELECT * FROM feeding_schedule WHERE id = ?').get(id);
  },

  create: (data) => {
    const result = db.prepare(`
      INSERT INTO feeding_schedule (preset_id, name, time, amount, food_type, is_active)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(data.preset_id, data.name, data.time, data.amount || 1.0, data.food_type || 'flakes', data.is_active !== false ? 1 : 0);
    return { id: result.lastInsertRowid, ...data };
  },

  update: (id, data) => {
    db.prepare(`
      UPDATE feeding_schedule SET 
        name = ?, time = ?, amount = ?, food_type = ?, 
        is_active = ?, last_executed = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(data.name, data.time, data.amount, data.food_type, data.is_active ? 1 : 0, data.last_executed, id);
    return FeedingSchedule.getById(id);
  },

  execute: (id) => {
    db.prepare(`
      UPDATE feeding_schedule SET last_executed = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE id = ?
    `).run(id);
    return FeedingSchedule.getById(id);
  },

  toggleActive: (id) => {
    const current = FeedingSchedule.getById(id);
    const newStatus = current.is_active ? 0 : 1;
    db.prepare('UPDATE feeding_schedule SET is_active = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(newStatus, id);
    return FeedingSchedule.getById(id);
  },

  delete: (id) => {
    const result = db.prepare('DELETE FROM feeding_schedule WHERE id = ?').run(id);
    return result.changes > 0;
  }
};

module.exports = FeedingSchedule;
