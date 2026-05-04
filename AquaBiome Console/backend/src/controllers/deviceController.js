const Device = require('../models/Device');
const DeviceLog = require('../models/DeviceLog');

const deviceController = {
  getAllDevices: (req, res) => {
    try {
      const { presetId, type } = req.query;
      let devices;
      if (type && presetId) {
        devices = Device.getByType(presetId, type);
      } else {
        devices = Device.getAll(presetId);
      }
      res.json(devices);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  getDeviceById: (req, res) => {
    try {
      const device = Device.getById(req.params.id);
      if (!device) {
        return res.status(404).json({ error: 'Device not found' });
      }
      res.json(device);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  createDevice: (req, res) => {
    try {
      const { preset_id, type, name, status, power, last_maintenance } = req.body;
      if (!preset_id || !type || !name) {
        return res.status(400).json({ error: 'Preset ID, type and name are required' });
      }
      const device = Device.create({ preset_id, type, name, status, power, last_maintenance });
      DeviceLog.create({
        device_id: device.id,
        event_type: 'created',
        details: `Device ${name} created`
      });
      res.status(201).json(device);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  updateDevice: (req, res) => {
    try {
      const { type, name, status, power, last_maintenance } = req.body;
      const device = Device.update(req.params.id, { type, name, status, power, last_maintenance });
      if (!device) {
        return res.status(404).json({ error: 'Device not found' });
      }
      DeviceLog.create({
        device_id: device.id,
        event_type: 'updated',
        details: `Device ${name} updated - status: ${status}, power: ${power}%`
      });
      res.json(device);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  updateDeviceStatus: (req, res) => {
    try {
      const { status, power } = req.body;
      const device = Device.updateStatus(req.params.id, status, power);
      if (!device) {
        return res.status(404).json({ error: 'Device not found' });
      }
      DeviceLog.create({
        device_id: device.id,
        event_type: 'status_change',
        details: `Status changed to ${status}, power: ${power}%`
      });
      res.json(device);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  deleteDevice: (req, res) => {
    try {
      const device = Device.getById(req.params.id);
      if (!device) {
        return res.status(404).json({ error: 'Device not found' });
      }
      const success = Device.delete(req.params.id);
      if (success) {
        DeviceLog.create({
          device_id: req.params.id,
          event_type: 'deleted',
          details: `Device ${device.name} deleted`
        });
      }
      res.json({ message: 'Device deleted successfully' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  getDeviceLogs: (req, res) => {
    try {
      const { deviceId, limit } = req.query;
      const logs = DeviceLog.getAll(deviceId, limit ? parseInt(limit) : 100);
      res.json(logs);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
};

module.exports = deviceController;
