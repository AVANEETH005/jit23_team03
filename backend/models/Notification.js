const { getModel } = require('../config/db');

const NotificationSchema = {
  type: {
    type: String,
    enum: ['low_stock', 'out_of_stock', 'expiry_soon', 'reorder_needed', 'demand_spike', 'transfer_request', 'defect_reported', 'stock_alert'],
    required: true
  },
  title: { type: String, required: true },
  message: { type: String, required: true },
  isRead: { type: Boolean, default: false },
  branchId: { type: String }, // Links to Branch._id
  companyId: { type: String, required: true }, // Links to Company._id
  referenceId: { type: String } // Can link to Product ID, TransferRequest ID, etc.
};

module.exports = getModel('Notification', NotificationSchema);
