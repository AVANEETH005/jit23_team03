const express = require('express');
const router = express.Router();
const transferController = require('../controllers/transferController');
const authMiddleware = require('../middleware/authMiddleware');

router.use(authMiddleware);

router.get('/', transferController.getTransfers);
router.post('/', transferController.createTransfer);
router.post('/:id/process', transferController.processTransfer);
router.get('/sourcing-recommendation/:productId', transferController.getSourcingRecommendation);

module.exports = router;
