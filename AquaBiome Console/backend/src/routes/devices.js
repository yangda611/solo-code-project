const express = require('express');
const router = express.Router();
const deviceController = require('../controllers/deviceController');

router.get('/', deviceController.getAllDevices);
router.get('/logs', deviceController.getDeviceLogs);
router.get('/:id', deviceController.getDeviceById);
router.post('/', deviceController.createDevice);
router.put('/:id', deviceController.updateDevice);
router.patch('/:id/status', deviceController.updateDeviceStatus);
router.delete('/:id', deviceController.deleteDevice);

module.exports = router;
