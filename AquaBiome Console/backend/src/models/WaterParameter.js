const db = require('../config/database');

const WaterParameter = {
  getByPreset: (presetId) => {
    return db.prepare(`
      SELECT * FROM water_parameters 
      WHERE preset_id = ? 
      ORDER BY recorded_at DESC 
      LIMIT 1
    `).get(presetId);
  },

  getHistory: (presetId, limit = 50) => {
    return db.prepare(`
      SELECT * FROM water_parameters 
      WHERE preset_id = ? 
      ORDER BY recorded_at DESC 
      LIMIT ?
    `).all(presetId, limit);
  },

  create: (data) => {
    const result = db.prepare(`
      INSERT INTO water_parameters (
        preset_id, temperature, ph, ammonia, nitrite, nitrate,
        oxygen, salinity, clarity, algae_level, recorded_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `).run(
      data.preset_id, data.temperature, data.ph, data.ammonia, 
      data.nitrite, data.nitrate, data.oxygen, data.salinity, 
      data.clarity, data.algae_level
    );
    return { id: result.lastInsertRowid, ...data };
  },

  update: (id, data) => {
    db.prepare(`
      UPDATE water_parameters SET 
        temperature = ?, ph = ?, ammonia = ?, nitrite = ?, nitrate = ?,
        oxygen = ?, salinity = ?, clarity = ?, algae_level = ?, recorded_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(
      data.temperature, data.ph, data.ammonia, data.nitrite, data.nitrate,
      data.oxygen, data.salinity, data.clarity, data.algae_level, id
    );
    return WaterParameter.getHistory(data.preset_id || 1, 1)[0];
  }
};

module.exports = WaterParameter;
