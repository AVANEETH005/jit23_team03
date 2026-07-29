const Defect = require('../models/Defect');
const Product = require('../models/Product');
const Branch = require('../models/Branch');
const Notification = require('../models/Notification');

// Register scan event (GOOD product: increment stock, DEFECTIVE product: log quarantine)
exports.registerScan = async (req, res) => {
  try {
    const { 
      productId, 
      branchId, 
      quantity, 
      status, // 'GOOD' or 'DEFECTIVE'
      reason, 
      severity, 
      rackNumber, 
      warehouse, 
      category, 
      imageUrl, 
      notes, 
      customProductName, 
      customProductSku 
    } = req.body;
    
    const { name: reportedBy } = req.user;

    let targetBranchId = branchId || req.user.branchId;
    let productName = customProductName || 'Unlisted Item';
    let productSku = customProductSku || 'UNLISTED';

    // Resolve branch if missing
    if (!targetBranchId || targetBranchId === 'all') {
      const branches = await Branch.find({ companyId: req.user.companyId });
      if (branches.length > 0) {
        targetBranchId = branches[0]._id.toString();
      }
    }

    const branch = await Branch.findById(targetBranchId);
    const branchName = branch ? branch.name : 'Main Warehouse';

    if (status === 'GOOD') {
      let product = null;
      
      if (productId && productId !== 'unlisted' && productId !== 'new_custom_item') {
        product = await Product.findById(productId);
      } else {
        // Try matching by SKU
        product = await Product.findOne({ sku: productSku, branchId: targetBranchId });
      }

      if (product) {
        product.quantity += Number(quantity || 1);
        await product.save();
        productName = product.name;
        productSku = product.sku;
      } else {
        // Create new catalog product if not found
        product = await Product.create({
          name: productName,
          sku: productSku,
          category: category || 'General',
          quantity: Number(quantity || 1),
          price: 50, // default placeholder
          branchId: targetBranchId,
          companyId: req.user.companyId,
          description: 'Automatically registered during quality scan'
        });
      }

      // Create Notification for stock update
      await Notification.create({
        type: 'stock_alert',
        title: 'Stock Updated',
        message: `Inventory stock of "${productName}" increased (+${quantity || 1} units) at "${branchName}".`,
        branchId: targetBranchId ? targetBranchId.toString() : '',
        companyId: req.user.companyId,
        referenceId: product._id.toString()
      });

      return res.status(200).json({ 
        message: 'Stock updated successfully', 
        product,
        inventoryStatus: 'Matched Inventory'
      });

    } else {
      // DEFECTIVE - Create Quarantine log
      let existingProduct = null;
      if (productId && productId !== 'unlisted' && productId !== 'new_custom_item') {
        existingProduct = await Product.findById(productId);
        if (existingProduct) {
          productName = existingProduct.name;
          productSku = existingProduct.sku;
          // Optionally subtract if moving existing stock to quarantine
          if (existingProduct.quantity >= Number(quantity || 1)) {
            existingProduct.quantity -= Number(quantity || 1);
            await existingProduct.save();
          }
        }
      }

      const defect = await Defect.create({
        productId: productId || 'unlisted',
        branchId: targetBranchId ? targetBranchId.toString() : 'main',
        quantity: Number(quantity || 1),
        reason: reason || 'Defective packaging',
        imageUrl: imageUrl || null,
        status: 'Pending Review',
        reportedBy: reportedBy || 'System Inspector',
        notes: notes || `WMS Quality Scan: packaging or component defect flagged.`,
        severity: severity || 'Medium',
        rackNumber: rackNumber || 'R-10',
        warehouse: warehouse || 'Main Warehouse',
        category: category || 'General',
        productName: productName,
        productSku: productSku
      });

      // Create Defect Notification
      await Notification.create({
        type: 'defect_reported',
        title: 'Defective Item Quarantined',
        message: `Warning: Defective item "${productName}" (${reason}) flagged at "${branchName}". Moved to Quarantine.`,
        branchId: targetBranchId ? targetBranchId.toString() : '',
        companyId: req.user.companyId,
        referenceId: defect._id.toString()
      });

      return res.status(201).json({
        message: 'Defect quarantined successfully',
        defect,
        inventoryStatus: existingProduct ? 'Inventory Mismatch' : 'Unknown Product'
      });
    }

  } catch (error) {
    console.error('Register scan error:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

// Report defect compatibility route
exports.reportDefect = async (req, res) => {
  req.body.status = 'DEFECTIVE';
  return exports.registerScan(req, res);
};

// Get list of defects with enriched details
exports.getDefects = async (req, res) => {
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

    const defects = await Defect.find({ branchId: { $in: targetBranchIds } });
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
        productName: rawDefect.productName || pName,
        productSku: rawDefect.productSku || pSku,
        branchName: b ? b.name : 'Main Warehouse'
      });
    }

    res.json(enrichedDefects);
  } catch (error) {
    console.error('Get defects error:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

// Update defect quarantine status (Approved, Rejected, Disposed, Returned to Vendor, Repaired)
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
    console.error('Update defect status error:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};
