const { getModel } = require('../config/db');

const CompanySchema = {
  name: { type: String, required: true },
  code: { type: String, required: true, unique: true },
  industry: String,
  address: String,
  phone: String
};

module.exports = getModel('Company', CompanySchema);
