const User = require('../models/User');
const Company = require('../models/Company');
const Branch = require('../models/Branch');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'smart_stock_secret_key_2026';

exports.register = async (req, res) => {
  try {
    const { name, email, password, role, companyCode, companyName, branchName } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({ message: 'Please provide all required fields' });
    }

    // Check if user exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'User with this email already exists' });
    }

    let companyId = '';
    let branchId = '';

    // If companyCode is provided, check if company exists
    if (companyCode) {
      let company = await Company.findOne({ code: companyCode });
      
      // If company doesn't exist but companyName is provided, create new company
      if (!company && companyName) {
        company = await Company.create({
          name: companyName,
          code: companyCode,
          industry: 'General Logistics'
        });
        
        // Also create a Main Warehouse for this new company
        const mainWarehouse = await Branch.create({
          name: branchName || 'Main Warehouse',
          companyId: company._id,
          isWarehouse: true
        });
        branchId = mainWarehouse._id;
      } else if (!company) {
        return res.status(404).json({ message: 'Company code not found. Create a new company or check code.' });
      } else {
        companyId = company._id;
        
        // Find main warehouse or first branch for this company if no branch was specified
        const branch = await Branch.findOne({ companyId: company._id });
        if (branch) {
          branchId = branch._id;
        }
      }
      
      if (company) {
        companyId = company._id;
      }
    } else {
      // Create a default company and branch if none specified
      const randomCode = Math.random().toString(36).substring(2, 7).toUpperCase();
      const company = await Company.create({
        name: companyName || 'My Inventory Corp',
        code: randomCode,
        industry: 'General Logistics'
      });
      companyId = company._id;

      const mainWarehouse = await Branch.create({
        name: 'Main Warehouse',
        companyId: company._id,
        isWarehouse: true
      });
      branchId = mainWarehouse._id;
    }

    // If branch name is provided and company exists, create a new branch or find existing
    if (branchName && companyId) {
      let branch = await Branch.findOne({ name: branchName, companyId });
      if (!branch) {
        branch = await Branch.create({
          name: branchName,
          companyId,
          isWarehouse: false
        });
      }
      branchId = branch._id;
    }

    // Encrypt password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create User
    const newUser = await User.create({
      name,
      email: email.trim().toLowerCase(),
      password: hashedPassword,
      role: role.toLowerCase(),
      companyId: companyId.toString(),
      branchId: branchId ? branchId.toString() : null
    });

    // Create Token
    const token = jwt.sign(
      {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        companyId: newUser.companyId,
        branchId: newUser.branchId
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      token,
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        companyId: newUser.companyId,
        branchId: newUser.branchId
      }
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body || {};
    const cleanEmail = email ? String(email).trim().toLowerCase() : '';
    const cleanPassword = password ? String(password).trim() : '';

    if (!cleanEmail || !cleanPassword) {
      return res.status(400).json({ message: 'Please enter all fields' });
    }

    // Find user
    const user = await User.findOne({ email: cleanEmail });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Validate password
    const isMatch = await bcrypt.compare(cleanPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Create Token
    const token = jwt.sign(
      {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        companyId: user.companyId,
        branchId: user.branchId
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        companyId: user.companyId,
        branchId: user.branchId
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    
    // Omit password
    const userObj = user.toObject ? user.toObject() : { ...user };
    delete userObj.password;
    res.json(userObj);
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const { name, password, branchId } = req.body;
    const updates = {};
    if (name) updates.name = name;
    if (branchId) updates.branchId = branchId;
    if (password) {
      const salt = await bcrypt.genSalt(10);
      updates.password = await bcrypt.hash(password, salt);
    }

    const updatedUser = await User.findByIdAndUpdate(req.user.id, updates, { new: true });
    
    // Re-sign Token
    const token = jwt.sign(
      {
        id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
        companyId: updatedUser.companyId,
        branchId: updatedUser.branchId
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: {
        id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
        companyId: updatedUser.companyId,
        branchId: updatedUser.branchId
      }
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};
