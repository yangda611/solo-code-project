const LightingSchedule = require('../models/LightingSchedule');

const lightingController = {
  getAllSchedules: (req, res) => {
    try {
      const { presetId } = req.query;
      const schedules = LightingSchedule.getAll(presetId);
      res.json(schedules);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  getScheduleById: (req, res) => {
    try {
      const schedule = LightingSchedule.getById(req.params.id);
      if (!schedule) {
        return res.status(404).json({ error: 'Lighting schedule not found' });
      }
      res.json(schedule);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  createSchedule: (req, res) => {
    try {
      const { preset_id, name, start_time, end_time, intensity, color_temperature, is_active } = req.body;
      if (!preset_id || !name || !start_time || !end_time) {
        return res.status(400).json({ error: 'Preset ID, name, start time and end time are required' });
      }
      const schedule = LightingSchedule.create({ preset_id, name, start_time, end_time, intensity, color_temperature, is_active });
      res.status(201).json(schedule);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  updateSchedule: (req, res) => {
    try {
      const { name, start_time, end_time, intensity, color_temperature, is_active } = req.body;
      const schedule = LightingSchedule.update(req.params.id, { name, start_time, end_time, intensity, color_temperature, is_active });
      if (!schedule) {
        return res.status(404).json({ error: 'Lighting schedule not found' });
      }
      res.json(schedule);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  toggleSchedule: (req, res) => {
    try {
      const schedule = LightingSchedule.toggleActive(req.params.id);
      if (!schedule) {
        return res.status(404).json({ error: 'Lighting schedule not found' });
      }
      res.json(schedule);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  deleteSchedule: (req, res) => {
    try {
      const success = LightingSchedule.delete(req.params.id);
      if (!success) {
        return res.status(404).json({ error: 'Lighting schedule not found' });
      }
      res.json({ message: 'Lighting schedule deleted successfully' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
};

module.exports = lightingController;
