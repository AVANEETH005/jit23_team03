const TransferRequest = require('../models/TransferRequest');
const Product = require('../models/Product');
const Branch = require('../models/Branch');
const Company = require('../models/Company');
const Notification = require('../models/Notification');

// Priority Sourcing Recommendation API
exports.getSourcingRecommendation = async (req, res) => {
  try {
    const { productId } = req.params;
    const userCompanyId = req.user.companyId;

    const sourceProduct = await Product.findById(productId);
    if (!sourceProduct) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const { sku, name, branchId, supplier } = sourceProduct;

    // Sourcing Option list
    const recommendations = [];

    // Priority 1: Current branch status (for completeness)
    const currentBranch = await Branch.findById(branchId);
    recommendations.push({
      priority: 1,
      source: 'Current Branch',
      detail: currentBranch ? currentBranch.name : 'Target Branch',
      quantity: sourceProduct.quantity,
      actionable: false,
      type: 'current'
    });

    // Find all branches of the user's company
    const myBranches = await Branch.find({ companyId: userCompanyId });
    const myBranchIds = myBranches.map(b => b._id.toString());

    // Priority 2 & 3: Other branches and Main Warehouse
    const internalProducts = await Product.find({
      sku,
      branchId: { $in: myBranchIds, $ne: branchId.toString() }
    });

    for (let p of internalProducts) {
      const branch = myBranches.find(b => b._id.toString() === p.branchId);
      if (!branch) continue;

      recommendations.push({
        priority: branch.isWarehouse ? 2 : 3, // Main Warehouse has priority 2, other branches priority 3
        source: branch.isWarehouse ? 'Main Warehouse' : 'Other Branch',
        detail: branch.name,
        branchId: branch._id.toString(),
        productId: p._id.toString(),
        quantity: p.quantity,
        actionable: p.quantity > 0,
        type: 'internal'
      });
    }

    // Priority 4: Partner Company Stock (Inter-company Goods Exchange Marketplace)
    // Find all products of other companies with same SKU and marked as excess/shareable
    const partnerBranches = await Branch.find({ companyId: { $ne: userCompanyId } });
    const partnerBranchIds = partnerBranches.map(b => b._id.toString());

    const partnerProducts = await Product.find({
      sku,
      isExcessShareable: true,
      branchId: { $in: partnerBranchIds }
    });

    for (let p of partnerProducts) {
      const branch = partnerBranches.find(b => b._id.toString() === p.branchId);
      if (!branch) continue;

      const partnerCompany = await Company.findById(branch.companyId);
      const companyName = partnerCompany ? partnerCompany.name : 'Partner Company';

      recommendations.push({
        priority: 4,
        source: `Partner Marketplace (${companyName})`,
        detail: `${branch.name} (${companyName})`,
        branchId: branch._id.toString(),
        productId: p._id.toString(),
        companyId: branch.companyId,
        quantity: p.quantity,
        actionable: p.quantity > 0,
        type: 'partner'
      });
    }

    // Priority 5: Supplier Purchase Fallback
    recommendations.push({
      priority: 5,
      source: 'Supplier Purchase',
      detail: supplier || 'Default Supplier',
      actionable: true,
      type: 'supplier'
    });

    // Sort by priority index
    recommendations.sort((a, b) => a.priority - b.priority);

    res.json({
      product: { name, sku, currentBranch: currentBranch ? currentBranch.name : '' },
      recommendations
    });

  } catch (error) {
    console.error('Sourcing recommendation error:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

// Create Transfer Request
exports.createTransfer = async (req, res) => {
  try {
    const { sourceBranchId, targetBranchId, productId, quantity, notes } = req.body;
    const { companyId, name: requestedBy } = req.user;

    if (!sourceBranchId || !targetBranchId || !productId || !quantity) {
      return res.status(400).json({ message: 'Missing required transfer details' });
    }

    // Find source product to get SKU details
    const sourceProduct = await Product.findById(productId);
    if (!sourceProduct) {
      return res.status(404).json({ message: 'Source product not found' });
    }

    if (sourceProduct.quantity < quantity) {
      return res.status(400).json({ message: `Insufficient quantity in source. Available: ${sourceProduct.quantity}` });
    }

    // Resolve source company
    const sourceBranch = await Branch.findById(sourceBranchId);
    if (!sourceBranch) return res.status(404).json({ message: 'Source branch not found' });
    const sourceCompanyId = sourceBranch.companyId;

    // Resolve target company
    const targetBranch = await Branch.findById(targetBranchId);
    if (!targetBranch) return res.status(404).json({ message: 'Target branch not found' });
    const targetCompanyId = targetBranch.companyId;

    const isInternal = sourceCompanyId.toString() === targetCompanyId.toString();

    const transfer = await TransferRequest.create({
      type: isInternal ? 'internal' : 'company_exchange',
      requestType: isInternal 
        ? (sourceBranch.isWarehouse ? 'warehouse_transfer' : 'branch_to_branch') 
        : 'partner_exchange',
      sourceCompanyId: sourceCompanyId.toString(),
      sourceBranchId: sourceBranchId.toString(),
      targetCompanyId: targetCompanyId.toString(),
      targetBranchId: targetBranchId.toString(),
      productId: productId.toString(),
      productName: sourceProduct.name,
      productSku: sourceProduct.sku,
      quantity: Number(quantity),
      status: 'pending',
      requestedBy,
      notes
    });

    // Create Notification for the source branch / warehouse managers
    await Notification.create({
      type: 'transfer_request',
      title: 'New Transfer Request',
      message: `A transfer of ${quantity}x "${sourceProduct.name}" has been requested from your branch "${sourceBranch.name}" to "${targetBranch.name}".`,
      branchId: sourceBranchId.toString(),
      companyId: sourceCompanyId.toString(),
      referenceId: transfer._id.toString()
    });

    res.status(201).json(transfer);

  } catch (error) {
    console.error('Create transfer error:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

// Get Transfers (Inbox/Outbox)
exports.getTransfers = async (req, res) => {
  try {
    const { companyId, branchId, role } = req.user;

    const query = {};

    if (role === 'branch_user' || role === 'staff') {
      // Branch scope: transfers where branch is either source or target
      query.$or = [
        { sourceBranchId: branchId },
        { targetBranchId: branchId }
      ];
    } else {
      // Company scope: transfers where company is either source or target
      query.$or = [
        { sourceCompanyId: companyId },
        { targetCompanyId: companyId }
      ];
    }

    const transfers = await TransferRequest.find(query);

    // Resolve branch and company names for display
    const enrichedTransfers = [];
    for (let t of transfers) {
      const sBranch = await Branch.findById(t.sourceBranchId);
      const tBranch = await Branch.findById(t.targetBranchId);
      const sCompany = await Company.findById(t.sourceCompanyId);
      const tCompany = await Company.findById(t.targetCompanyId);

      enrichedTransfers.push({
        ...t,
        sourceBranchName: sBranch ? sBranch.name : 'Unknown Branch',
        targetBranchName: tBranch ? tBranch.name : 'Unknown Branch',
        sourceCompanyName: sCompany ? sCompany.name : 'Unknown Company',
        targetCompanyName: tCompany ? tCompany.name : 'Unknown Company'
      });
    }

    res.json(enrichedTransfers);
  } catch (error) {
    console.error('Get transfers error:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

// Approve / Reject Transfer
exports.processTransfer = async (req, res) => {
  try {
    const { id } = req.params;
    const { action } = req.body; // 'approve' or 'reject'
    const { name: approvedBy, companyId } = req.user;

    if (!action || !['approve', 'reject'].includes(action)) {
      return res.status(400).json({ message: 'Invalid action parameter' });
    }

    const transfer = await TransferRequest.findById(id);
    if (!transfer) return res.status(404).json({ message: 'Transfer request not found' });

    if (transfer.status !== 'pending') {
      return res.status(400).json({ message: 'Transfer request has already been processed' });
    }

    // Verify permission: User must belong to the source company/branch to approve/reject
    if (transfer.sourceCompanyId.toString() !== companyId.toString()) {
      return res.status(403).json({ message: 'You are not authorized to approve transfers for this branch' });
    }

    if (action === 'reject') {
      transfer.status = 'rejected';
      transfer.approvedBy = approvedBy;
      await transfer.save();

      // Notify requesting branch
      await Notification.create({
        type: 'transfer_request',
        title: 'Transfer Request Rejected',
        message: `Your request for ${transfer.quantity}x "${transfer.productName}" was rejected.`,
        branchId: transfer.targetBranchId,
        companyId: transfer.targetCompanyId,
        referenceId: transfer._id.toString()
      });

      return res.json(transfer);
    }

    // Action: Approve
    // Find source product
    const sourceProduct = await Product.findById(transfer.productId);
    if (!sourceProduct) {
      return res.status(404).json({ message: 'Source product not found' });
    }

    if (sourceProduct.quantity < transfer.quantity) {
      return res.status(400).json({ message: 'Insufficient stock in source branch to fulfill transfer' });
    }

    // Deduct stock from source product
    sourceProduct.quantity -= transfer.quantity;
    await sourceProduct.save();

    // Check if product with same SKU exists in target branch
    let targetProduct = await Product.findOne({
      sku: transfer.productSku,
      branchId: transfer.targetBranchId
    });

    if (targetProduct) {
      // Increment stock
      targetProduct.quantity += transfer.quantity;
      await targetProduct.save();
    } else {
      // Create new product copying attributes of source product
      targetProduct = await Product.create({
        name: sourceProduct.name,
        sku: sourceProduct.sku,
        category: sourceProduct.category,
        quantity: transfer.quantity,
        price: sourceProduct.price,
        supplier: sourceProduct.supplier,
        expiryDate: sourceProduct.expiryDate,
        branchId: transfer.targetBranchId,
        lowStockThreshold: sourceProduct.lowStockThreshold,
        excessThreshold: sourceProduct.excessThreshold,
        isExcessShareable: false
      });
    }

    transfer.status = 'completed';
    transfer.approvedBy = approvedBy;
    await transfer.save();

    // Notify requesting branch
    await Notification.create({
      type: 'transfer_request',
      title: 'Transfer Request Completed',
      message: `Your request for ${transfer.quantity}x "${transfer.productName}" has been approved and completed.`,
      branchId: transfer.targetBranchId,
      companyId: transfer.targetCompanyId,
      referenceId: transfer._id.toString()
    });

    res.json(transfer);

  } catch (error) {
    console.error('Process transfer error:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};
