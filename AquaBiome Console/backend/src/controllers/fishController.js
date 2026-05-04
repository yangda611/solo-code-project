const Fish = require('../models/Fish');

const fishController = {
  getAllFish: (req, res) => {
    try {
      const { presetId } = req.query;
      const fish = Fish.getAll(presetId);
      res.json(fish);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  getFishById: (req, res) => {
    try {
      const fish = Fish.getById(req.params.id);
      if (!fish) {
        return res.status(404).json({ error: 'Fish not found' });
      }
      res.json(fish);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  createFish: (req, res) => {
    try {
      const { preset_id, species, name, quantity, health_status, behavior, last_fed } = req.body;
      if (!preset_id || !species) {
        return res.status(400).json({ error: 'Preset ID and species are required' });
      }
      const fish = Fish.create({ preset_id, species, name, quantity, health_status, behavior, last_fed });
      res.status(201).json(fish);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  updateFish: (req, res) => {
    try {
      const { species, name, quantity, health_status, behavior, last_fed } = req.body;
      const fish = Fish.update(req.params.id, { species, name, quantity, health_status, behavior, last_fed });
      if (!fish) {
        return res.status(404).json({ error: 'Fish not found' });
      }
      res.json(fish);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  deleteFish: (req, res) => {
    try {
      const success = Fish.delete(req.params.id);
      if (!success) {
        return res.status(404).json({ error: 'Fish not found' });
      }
      res.json({ message: 'Fish deleted successfully' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
};

module.exports = fishController;
