const express = require('express');
const router = express.Router();
const coralController = require('../controllers/coralController');

router.get('/', coralController.getAllCorals);
router.get('/:id', coralController.getCoralById);
router.post('/', coralController.createCoral);
router.put('/:id', coralController.updateCoral);
router.delete('/:id', coralController.deleteCoral);

module.exports = router;
