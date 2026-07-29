const User = require('../models/User');
const Company = require('../models/Company');
const Branch = require('../models/Branch');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');

const JWT_SECRET = process.env.JWT_SECRET || 'smart_stock_secret_key_2026';

exports.register = async (req, res) => {
  try {
    const { name, email, password, role, companyCode, companyName, branchName, phone } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({ message: 'Please provide all required fields' });
    }

    const cleanEmail = email.trim().toLowerCase();

    // Check if user exists
    const userExists = await User.findOne({ email: cleanEmail });
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

// -----------------------------------------------------------------
// Real-Time SMTP & Console Generated OTP Authentication
// -----------------------------------------------------------------
const otpCache = new Map();
let testTransporter = null;

const getTransporter = async () => {
  // If user configured real SMTP credentials in process.env, use them!
  if (process.env.SMTP_USER && process.env.SMTP_PASS) {
    try {
      const realTransporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.SMTP_PORT || '465'),
        secure: process.env.SMTP_SECURE === 'false' ? false : true,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS
        }
      });
      return { transporter: realTransporter, isReal: true };
    } catch (err) {
      console.error('Failed to configure real SMTP transporter:', err);
    }
  }

  // Fallback to Ethereal test SMTP
  if (testTransporter) return { transporter: testTransporter, isReal: false };
  try {
    const testAccount = await nodemailer.createTestAccount();
    testTransporter = nodemailer.createTransport({
      host: testAccount.smtp.host,
      port: testAccount.smtp.port,
      secure: testAccount.smtp.secure,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass
      }
    });
    return { transporter: testTransporter, isReal: false };
  } catch (err) {
    console.error('Failed to create Nodemailer Ethereal SMTP transport:', err);
    return null;
  }
};

exports.sendOtp = async (req, res) => {
  try {
    const { email, phone } = req.body;
    if (!email) {
      return res.status(400).json({ message: 'Please provide email address.' });
    }

    const cleanEmail = email.trim().toLowerCase();
    
    // Generate secure 6 digit code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    otpCache.set(cleanEmail, {
      code,
      expiresAt: Date.now() + 300000 // 5 minutes
    });

    // Output code to console for WMS Operator developer validation
    console.log('\n*************************************************');
    console.log(`[OTP SERVER] AUTHENTICATION CODE FOR: ${cleanEmail}`);
    if (phone) {
      console.log(`[SMS GATEWAY] MOBILE OTP DISPATCHED TO: ${phone}`);
    }
    console.log(`CODE: ${code}`);
    console.log('*************************************************\n');

    // Attempt SMTP transfer
    const transportResult = await getTransporter();
    let emailUrl = null;
    let sentViaRealSmtp = false;

    if (transportResult && transportResult.transporter) {
      const { transporter, isReal } = transportResult;
      sentViaRealSmtp = isReal;
      try {
        const fromEmail = isReal ? process.env.SMTP_USER : 'otp@smartstock.com';
        const info = await transporter.sendMail({
          from: `"AI Stock Intelligence" <${fromEmail}>`,
          to: cleanEmail,
          subject: 'AI Stock Intelligence Verification OTP',
          text: `Your WMS authentication verification code is: ${code}. Valid for 5 minutes.`,
          html: `
            <div style="font-family: sans-serif; padding: 20px; background-color: #0f172a; color: #f1f5f9; border-radius: 12px; max-width: 500px;">
              <h2 style="color: #3b82f6; margin-bottom: 5px;">AI Stock Intelligence</h2>
              <p style="font-size: 12px; color: #94a3b8;">Predictive Decision Support Security Code</p>
              <hr style="border: 0; border-top: 1px solid #334155; margin: 15px 0;" />
              <p>Please enter the following 6-digit OTP verification code to access your warehouse terminal:</p>
              <div style="font-size: 32px; font-weight: bold; color: #10b981; letter-spacing: 4px; padding: 15px; background-color: #020617; border-radius: 8px; text-align: center; margin: 20px 0;">
                ${code}
              </div>
              <p style="font-size: 11px; color: #64748b;">This OTP code is valid for 5 minutes. If you did not request this code, please contact WMS Administration.</p>
            </div>
          `
        });

        if (!isReal) {
          emailUrl = nodemailer.getTestMessageUrl(info);
          console.log(`[SMTP Mail] Ethereal test inbox link: ${emailUrl}`);
        } else {
          console.log(`[SMTP Mail] Real-time OTP email sent successfully to ${cleanEmail}`);
        }
      } catch (err) {
        console.error('Nodemailer sendMail failed:', err);
      }
    }

    res.json({ 
      message: sentViaRealSmtp 
        ? `OTP Sent successfully to ${cleanEmail}.` 
        : 'OTP Sent successfully. Check terminal console or Ethereal email.',
      emailUrl 
    });

  } catch (error) {
    console.error('Send OTP error:', error);
    res.status(500).json({ message: 'Failed to send OTP' });
  }
};

exports.verifyOtp = async (req, res) => {
  try {
    const { email, code } = req.body;
    if (!email || !code) {
      return res.status(400).json({ message: 'Please enter email and OTP code.' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const cached = otpCache.get(cleanEmail);

    if (!cached) {
      return res.status(400).json({ message: 'OTP request not found or expired.' });
    }

    if (cached.expiresAt < Date.now()) {
      otpCache.delete(cleanEmail);
      return res.status(400).json({ message: 'OTP code has expired.' });
    }

    if (cached.code !== code.trim()) {
      return res.status(400).json({ message: 'Invalid OTP verification code.' });
    }

    otpCache.delete(cleanEmail);

    // Find or register new user
    let user = await User.findOne({ email: cleanEmail });
    if (!user) {
      const defaultCompany = await Company.findOne() || await Company.create({
        name: 'Smart Stock WMS Corp',
        code: 'WMS-DEFAULT',
        industry: 'Logistics'
      });

      const defaultBranch = await Branch.findOne({ companyId: defaultCompany._id }) || await Branch.create({
        name: 'Main Warehouse',
        companyId: defaultCompany._id,
        isWarehouse: true
      });

      const salt = await bcrypt.genSalt(10);
      const randomPassword = Math.random().toString(36).substring(2, 10);
      const hashedPassword = await bcrypt.hash(randomPassword, salt);

      user = await User.create({
        name: cleanEmail.split('@')[0],
        email: cleanEmail,
        password: hashedPassword,
        role: 'admin',
        companyId: defaultCompany._id.toString(),
        branchId: defaultBranch._id.toString()
      });
    }

    // Sign Token
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
    console.error('Verify OTP error:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};
