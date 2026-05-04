const express = require('express');
const router = express.Router();
const fishController = require('../controllers/fishController');

router.get('/', fishController.getAllFish);
router.get('/:id', fishController.getFishById);
router.post('/', fishController.createFish);
router.put('/:id', fishController.updateFish);
router.delete('/:id', fishController.deleteFish);

module.exports = router;
