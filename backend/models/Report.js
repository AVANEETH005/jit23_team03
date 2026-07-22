const { getModel } = require('../config/db');

const ReportSchema = {
  type: {
    type: String,
    enum: ['stock', 'defect', 'forecast', 'transfer', 'expiry'],
    required: true
  },
  title: { type: String, required: true },
  parameters: { type: Object, default: {} }, // e.g. { branchId: '...', category: '...' }
  data: { type: Object, default: {} }, // snapshot data of the report
  createdBy: { type: String, required: true } // Name or email
};

module.exports = getModel('Report', ReportSchema);
