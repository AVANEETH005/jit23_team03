const express = require('express');
const router = express.Router();
const branchController = require('../controllers/branchController');
const authMiddleware = require('../middleware/authMiddleware');

router.use(authMiddleware);

router.get('/', branchController.getBranches);
router.post('/', branchController.createBranch);
router.get('/stats', branchController.getBranchStats);

module.exports = router;
