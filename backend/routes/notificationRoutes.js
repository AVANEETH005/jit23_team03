const express = require('express');
const router = express.Router();
const Notification = require('../models/Notification');
const Branch = require('../models/Branch');
const authMiddleware = require('../middleware/authMiddleware');

router.use(authMiddleware);

// Get notifications
router.get('/', async (req, res) => {
  try {
    const { companyId, branchId, role } = req.user;

    let targetBranchIds = [];
    const branches = await Branch.find({ companyId });
    const allBranchIds = branches.map(b => b._id.toString());

    if (role === 'branch_user' || role === 'staff') {
      targetBranchIds = [branchId];
    } else {
      targetBranchIds = allBranchIds;
    }

    const notifications = await Notification.find({
      companyId,
      $or: [
        { branchId: { $in: targetBranchIds } },
        { branchId: null }
      ]
    }).sort({ createdAt: -1 });

    res.json(notifications);
  } catch (error) {
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

// Mark single as read
router.put('/:id/read', async (req, res) => {
  try {
    const notification = await Notification.findByIdAndUpdate(
      req.params.id,
      { isRead: true },
      { new: true }
    );
    res.json(notification);
  } catch (error) {
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

// Mark all as read
router.put('/read-all', async (req, res) => {
  try {
    const { companyId } = req.user;
    await Notification.deleteMany({ companyId, isRead: true }); // delete read notifications to save space
    await Notification.updateMany({ companyId }, { isRead: true });
    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

module.exports = router;
