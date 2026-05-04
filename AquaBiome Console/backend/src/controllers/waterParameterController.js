const WaterParameter = require('../models/WaterParameter');

const waterParameterController = {
  getCurrentParameters: (req, res) => {
    try {
      const { presetId } = req.query;
      if (!presetId) {
        return res.status(400).json({ error: 'Preset ID is required' });
      }
      const params = WaterParameter.getByPreset(presetId);
      if (!params) {
        return res.status(404).json({ error: 'Water parameters not found' });
      }
      res.json(params);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  getParameterHistory: (req, res) => {
    try {
      const { presetId, limit } = req.query;
      if (!presetId) {
        return res.status(400).json({ error: 'Preset ID is required' });
      }
      const history = WaterParameter.getHistory(presetId, limit ? parseInt(limit) : 50);
      res.json(history);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  createParameters: (req, res) => {
    try {
      const {
        preset_id, temperature, ph, ammonia, nitrite, nitrate,
        oxygen, salinity, clarity, algae_level
      } = req.body;
      
      if (!preset_id) {
        return res.status(400).json({ error: 'Preset ID is required' });
      }
      
      const params = WaterParameter.create({
        preset_id, temperature, ph, ammonia, nitrite, nitrate,
        oxygen, salinity, clarity, algae_level
      });
      res.status(201).json(params);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  updateParameters: (req, res) => {
    try {
      const {
        temperature, ph, ammonia, nitrite, nitrate,
        oxygen, salinity, clarity, algae_level, preset_id
      } = req.body;
      
      const params = WaterParameter.update(req.params.id, {
        temperature, ph, ammonia, nitrite, nitrate,
        oxygen, salinity, clarity, algae_level, preset_id
      });
      res.json(params);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
};

module.exports = waterParameterController;
