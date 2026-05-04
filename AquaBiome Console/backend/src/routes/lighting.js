const express = require('express');
const router = express.Router();
const lightingController = require('../controllers/lightingController');

router.get('/', lightingController.getAllSchedules);
router.get('/:id', lightingController.getScheduleById);
router.post('/', lightingController.createSchedule);
router.put('/:id', lightingController.updateSchedule);
router.patch('/:id/toggle', lightingController.toggleSchedule);
router.delete('/:id', lightingController.deleteSchedule);

module.exports = router;
