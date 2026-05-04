const express = require('express');
const router = express.Router();
const presetController = require('../controllers/presetController');

router.get('/', presetController.getAllPresets);
router.get('/active', presetController.getActivePreset);
router.get('/state', presetController.getFullState);
router.get('/:id', presetController.getPresetById);
router.post('/', presetController.createPreset);
router.post('/active', presetController.setActivePreset);
router.put('/:id', presetController.updatePreset);
router.delete('/:id', presetController.deletePreset);

module.exports = router;
