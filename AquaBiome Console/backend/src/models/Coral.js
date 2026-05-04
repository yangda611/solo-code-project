const db = require('../config/database');

const Coral = {
  getAll: (presetId) => {
    if (presetId) {
      return db.prepare('SELECT * FROM corals WHERE preset_id = ? ORDER BY id').all(presetId);
    }
    return db.prepare('SELECT * FROM corals ORDER BY id').all();
  },

  getById: (id) => {
    return db.prepare('SELECT * FROM corals WHERE id = ?').get(id);
  },

  create: (data) => {
    const result = db.prepare(`
      INSERT INTO corals (preset_id, species, name, health_status, position)
      VALUES (?, ?, ?, ?, ?)
    `).run(data.preset_id, data.species, data.name, data.health_status || 'healthy', data.position);
    return { id: result.lastInsertRowid, ...data };
  },

  update: (id, data) => {
    db.prepare(`
      UPDATE corals SET 
        species = ?, name = ?, health_status = ?, position = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(data.species, data.name, data.health_status, data.position, id);
    return Coral.getById(id);
  },

  delete: (id) => {
    const result = db.prepare('DELETE FROM corals WHERE id = ?').run(id);
    return result.changes > 0;
  }
};

module.exports = Coral;
