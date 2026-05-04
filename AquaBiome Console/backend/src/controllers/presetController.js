const Preset = require('../models/Preset');
const CurrentState = require('../models/CurrentState');

const presetController = {
  getAllPresets: (req, res) => {
    try {
      const presets = Preset.getAll();
      res.json(presets);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  getPresetById: (req, res) => {
    try {
      const preset = Preset.getById(req.params.id);
      if (!preset) {
        return res.status(404).json({ error: 'Preset not found' });
      }
      res.json(preset);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  createPreset: (req, res) => {
    try {
      const { name, description } = req.body;
      if (!name) {
        return res.status(400).json({ error: 'Name is required' });
      }
      const preset = Preset.create(name, description || '');
      res.status(201).json(preset);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  updatePreset: (req, res) => {
    try {
      const { name, description } = req.body;
      const preset = Preset.update(req.params.id, name, description);
      if (!preset) {
        return res.status(404).json({ error: 'Preset not found' });
      }
      res.json(preset);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  deletePreset: (req, res) => {
    try {
      const success = Preset.delete(req.params.id);
      if (!success) {
        return res.status(404).json({ error: 'Preset not found' });
      }
      res.json({ message: 'Preset deleted successfully' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  getActivePreset: (req, res) => {
    try {
      const state = CurrentState.get();
      if (!state || !state.active_preset_id) {
        return res.status(404).json({ error: 'No active preset' });
      }
      const preset = Preset.getById(state.active_preset_id);
      res.json(preset);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  setActivePreset: (req, res) => {
    try {
      const { presetId } = req.body;
      const preset = Preset.getById(presetId);
      if (!preset) {
        return res.status(404).json({ error: 'Preset not found' });
      }
      const state = CurrentState.setActivePreset(presetId);
      res.json(state);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  getFullState: (req, res) => {
    try {
      const state = CurrentState.getFullState();
      if (!state) {
        return res.status(404).json({ error: 'No active state' });
      }
      res.json(state);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
};

module.exports = presetController;
