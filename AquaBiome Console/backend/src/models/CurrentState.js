const db = require('../config/database');

const CurrentState = {
  get: () => {
    return db.prepare('SELECT * FROM current_state WHERE id = 1').get();
  },

  setActivePreset: (presetId) => {
    const result = db.prepare(`
      UPDATE current_state 
      SET active_preset_id = ?, last_updated = CURRENT_TIMESTAMP 
      WHERE id = 1
    `).run(presetId);
    
    if (result.changes === 0) {
      db.prepare(`
        INSERT INTO current_state (id, active_preset_id) VALUES (1, ?)
      `).run(presetId);
    }
    
    return CurrentState.get();
  },

  getFullState: () => {
    const state = CurrentState.get();
    if (!state || !state.active_preset_id) {
      return null;
    }

    const presetId = state.active_preset_id;
    
    const preset = db.prepare('SELECT * FROM presets WHERE id = ?').get(presetId);
    const fish = db.prepare('SELECT * FROM fish WHERE preset_id = ?').all(presetId);
    const corals = db.prepare('SELECT * FROM corals WHERE preset_id = ?').all(presetId);
    const devices = db.prepare('SELECT * FROM devices WHERE preset_id = ?').all(presetId);
    const waterParams = db.prepare(`
      SELECT * FROM water_parameters WHERE preset_id = ? ORDER BY recorded_at DESC LIMIT 1
    `).get(presetId);
    const lighting = db.prepare('SELECT * FROM lighting_schedule WHERE preset_id = ?').all(presetId);
    const feeding = db.prepare('SELECT * FROM feeding_schedule WHERE preset_id = ?').all(presetId);
    const alerts = db.prepare('SELECT * FROM alerts WHERE preset_id = ? AND is_resolved = 0 ORDER BY created_at DESC').all(presetId);

    return {
      preset,
      fish,
      corals,
      devices,
      waterParams,
      lighting,
      feeding,
      alerts,
      lastUpdated: state.last_updated
    };
  }
};

module.exports = CurrentState;
