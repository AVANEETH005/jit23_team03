const Defect = require('../models/Defect');
const Product = require('../models/Product');
const Branch = require('../models/Branch');
const Notification = require('../models/Notification');

exports.reportDefect = async (req, res) => {
  try {
    const { productId, branchId, quantity, reason, imageUrl, notes, customProductName, customProductSku } = req.body;
    const { name: reportedBy } = req.user;

    let targetBranchId = branchId || req.user.branchId;
    let productName = customProductName || 'Unlisted Item';
    let productSku = customProductSku || 'UNLISTED';

    if (productId && productId !== 'unlisted' && productId !== 'new_custom_item') {
      const product = await Product.findById(productId);
      if (product) {
        productName = product.name;
        productSku = product.sku;
        targetBranchId = product.branchId;
        if (product.quantity >= quantity) {
          product.quantity -= Number(quantity);
          await product.save();
        }
      }
    }

    // Resolve branch if missing
    if (!targetBranchId || targetBranchId === 'all') {
      const branches = await Branch.find({ companyId: req.user.companyId });
      if (branches.length > 0) {
        targetBranchId = branches[0]._id.toString();
      }
    }

    const defect = await Defect.create({
      productId: productId || 'unlisted',
      branchId: targetBranchId ? targetBranchId.toString() : 'main',
      quantity: Number(quantity || 1),
      reason: reason || 'Damaged',
      imageUrl: imageUrl || null,
      status: 'Stock Adjusted',
      reportedBy: reportedBy || 'System Inspector',
      notes: notes || `YOLO Defect Audit Logged for ${productName}`
    });

    // Create Notification
    const branch = await Branch.findById(targetBranchId);
    await Notification.create({
      type: 'defect_reported',
      title: 'Defective Stock Reported',
      message: `${quantity || 1}x "${productName}" marked as defective (${reason || 'Damaged'}) in branch "${branch ? branch.name : 'Branch'}". Stock adjusted.`,
      branchId: targetBranchId ? targetBranchId.toString() : '',
      companyId: req.user.companyId,
      referenceId: defect._id.toString()
    });

    res.status(201).json(defect);

  } catch (error) {
    console.error('Report defect error:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

exports.getDefects = async (req, res) => {
  try {
    const { companyId, branchId, role } = req.user;

    // Scope check
    let targetBranchIds = [];
    const branches = await Branch.find({ companyId });
    const allBranchIds = branches.map(b => b._id.toString());

    if (role === 'branch_user' || role === 'staff') {
      targetBranchIds = [branchId];
    } else {
      targetBranchIds = allBranchIds;
    }

    const defects = await Defect.find({ branchId: { $in: targetBranchIds } });

    // Populate product and branch details safely
    const enrichedDefects = [];
    for (let d of defects) {
      const rawDefect = d.toObject ? d.toObject() : d;
      let pName = 'Unlisted Item';
      let pSku = 'UNLISTED';

      if (rawDefect.productId && rawDefect.productId !== 'unlisted' && rawDefect.productId !== 'new_custom_item') {
        const p = await Product.findById(rawDefect.productId);
        if (p) {
          pName = p.name;
          pSku = p.sku;
        }
      }
      
      const b = await Branch.findById(rawDefect.branchId);

      enrichedDefects.push({
        ...rawDefect,
        productName: pName,
        productSku: pSku,
        branchName: b ? b.name : 'Main Warehouse'
      });
    }

    res.json(enrichedDefects);
  } catch (error) {
    console.error('Get defects error:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

exports.updateDefectStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    if (req.user.role === 'staff') {
      return res.status(403).json({ message: 'Staff cannot update defect logs' });
    }

    const defect = await Defect.findById(id);
    if (!defect) return res.status(404).json({ message: 'Defect record not found' });

    defect.status = status;
    await defect.save();

    res.json(defect);
  } catch (error) {
    res.status(500).json({ message: 'Internal Server Error' });
  }
};
