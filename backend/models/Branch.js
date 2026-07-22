const { getModel } = require('../config/db');

const BranchSchema = {
  name: { type: String, required: true },
  address: String,
  companyId: { type: String, required: true }, // Links to Company._id
  isWarehouse: { type: Boolean, default: false } // True if Main Warehouse
};

module.exports = getModel('Branch', BranchSchema);
