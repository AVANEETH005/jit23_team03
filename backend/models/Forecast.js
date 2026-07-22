const { getModel } = require('../config/db');

const ForecastSchema = {
  productId: { type: String, required: true }, // Links to Product._id
  branchId: { type: String, required: true },  // Links to Branch._id
  year: { type: Number, required: true },
  month: { type: Number, required: true }, // 1-12
  actualSales: { type: Number, default: 0 },
  predictedDemand: { type: Number, required: true },
  confidenceInterval: { type: Number, default: 95 }, // Confidence percentage
  seasonalIndex: { type: Number, default: 1.0 }, // Seasonal adjustment multiplier
  movingAverageSales: { type: Number, default: 0 } // Computed average
};

module.exports = getModel('Forecast', ForecastSchema);
