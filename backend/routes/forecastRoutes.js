const express = require('express');
const router = express.Router();
const forecastController = require('../controllers/forecastController');
const authMiddleware = require('../middleware/authMiddleware');

router.use(authMiddleware);

router.get('/', forecastController.getForecastData);
router.post('/train', forecastController.trainModel);

module.exports = router;
