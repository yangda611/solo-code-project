const db = require('../config/database');

const Preset = {
  getAll: () => {
    return db.prepare('SELECT * FROM presets ORDER BY id').all();
  },

  getById: (id) => {
    return db.prepare('SELECT * FROM presets WHERE id = ?').get(id);
  },

  create: (name, description) => {
    const result = db.prepare('INSERT INTO presets (name, description) VALUES (?, ?)').run(name, description);
    return { id: result.lastInsertRowid, name, description };
  },

  update: (id, name, description) => {
    db.prepare('UPDATE presets SET name = ?, description = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(name, description, id);
    return Preset.getById(id);
  },

  delete: (id) => {
    const result = db.prepare('DELETE FROM presets WHERE id = ?').run(id);
    return result.changes > 0;
  }
};

module.exports = Preset;
