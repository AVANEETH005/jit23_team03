const { getModel } = require('../config/db');

const TransferRequestSchema = {
  type: {
    type: String,
    enum: ['internal', 'company_exchange'],
    required: true
  },
  requestType: {
    type: String,
    enum: ['branch_to_branch', 'warehouse_transfer', 'partner_exchange'],
    required: true
  },
  sourceCompanyId: { type: String, required: true },
  sourceBranchId: { type: String, required: true },
  targetCompanyId: { type: String, required: true },
  targetBranchId: { type: String, required: true },
  productId: { type: String, required: true },
  productName: { type: String },
  productSku: { type: String },
  quantity: { type: Number, required: true },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'completed'],
    default: 'pending'
  },
  requestedBy: { type: String },
  approvedBy: { type: String },
  notes: { type: String }
};

module.exports = getModel('TransferRequest', TransferRequestSchema);
