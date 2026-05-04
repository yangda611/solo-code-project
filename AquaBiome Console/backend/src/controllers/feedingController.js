const FeedingSchedule = require('../models/FeedingSchedule');

const feedingController = {
  getAllSchedules: (req, res) => {
    try {
      const { presetId } = req.query;
      const schedules = FeedingSchedule.getAll(presetId);
      res.json(schedules);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  getScheduleById: (req, res) => {
    try {
      const schedule = FeedingSchedule.getById(req.params.id);
      if (!schedule) {
        return res.status(404).json({ error: 'Feeding schedule not found' });
      }
      res.json(schedule);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  createSchedule: (req, res) => {
    try {
      const { preset_id, name, time, amount, food_type, is_active } = req.body;
      if (!preset_id || !name || !time) {
        return res.status(400).json({ error: 'Preset ID, name and time are required' });
      }
      const schedule = FeedingSchedule.create({ preset_id, name, time, amount, food_type, is_active });
      res.status(201).json(schedule);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  updateSchedule: (req, res) => {
    try {
      const { name, time, amount, food_type, is_active, last_executed } = req.body;
      const schedule = FeedingSchedule.update(req.params.id, { name, time, amount, food_type, is_active, last_executed });
      if (!schedule) {
        return res.status(404).json({ error: 'Feeding schedule not found' });
      }
      res.json(schedule);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  executeSchedule: (req, res) => {
    try {
      const schedule = FeedingSchedule.execute(req.params.id);
      if (!schedule) {
        return res.status(404).json({ error: 'Feeding schedule not found' });
      }
      res.json(schedule);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  toggleSchedule: (req, res) => {
    try {
      const schedule = FeedingSchedule.toggleActive(req.params.id);
      if (!schedule) {
        return res.status(404).json({ error: 'Feeding schedule not found' });
      }
      res.json(schedule);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  deleteSchedule: (req, res) => {
    try {
      const success = FeedingSchedule.delete(req.params.id);
      if (!success) {
        return res.status(404).json({ error: 'Feeding schedule not found' });
      }
      res.json({ message: 'Feeding schedule deleted successfully' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
};

module.exports = feedingController;
