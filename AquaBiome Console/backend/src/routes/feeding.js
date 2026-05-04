const express = require('express');
const router = express.Router();
const feedingController = require('../controllers/feedingController');

router.get('/', feedingController.getAllSchedules);
router.get('/:id', feedingController.getScheduleById);
router.post('/', feedingController.createSchedule);
router.put('/:id', feedingController.updateSchedule);
router.post('/:id/execute', feedingController.executeSchedule);
router.patch('/:id/toggle', feedingController.toggleSchedule);
router.delete('/:id', feedingController.deleteSchedule);

module.exports = router;
