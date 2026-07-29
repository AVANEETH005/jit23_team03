const express = require('express');
const router = express.Router();
const defectController = require('../controllers/defectController');
const authMiddleware = require('../middleware/authMiddleware');

router.use(authMiddleware);

router.post('/', defectController.reportDefect);
router.post('/scan', defectController.registerScan);
router.get('/', defectController.getDefects);
router.put('/:id/status', defectController.updateDefectStatus);

module.exports = router;
