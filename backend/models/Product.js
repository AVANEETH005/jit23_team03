const { getModel } = require('../config/db');

const ProductSchema = {
  name: { type: String, required: true },
  sku: { type: String, required: true },
  category: { type: String, required: true },
  quantity: { type: Number, required: true, default: 0 },
  price: { type: Number, required: true, default: 0 },
  supplier: { type: String },
  expiryDate: { type: Date },
  branchId: { type: String, required: true }, // Links to Branch._id
  lowStockThreshold: { type: Number, default: 10 },
  excessThreshold: { type: Number, default: 100 },
  isExcessShareable: { type: Boolean, default: false } // For Inter-Company Goods Exchange
};

module.exports = getModel('Product', ProductSchema);
