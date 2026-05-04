const db = require('../config/database');

const Fish = {
  getAll: (presetId) => {
    if (presetId) {
      return db.prepare('SELECT * FROM fish WHERE preset_id = ? ORDER BY id').all(presetId);
    }
    return db.prepare('SELECT * FROM fish ORDER BY id').all();
  },

  getById: (id) => {
    return db.prepare('SELECT * FROM fish WHERE id = ?').get(id);
  },

  create: (data) => {
    const result = db.prepare(`
      INSERT INTO fish (preset_id, species, name, quantity, health_status, behavior, last_fed)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(data.preset_id, data.species, data.name, data.quantity, data.health_status || 'healthy', data.behavior, data.last_fed);
    return { id: result.lastInsertRowid, ...data };
  },

  update: (id, data) => {
    db.prepare(`
      UPDATE fish SET 
        species = ?, name = ?, quantity = ?, health_status = ?, 
        behavior = ?, last_fed = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(data.species, data.name, data.quantity, data.health_status, data.behavior, data.last_fed, id);
    return Fish.getById(id);
  },

  delete: (id) => {
    const result = db.prepare('DELETE FROM fish WHERE id = ?').run(id);
    return result.changes > 0;
  }
};

module.exports = Fish;
