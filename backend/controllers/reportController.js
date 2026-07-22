const Report = require('../models/Report');
const Product = require('../models/Product');
const Branch = require('../models/Branch');
const Defect = require('../models/Defect');
const TransferRequest = require('../models/TransferRequest');
const Forecast = require('../models/Forecast');

exports.generateReport = async (req, res) => {
  try {
    const { type, title, filterBranchId } = req.body;
    const { companyId, branchId, role, name: createdBy } = req.user;

    if (!type || !title) {
      return res.status(400).json({ message: 'Type and Title are required' });
    }

    // Resolve branch scope
    let targetBranchIds = [];
    const branches = await Branch.find({ companyId });
    const allBranchIds = branches.map(b => b._id.toString());
    const branchMap = {};
    branches.forEach(b => { branchMap[b._id.toString()] = b.name; });

    if (role === 'branch_user' || role === 'staff') {
      targetBranchIds = [branchId];
    } else if (filterBranchId && filterBranchId !== 'all') {
      targetBranchIds = [filterBranchId];
    } else {
      targetBranchIds = allBranchIds;
    }

    let reportData = {};
    const today = new Date();

    if (type === 'stock') {
      const products = await Product.find({ branchId: { $in: targetBranchIds } });
      let totalItems = products.length;
      let totalQty = 0;
      let totalValue = 0;
      let lowStockCount = 0;
      
      const itemsList = products.map(p => {
        totalQty += p.quantity;
        totalValue += p.quantity * p.price;
        const isLow = p.quantity <= p.lowStockThreshold;
        if (isLow) lowStockCount++;

        return {
          name: p.name,
          sku: p.sku,
          category: p.category,
          quantity: p.quantity,
          price: p.price,
          totalValue: p.quantity * p.price,
          branchName: branchMap[p.branchId] || 'Branch',
          status: p.quantity === 0 ? 'Out of Stock' : (isLow ? 'Low Stock' : 'Healthy')
        };
      });

      reportData = {
        summary: { totalItems, totalQuantity: totalQty, totalValue, lowStockCount },
        items: itemsList
      };

    } else if (type === 'expiry') {
      const products = await Product.find({ branchId: { $in: targetBranchIds } });
      const expiredItems = [];
      const expiringSoon = [];

      products.forEach(p => {
        if (!p.expiryDate) return;
        const diffDays = Math.ceil((new Date(p.expiryDate) - today) / (1000 * 60 * 60 * 24));
        const itemInfo = {
          name: p.name,
          sku: p.sku,
          branchName: branchMap[p.branchId] || 'Branch',
          expiryDate: p.expiryDate,
          quantity: p.quantity,
          value: p.quantity * p.price
        };

        if (diffDays < 0) {
          expiredItems.push(itemInfo);
        } else if (diffDays <= 30) {
          expiringSoon.push({ ...itemInfo, daysRemaining: diffDays });
        }
      });

      reportData = {
        summary: { expiredCount: expiredItems.length, expiringSoonCount: expiringSoon.length },
        expiredItems,
        expiringSoon
      };

    } else if (type === 'defect') {
      const defects = await Defect.find({ branchId: { $in: targetBranchIds } });
      let totalLossQty = 0;
      let totalLossValue = 0;
      const reasonCount = { 'Damaged': 0, 'Broken': 0, 'Expired': 0, 'Returned': 0, 'Packaging Issue': 0 };

      const itemsList = [];
      for (let d of defects) {
        const p = await Product.findById(d.productId);
        const itemVal = p ? p.price : 0;
        const lossVal = d.quantity * itemVal;

        totalLossQty += d.quantity;
        totalLossValue += lossVal;
        
        if (reasonCount[d.reason] !== undefined) {
          reasonCount[d.reason] += d.quantity;
        }

        itemsList.push({
          productName: p ? p.name : 'Unknown Product',
          productSku: p ? p.sku : 'Unknown SKU',
          branchName: branchMap[d.branchId] || 'Branch',
          quantity: d.quantity,
          reason: d.reason,
          status: d.status,
          lossValue: lossVal,
          reportedBy: d.reportedBy,
          createdAt: d.createdAt
        });
      }

      reportData = {
        summary: { totalLossQty, totalLossValue, reasonBreakdown: reasonCount },
        defects: itemsList
      };

    } else if (type === 'transfer') {
      const transfers = await TransferRequest.find({
        $or: [
          { sourceBranchId: { $in: targetBranchIds } },
          { targetBranchId: { $in: targetBranchIds } }
        ]
      });

      let totalTransfers = transfers.length;
      let completedTransfers = transfers.filter(t => t.status === 'completed').length;
      let pendingTransfers = transfers.filter(t => t.status === 'pending').length;
      let rejectedTransfers = transfers.filter(t => t.status === 'rejected').length;

      const itemsList = [];
      for (let t of transfers) {
        const sB = branchMap[t.sourceBranchId] || 'Source';
        const tB = branchMap[t.targetBranchId] || 'Target';

        itemsList.push({
          type: t.type,
          requestType: t.requestType,
          route: `${sB} ➔ ${tB}`,
          productName: t.productName,
          productSku: t.productSku,
          quantity: t.quantity,
          status: t.status,
          requestedBy: t.requestedBy,
          createdAt: t.createdAt
        });
      }

      reportData = {
        summary: { totalTransfers, completedTransfers, pendingTransfers, rejectedTransfers },
        transfers: itemsList
      };

    } else if (type === 'forecast') {
      const products = await Product.find({ branchId: { $in: targetBranchIds } });
      const productIds = products.map(p => p._id.toString());
      const forecasts = await Forecast.find({ productId: { $in: productIds } });

      const itemsList = products.map(p => {
        const prodForecasts = forecasts.filter(f => f.productId === p._id.toString());
        let latestForecast = null;
        if (prodForecasts.length > 0) {
          prodForecasts.sort((a, b) => (b.year * 12 + b.month) - (a.year * 12 + a.month));
          latestForecast = prodForecasts[0];
        }

        return {
          name: p.name,
          sku: p.sku,
          category: p.category,
          branchName: branchMap[p.branchId] || 'Branch',
          currentStock: p.quantity,
          predictedDemand: latestForecast ? latestForecast.predictedDemand : 'N/A',
          reorderRecommendation: p.quantity <= p.lowStockThreshold ? 'Yes' : 'No',
          lowStockThreshold: p.lowStockThreshold
        };
      });

      reportData = {
        summary: { totalMonitoredProducts: products.length },
        forecasts: itemsList
      };
    }

    const report = await Report.create({
      type,
      title,
      parameters: { filterBranchId },
      data: reportData,
      createdBy
    });

    res.status(201).json(report);

  } catch (error) {
    console.error('Generate report error:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

exports.getReports = async (req, res) => {
  try {
    const { companyId } = req.user;
    // Find all users of this company to scope report histories
    // (Or since reports store createdBy username/email, we can retrieve them all or query from MongoDB)
    const reports = await Report.find({}).sort({ createdAt: -1 });
    res.json(reports);
  } catch (error) {
    console.error('Get reports error:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

exports.getReportById = async (req, res) => {
  try {
    const report = await Report.findById(req.params.id);
    if (!report) return res.status(404).json({ message: 'Report not found' });
    res.json(report);
  } catch (error) {
    res.status(500).json({ message: 'Internal Server Error' });
  }
};
