const Coral = require('../models/Coral');

const coralController = {
  getAllCorals: (req, res) => {
    try {
      const { presetId } = req.query;
      const corals = Coral.getAll(presetId);
      res.json(corals);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  getCoralById: (req, res) => {
    try {
      const coral = Coral.getById(req.params.id);
      if (!coral) {
        return res.status(404).json({ error: 'Coral not found' });
      }
      res.json(coral);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  createCoral: (req, res) => {
    try {
      const { preset_id, species, name, health_status, position } = req.body;
      if (!preset_id || !species) {
        return res.status(400).json({ error: 'Preset ID and species are required' });
      }
      const coral = Coral.create({ preset_id, species, name, health_status, position });
      res.status(201).json(coral);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  updateCoral: (req, res) => {
    try {
      const { species, name, health_status, position } = req.body;
      const coral = Coral.update(req.params.id, { species, name, health_status, position });
      if (!coral) {
        return res.status(404).json({ error: 'Coral not found' });
      }
      res.json(coral);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  deleteCoral: (req, res) => {
    try {
      const success = Coral.delete(req.params.id);
      if (!success) {
        return res.status(404).json({ error: 'Coral not found' });
      }
      res.json({ message: 'Coral deleted successfully' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
};

module.exports = coralController;
