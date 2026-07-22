const { getModel } = require('../config/db');

const UserSchema = {
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { 
    type: String, 
    enum: ['admin', 'manager', 'staff', 'branch_user'], 
    default: 'staff' 
  },
  companyId: { type: String, required: true }, // Links to Company._id
  branchId: { type: String } // Links to Branch._id (null if company-wide admin)
};

module.exports = getModel('User', UserSchema);
