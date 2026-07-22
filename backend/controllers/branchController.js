const Branch = require('../models/Branch');
const Product = require('../models/Product');
const Defect = require('../models/Defect');
const TransferRequest = require('../models/TransferRequest');

exports.getBranches = async (req, res) => {
  try {
    const { companyId } = req.user;
    const branches = await Branch.find({ companyId });
    res.json(branches);
  } catch (error) {
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

exports.createBranch = async (req, res) => {
  try {
    const { name, address, isWarehouse } = req.body;
    const { companyId, role } = req.user;

    if (role !== 'admin' && role !== 'manager') {
      return res.status(403).json({ message: 'Access denied. Admins and Managers only.' });
    }

    if (!name) return res.status(400).json({ message: 'Branch name is required' });

    const newBranch = await Branch.create({
      name,
      address,
      companyId,
      isWarehouse: isWarehouse || false
    });

    res.status(201).json(newBranch);
  } catch (error) {
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

exports.getBranchStats = async (req, res) => {
  try {
    const { companyId, role, branchId } = req.user;
    const requestedBranchId = req.query.branchId;

    // Filter query base
    let targetBranchIds = [];

    // Find all branches in the company to establish scopes
    const companyBranches = await Branch.find({ companyId });
    const allBranchIds = companyBranches.map(b => b._id.toString());

    if (role === 'branch_user' || role === 'staff') {
      // Locked to user's branch
      targetBranchIds = [branchId];
    } else if (requestedBranchId && requestedBranchId !== 'all') {
      // Admin/Manager filtering to a specific branch
      if (allBranchIds.includes(requestedBranchId)) {
        targetBranchIds = [requestedBranchId];
      } else {
        return res.status(403).json({ message: 'Branch does not belong to your company' });
      }
    } else {
      // Admin/Manager viewing all branches
      targetBranchIds = allBranchIds;
    }

    // Aggregate Product Statistics
    const products = await Product.find({ branchId: { $in: targetBranchIds } });
    
    let totalProducts = products.length;
    let lowStock = 0;
    let outOfStock = 0;
    let expiringSoon = 0;
    let totalQty = 0;
    let totalValue = 0;

    const today = new Date();
    
    products.forEach(p => {
      totalQty += p.quantity;
      totalValue += p.quantity * p.price;
      
      if (p.quantity === 0) {
        outOfStock++;
      } else if (p.quantity <= p.lowStockThreshold) {
        lowStock++;
      }

      if (p.expiryDate) {
        const diffDays = Math.ceil((new Date(p.expiryDate) - today) / (1000 * 60 * 60 * 24));
        if (diffDays >= 0 && diffDays <= 7) {
          expiringSoon++;
        }
      }
    });

    // Aggregate Defective Items Count
    const defects = await Defect.find({ branchId: { $in: targetBranchIds }, status: 'Pending Review' });
    const defectiveItemsCount = defects.reduce((sum, d) => sum + d.quantity, 0);

    // Aggregate Pending Transfers
    const pendingTransfers = await TransferRequest.countDocuments({
      $or: [
        { sourceBranchId: { $in: targetBranchIds } },
        { targetBranchId: { $in: targetBranchIds } }
      ],
      status: 'pending'
    });

    // Demand Forecast Mock Metrics
    const forecastDemand = Math.round(totalQty * 1.15 + 25); // Predictive simulated demand

    res.json({
      totalProducts,
      lowStock,
      outOfStock,
      expiringSoon,
      defectiveItemsCount,
      pendingTransfers,
      forecastDemand,
      totalBranches: companyBranches.length,
      totalQuantity: totalQty,
      totalValue: Math.round(totalValue * 100) / 100
    });

  } catch (error) {
    console.error('Stats aggregation error:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};
