const express = require('express');
const router = express.Router();
const waterParameterController = require('../controllers/waterParameterController');

router.get('/', waterParameterController.getCurrentParameters);
router.get('/history', waterParameterController.getParameterHistory);
router.post('/', waterParameterController.createParameters);
router.put('/:id', waterParameterController.updateParameters);

module.exports = router;
