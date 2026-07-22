const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const authMiddleware = require('../middleware/authMiddleware');

router.use(authMiddleware);

router.post('/generate', reportController.generateReport);
router.get('/', reportController.getReports);
router.get('/:id', reportController.getReportById);

module.exports = router;
