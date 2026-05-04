const Alert = require('../models/Alert');

const alertController = {
  getAllAlerts: (req, res) => {
    try {
      const { presetId, includeResolved } = req.query;
      const alerts = Alert.getAll(presetId, includeResolved === 'true');
      res.json(alerts);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  getAlertById: (req, res) => {
    try {
      const alert = Alert.getById(req.params.id);
      if (!alert) {
        return res.status(404).json({ error: 'Alert not found' });
      }
      res.json(alert);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  createAlert: (req, res) => {
    try {
      const { preset_id, type, severity, message } = req.body;
      if (!preset_id || !type || !message) {
        return res.status(400).json({ error: 'Preset ID, type and message are required' });
      }
      const alert = Alert.create({ preset_id, type, severity, message });
      res.status(201).json(alert);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  resolveAlert: (req, res) => {
    try {
      const alert = Alert.resolve(req.params.id);
      if (!alert) {
        return res.status(404).json({ error: 'Alert not found' });
      }
      res.json(alert);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  deleteAlert: (req, res) => {
    try {
      const success = Alert.delete(req.params.id);
      if (!success) {
        return res.status(404).json({ error: 'Alert not found' });
      }
      res.json({ message: 'Alert deleted successfully' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
};

module.exports = alertController;
