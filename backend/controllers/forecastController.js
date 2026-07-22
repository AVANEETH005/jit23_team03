const Forecast = require('../models/Forecast');
const Product = require('../models/Product');
const Branch = require('../models/Branch');

exports.getForecastData = async (req, res) => {
  try {
    const { companyId, branchId, role } = req.user;
    const filterBranchId = req.query.branchId;

    // Resolve branch scope
    let targetBranchIds = [];
    const branches = await Branch.find({ companyId });
    const allBranchIds = branches.map(b => b._id.toString());

    if (role === 'branch_user' || role === 'staff') {
      targetBranchIds = [branchId];
    } else if (filterBranchId && filterBranchId !== 'all') {
      targetBranchIds = [filterBranchId];
    } else {
      targetBranchIds = allBranchIds;
    }

    // Find all products in scope
    const products = await Product.find({ branchId: { $in: targetBranchIds } });
    const productIds = products.map(p => p._id.toString());

    // Fetch forecasts
    const forecasts = await Forecast.find({ productId: { $in: productIds } });

    // Format historical trend data for charts (grouped by month/year)
    // We can aggregate predicted vs actual sales
    const monthlyAggregates = {};

    forecasts.forEach(f => {
      const key = `${f.year}-${String(f.month).padStart(2, '0')}`;
      if (!monthlyAggregates[key]) {
        monthlyAggregates[key] = {
          month: key,
          ActualSales: 0,
          PredictedDemand: 0
        };
      }
      monthlyAggregates[key].ActualSales += f.actualSales;
      monthlyAggregates[key].PredictedDemand += f.predictedDemand;
    });

    const trendData = Object.values(monthlyAggregates).sort((a, b) => a.month.localeCompare(b.month));

    // Determine Fast Moving Products (highest actual/predicted sales velocity)
    const productSalesMap = {};
    forecasts.forEach(f => {
      if (!productSalesMap[f.productId]) {
        productSalesMap[f.productId] = {
          productId: f.productId,
          totalSales: 0,
          totalPredicted: 0,
          count: 0
        };
      }
      productSalesMap[f.productId].totalSales += f.actualSales;
      productSalesMap[f.productId].totalPredicted += f.predictedDemand;
      productSalesMap[f.productId].count += 1;
    });

    const fastMovingProducts = [];
    for (let pId in productSalesMap) {
      const prod = products.find(p => p._id.toString() === pId);
      if (!prod) continue;

      const salesStats = productSalesMap[pId];
      const avgSalesPerMonth = salesStats.totalSales / (salesStats.count || 1);

      fastMovingProducts.push({
        productId: pId,
        name: prod.name,
        sku: prod.sku,
        category: prod.category,
        avgSalesPerMonth: Math.round(avgSalesPerMonth),
        currentStock: prod.quantity
      });
    }

    // Sort fast-moving items descending by sales volume
    fastMovingProducts.sort((a, b) => b.avgSalesPerMonth - a.avgSalesPerMonth);

    // Predictive Reorder Logic
    const reorderRecommendations = [];
    for (let prod of products) {
      // Find latest forecast for this product (e.g. latest month/year in database)
      const prodForecasts = forecasts.filter(f => f.productId === prod._id.toString());
      
      let nextMonthDemand = 15; // default fallback prediction
      if (prodForecasts.length > 0) {
        // Sort to get latest
        prodForecasts.sort((a, b) => (b.year * 12 + b.month) - (a.year * 12 + a.month));
        nextMonthDemand = prodForecasts[0].predictedDemand;
      }

      const currentStock = prod.quantity;
      const threshold = prod.lowStockThreshold;

      // Reorder is recommended if stock is below threshold OR if next month's predicted demand exceeds current stock
      if (currentStock <= threshold || currentStock < nextMonthDemand) {
        const safetyStock = Math.ceil(nextMonthDemand * 0.5); // 50% cushion
        const recommendQty = Math.max(10, (nextMonthDemand + safetyStock) - currentStock);
        
        let priority = 'Medium';
        let timeline = 'Within 14 Days';

        if (currentStock === 0) {
          priority = 'Critical';
          timeline = 'Immediately (Out of Stock)';
        } else if (currentStock <= threshold) {
          priority = 'High';
          timeline = 'Within 3 Days';
        }

        const br = branches.find(b => b._id.toString() === prod.branchId);

        reorderRecommendations.push({
          productId: prod._id.toString(),
          name: prod.name,
          sku: prod.sku,
          branchName: br ? br.name : 'Unknown Branch',
          branchId: prod.branchId,
          currentStock,
          lowStockThreshold: threshold,
          predictedDemand: nextMonthDemand,
          recommendedReorderQty: recommendQty,
          priority,
          timeline,
          supplier: prod.supplier || 'Default Supplier'
        });
      }
    }

    // Dynamic Seasonal Insights
    const seasonalInsights = [];
    const categories = [...new Set(products.map(p => p.category))];

    categories.forEach(cat => {
      // Find average seasonal indices
      let sumIndex = 0;
      let count = 0;
      
      const catProdIds = products.filter(p => p.category === cat).map(p => p._id.toString());
      const catForecasts = forecasts.filter(f => catProdIds.includes(f.productId));

      catForecasts.forEach(f => {
        sumIndex += f.seasonalIndex;
        count++;
      });

      const avgIndex = count > 0 ? (sumIndex / count) : 1.0;
      
      if (avgIndex > 1.1) {
        seasonalInsights.push({
          category: cat,
          trend: 'Upward Spike',
          index: Math.round(avgIndex * 100) / 100,
          insight: `High seasonal index (${Math.round(avgIndex * 100)}%) detected. Stock up early to capture peak consumer demand.`
        });
      } else if (avgIndex < 0.9) {
        seasonalInsights.push({
          category: cat,
          trend: 'Downward Slump',
          index: Math.round(avgIndex * 100) / 100,
          insight: `Low seasonal index (${Math.round(avgIndex * 100)}%) detected. Recommended to thin out stock holdings to avoid holding costs.`
        });
      } else {
        seasonalInsights.push({
          category: cat,
          trend: 'Stable Demand',
          index: 1.0,
          insight: `Demand for ${cat} remains stable. Keep safety stock at standard levels.`
        });
      }
    });

    res.json({
      trendData,
      fastMovingProducts: fastMovingProducts.slice(0, 5),
      reorderRecommendations,
      seasonalInsights
    });

  } catch (error) {
    console.error('Forecast retrieval error:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};
