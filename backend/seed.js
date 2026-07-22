require('dotenv').config();
const bcrypt = require('bcryptjs');
const { connectDB } = require('./config/db');

// Import models
const Company = require('./models/Company');
const Branch = require('./models/Branch');
const User = require('./models/User');
const Product = require('./models/Product');
const Forecast = require('./models/Forecast');
const Defect = require('./models/Defect');
const Notification = require('./models/Notification');
const TransferRequest = require('./models/TransferRequest');

const seedData = async () => {
  try {
    console.log('🌱 Starting database seeding...');
    await connectDB();

    // 1. Clear Existing Data
    console.log('🧹 Clearing old records...');
    await Company.deleteMany({});
    await Branch.deleteMany({});
    await User.deleteMany({});
    await Product.deleteMany({});
    await Forecast.deleteMany({});
    await Defect.deleteMany({});
    await Notification.deleteMany({});
    await TransferRequest.deleteMany({});

    // 2. Create Companies
    console.log('🏢 Creating companies...');
    const company1 = await Company.create({
      name: 'Smart Logistics India Pvt Ltd',
      code: 'SLI2026',
      industry: 'Electronics, FMCG & Medical Supplies Distribution',
      address: '100 Innovation Way, Tech District, Bengaluru',
      phone: '+91-9876543210'
    });

    const company2 = await Company.create({
      name: 'Apex Retail Group India',
      code: 'ARG2026',
      industry: 'Partner Retail Exchanges',
      address: '45 Commerce Boulevard, Mumbai',
      phone: '+91-9123456789'
    });

    // 3. Create Branches
    console.log('📍 Creating branches...');
    const warehouse1 = await Branch.create({
      name: 'Main Warehouse (Bengaluru HQ)',
      address: '100 Innovation Way, Electronic City Dock A',
      companyId: company1._id.toString(),
      isWarehouse: true
    });

    const branchA = await Branch.create({
      name: 'Branch A - Downtown Hub (MG Road)',
      address: '25 Main Street, Suite 101, Bengaluru',
      companyId: company1._id.toString(),
      isWarehouse: false
    });

    const branchB = await Branch.create({
      name: 'Branch B - Westside Depot (Whitefield)',
      address: '880 Industrial Avenue, Bengaluru',
      companyId: company1._id.toString(),
      isWarehouse: false
    });

    const partnerWarehouse = await Branch.create({
      name: 'Apex Central Hub (Mumbai)',
      address: '45 Commerce Boulevard, Andheri East Dock B',
      companyId: company2._id.toString(),
      isWarehouse: true
    });

    const partnerBranch = await Branch.create({
      name: 'Apex Store 1 (Bandra)',
      address: '90 Plaza Boulevard, Mumbai',
      companyId: company2._id.toString(),
      isWarehouse: false
    });

    // 4. Create Users
    console.log('👤 Creating user credentials...');
    const hashPassword = async (pwd) => await bcrypt.hash(pwd, 10);

    const adminUser = await User.create({
      name: 'Sarah Jenkins',
      email: 'admin@smartstock.com',
      password: await hashPassword('admin123'),
      role: 'admin',
      companyId: company1._id.toString(),
      branchId: warehouse1._id.toString()
    });

    const managerUser = await User.create({
      name: 'Marcus Vance',
      email: 'manager@smartstock.com',
      password: await hashPassword('manager123'),
      role: 'manager',
      companyId: company1._id.toString(),
      branchId: warehouse1._id.toString()
    });

    const staffUser = await User.create({
      name: 'James Carter',
      email: 'staff@smartstock.com',
      password: await hashPassword('staff123'),
      role: 'staff',
      companyId: company1._id.toString(),
      branchId: branchA._id.toString()
    });

    const branchUser = await User.create({
      name: 'Elena Rostova',
      email: 'branch@smartstock.com',
      password: await hashPassword('branch123'),
      role: 'branch_user',
      companyId: company1._id.toString(),
      branchId: branchA._id.toString()
    });

    const partnerUser = await User.create({
      name: 'Tom Bradley',
      email: 'partner@apex.com',
      password: await hashPassword('partner123'),
      role: 'admin',
      companyId: company2._id.toString(),
      branchId: partnerWarehouse._id.toString()
    });

    // 5. Create Products across diverse categories (Electronics, Medical, Groceries, Apparel, Hardware) priced in INR (₹)
    console.log('📦 Creating multi-category product lists in INR (₹)...');
    
    // Main Warehouse stock
    const p1_wh = await Product.create({
      name: 'MacBook Pro 16 M3',
      sku: 'MAC-PRO-16',
      category: 'Electronics',
      quantity: 120,
      price: 249900.00,
      supplier: 'Apple India Pvt Ltd',
      branchId: warehouse1._id.toString(),
      lowStockThreshold: 15,
      excessThreshold: 100,
      isExcessShareable: true
    });

    const p2_wh = await Product.create({
      name: 'iPhone 15 Pro 256GB',
      sku: 'IPHONE-15',
      category: 'Electronics',
      quantity: 80,
      price: 134900.00,
      supplier: 'Apple India Pvt Ltd',
      branchId: warehouse1._id.toString(),
      lowStockThreshold: 20,
      excessThreshold: 70,
      isExcessShareable: false
    });

    const p3_wh = await Product.create({
      name: 'Basmati Rice Premium 10kg',
      sku: 'RICE-BAS-10K',
      category: 'Groceries & FMCG',
      quantity: 500,
      price: 1250.00,
      supplier: 'India Gate Foods',
      expiryDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString(),
      branchId: warehouse1._id.toString(),
      lowStockThreshold: 50,
      excessThreshold: 400,
      isExcessShareable: true
    });

    const p4_wh = await Product.create({
      name: 'Cotton Round Neck T-Shirt L',
      sku: 'APP-TSHIRT-L',
      category: 'Apparel & Clothing',
      quantity: 250,
      price: 899.00,
      supplier: 'Raymond Textile Ltd',
      branchId: warehouse1._id.toString(),
      lowStockThreshold: 30,
      excessThreshold: 200,
      isExcessShareable: true
    });

    // Branch A (Downtown) Stock
    const p1_ba = await Product.create({
      name: 'MacBook Pro 16 M3',
      sku: 'MAC-PRO-16',
      category: 'Electronics',
      quantity: 5,
      price: 249900.00,
      supplier: 'Apple India Pvt Ltd',
      branchId: branchA._id.toString(),
      lowStockThreshold: 15,
      excessThreshold: 30,
      isExcessShareable: false
    });

    const p2_ba = await Product.create({
      name: 'iPhone 15 Pro 256GB',
      sku: 'IPHONE-15',
      category: 'Electronics',
      quantity: 0,
      price: 134900.00,
      supplier: 'Apple India Pvt Ltd',
      branchId: branchA._id.toString(),
      lowStockThreshold: 20,
      excessThreshold: 50,
      isExcessShareable: false
    });

    const p5_ba = await Product.create({
      name: 'Paracetamol 500mg (Strip of 15)',
      sku: 'PARA-500',
      category: 'Pharmaceuticals',
      quantity: 45,
      price: 45.00,
      supplier: 'Pfizer India Ltd',
      expiryDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
      branchId: branchA._id.toString(),
      lowStockThreshold: 30,
      excessThreshold: 100,
      isExcessShareable: false
    });

    const p6_ba = await Product.create({
      name: 'Amoxicillin 250mg Capsules',
      sku: 'AMOX-250',
      category: 'Pharmaceuticals',
      quantity: 15,
      price: 120.00,
      supplier: 'GSK Pharma India',
      expiryDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
      branchId: branchA._id.toString(),
      lowStockThreshold: 10,
      excessThreshold: 50,
      isExcessShareable: false
    });

    const p7_ba = await Product.create({
      name: 'Bosch Professional Power Drill 750W',
      sku: 'HW-DRILL-750',
      category: 'Industrial & Hardware',
      quantity: 18,
      price: 4299.00,
      supplier: 'Bosch India Power Tools',
      branchId: branchA._id.toString(),
      lowStockThreshold: 5,
      excessThreshold: 25,
      isExcessShareable: false
    });

    // Partner Company Stock
    const partner_p1 = await Product.create({
      name: 'Samsung S24 Ultra 512GB',
      sku: 'SAMP-S24',
      category: 'Electronics',
      quantity: 25,
      price: 129999.00,
      supplier: 'Samsung India Electronics',
      branchId: partnerWarehouse._id.toString(),
      lowStockThreshold: 5,
      excessThreshold: 20,
      isExcessShareable: true
    });

    // 6. Create Forecasting Sales logs
    console.log('📈 Creating sales forecast datasets...');
    const monthlyForecasts = [];

    const productsForForecasting = [
      { id: p1_wh._id, branch: warehouse1._id },
      { id: p2_wh._id, branch: warehouse1._id },
      { id: p1_ba._id, branch: branchA._id },
      { id: p5_ba._id, branch: branchA._id }
    ];

    const year = 2026;
    productsForForecasting.forEach(({ id, branch }) => {
      const monthlyPatterns = [
        { month: 1, actual: 45, pred: 40, index: 1.0 },
        { month: 2, actual: 38, pred: 42, index: 0.95 },
        { month: 3, actual: 52, pred: 48, index: 1.05 },
        { month: 4, actual: 61, pred: 58, index: 1.15 },
        { month: 5, actual: 48, pred: 50, index: 1.0 },
        { month: 6, actual: 72, pred: 68, index: 1.3 },
        { month: 7, actual: 40, pred: 75, index: 1.25 }
      ];

      monthlyPatterns.forEach(({ month, actual, pred, index }) => {
        monthlyForecasts.push({
          productId: id.toString(),
          branchId: branch.toString(),
          year,
          month,
          actualSales: actual,
          predictedDemand: pred,
          confidenceInterval: 92,
          seasonalIndex: index,
          movingAverageSales: Math.round((actual + pred) / 2)
        });
      });
    });

    await Forecast.create(monthlyForecasts);

    // 7. Create Defects
    console.log('⚠️ Creating defect records...');
    await Defect.create({
      productId: p1_ba._id.toString(),
      branchId: branchA._id.toString(),
      quantity: 1,
      reason: 'Damaged',
      status: 'Pending Review',
      reportedBy: 'James Carter',
      notes: 'Screen crack detected during unpack inspection.'
    });

    await Defect.create({
      productId: p5_ba._id.toString(),
      branchId: branchA._id.toString(),
      quantity: 5,
      reason: 'Packaging Issue',
      status: 'Stock Adjusted',
      reportedBy: 'Elena Rostova',
      notes: 'Inner seal broken on delivery. Removed from sellable stock.'
    });

    // 8. Create Transfer Request
    console.log('🔄 Creating exchange request history...');
    await TransferRequest.create({
      type: 'company_exchange',
      requestType: 'partner_exchange',
      sourceCompanyId: company2._id.toString(),
      sourceBranchId: partnerWarehouse._id.toString(),
      targetCompanyId: company1._id.toString(),
      targetBranchId: warehouse1._id.toString(),
      productId: partner_p1._id.toString(),
      productName: 'Samsung S24 Ultra 512GB',
      productSku: 'SAMP-S24',
      quantity: 5,
      status: 'pending',
      requestedBy: 'Sarah Jenkins',
      notes: 'Urgent exchange request: Customer waiting at Main Warehouse.'
    });

    // 9. Create Notifications
    console.log('🔔 Creating alert notifications...');
    await Notification.create({
      type: 'low_stock',
      title: 'Low Stock Alert',
      message: `The product "MacBook Pro 16 M3" (SKU: MAC-PRO-16) is low on stock (5 remaining) in branch "Branch A - Downtown Hub".`,
      branchId: branchA._id.toString(),
      companyId: company1._id.toString(),
      referenceId: p1_ba._id.toString()
    });

    await Notification.create({
      type: 'out_of_stock',
      title: 'Product Out of Stock',
      message: `The product "iPhone 15 Pro 256GB" (SKU: IPHONE-15) is completely out of stock in branch "Branch A - Downtown Hub".`,
      branchId: branchA._id.toString(),
      companyId: company1._id.toString(),
      referenceId: p2_ba._id.toString()
    });

    await Notification.create({
      type: 'expiry_soon',
      title: 'Product Expiring Soon',
      message: `The product "Paracetamol 500mg (Strip of 15)" (SKU: PARA-500) expires soon on ${new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toLocaleDateString()} (5 days left) in branch "Branch A - Downtown Hub".`,
      branchId: branchA._id.toString(),
      companyId: company1._id.toString(),
      referenceId: p5_ba._id.toString()
    });

    console.log('✅ Database seeding completed successfully in INR (₹)!');
    process.exit(0);

  } catch (error) {
    console.error('❌ Seeding error:', error);
    process.exit(1);
  }
};

seedData();
