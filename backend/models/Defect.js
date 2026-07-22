const { getModel } = require('../config/db');

const DefectSchema = {
  productId: { type: String, required: true }, // Links to Product._id
  branchId: { type: String, required: true },  // Links to Branch._id
  quantity: { type: Number, required: true, default: 1 },
  reason: {
    type: String,
    enum: ['Damaged', 'Broken', 'Expired', 'Returned', 'Packaging Issue'],
    required: true
  },
  imageUrl: { type: String }, // Base64 or local filepath of captured webcam image
  status: {
    type: String,
    enum: ['Pending Review', 'Stock Adjusted', 'Discarded'],
    default: 'Pending Review'
  },
  reportedBy: { type: String }, // User name/email
  notes: { type: String }
};

module.exports = getModel('Defect', DefectSchema);
