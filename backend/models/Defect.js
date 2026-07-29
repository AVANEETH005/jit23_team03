const { getModel } = require('../config/db');

const DefectSchema = {
  productId: { type: String, required: true }, // Links to Product._id
  branchId: { type: String, required: true },  // Links to Branch._id
  quantity: { type: Number, required: true, default: 1 },
  reason: { type: String, required: true },     // e.g. "Packaging Torn", "Dent", etc.
  imageUrl: { type: String },                   // Base64 or local path
  status: {
    type: String,
    enum: ['Pending Review', 'Approved', 'Rejected', 'Disposed', 'Returned to Vendor', 'Repaired', 'Stock Adjusted', 'Discarded'],
    default: 'Pending Review'
  },
  reportedBy: { type: String },
  notes: { type: String },
  severity: {
    type: String,
    enum: ['Low', 'Medium', 'High', 'Critical'],
    default: 'Medium'
  },
  rackNumber: { type: String, default: 'R-10' },
  warehouse: { type: String, default: 'Main Warehouse' },
  category: { type: String, default: 'General' },
  productName: { type: String },
  productSku: { type: String }
};

module.exports = getModel('Defect', DefectSchema);
