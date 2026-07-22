const Product = require('../models/Product');
const Notification = require('../models/Notification');
const Branch = require('../models/Branch');

// Alert checking helper
const checkAndCreateAlerts = async (product) => {
  try {
    const { _id, name, quantity, lowStockThreshold, branchId, expiryDate, sku } = product;
    
    // Find branch to get companyId
    const branch = await Branch.findById(branchId);
    if (!branch) return;
    const companyId = branch.companyId;

    // Check Out of Stock
    if (quantity === 0) {
      const existing = await Notification.findOne({
        type: 'out_of_stock',
        referenceId: _id.toString(),
        isRead: false
      });
      if (!existing) {
        await Notification.create({
          type: 'out_of_stock',
          title: 'Product Out of Stock',
          message: `The product "${name}" (SKU: ${sku}) is completely out of stock in branch "${branch.name}".`,
          branchId: branchId.toString(),
          companyId: companyId.toString(),
          referenceId: _id.toString()
        });
      }
    } 
    // Check Low Stock
    else if (quantity <= lowStockThreshold) {
      const existing = await Notification.findOne({
        type: 'low_stock',
        referenceId: _id.toString(),
        isRead: false
      });
      if (!existing) {
        await Notification.create({
          type: 'low_stock',
          title: 'Low Stock Alert',
          message: `The product "${name}" (SKU: ${sku}) is low on stock (${quantity} remaining, threshold: ${lowStockThreshold}) in branch "${branch.name}".`,
          branchId: branchId.toString(),
          companyId: companyId.toString(),
          referenceId: _id.toString()
        });
      }
    }

    // Check Expiry Soon
    if (expiryDate) {
      const today = new Date();
      const expiry = new Date(expiryDate);
      const diffTime = expiry - today;
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays <= 0) {
        // Expired
        const existing = await Notification.findOne({
          type: 'expiry_soon',
          message: { $regex: 'has expired' },
          referenceId: _id.toString(),
          isRead: false
        });
        if (!existing) {
          await Notification.create({
            type: 'expiry_soon',
            title: 'Product Expired',
            message: `The product "${name}" (SKU: ${sku}) has expired on ${expiry.toLocaleDateString()} in branch "${branch.name}".`,
            branchId: branchId.toString(),
            companyId: companyId.toString(),
            referenceId: _id.toString()
          });
        }
      } else if (diffDays <= 7) {
        // Expiring in 7 days
        const existing = await Notification.findOne({
          type: 'expiry_soon',
          message: { $regex: 'expires soon' },
          referenceId: _id.toString(),
          isRead: false
        });
        if (!existing) {
          await Notification.create({
            type: 'expiry_soon',
            title: 'Product Expiring Soon',
            message: `The product "${name}" (SKU: ${sku}) expires soon on ${expiry.toLocaleDateString()} (${diffDays} days left) in branch "${branch.name}".`,
            branchId: branchId.toString(),
            companyId: companyId.toString(),
            referenceId: _id.toString()
          });
        }
      }
    }
  } catch (error) {
    console.error('Error checking alerts:', error);
  }
};

exports.getProducts = async (req, res) => {
  try {
    const { branchId, role, companyId } = req.user;
    const { search, category, status, branch, branchId: queryBranchId, excessOnly } = req.query;

    const filterBranch = branch || queryBranchId;

    const query = {};

    // Scope check: branch users and staff can only see their branch products by default.
    // Managers and Admins see all company products, but can filter by branch.
    if (role === 'branch_user' || role === 'staff') {
      query.branchId = branchId;
    } else {
      // Find all branches of this company
      const branches = await Branch.find({ companyId });
      const branchIds = branches.map(b => b._id.toString());
      
      if (filterBranch && filterBranch !== 'all') {
        query.branchId = filterBranch;
      } else {
        query.branchId = { $in: branchIds };
      }
    }

    // Search filter (matches Product Name or SKU)
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { sku: { $regex: search, $options: 'i' } }
      ];
    }

    // Category filter
    if (category && category !== 'all') {
      query.category = category;
    }

    // Excess stock filter
    if (excessOnly === 'true') {
      query.isExcessShareable = true;
    }

    let products = await Product.find(query);

    // Filter by stock status in memory / JS to handle dynamics easily
    if (status && status !== 'all') {
      products = products.filter(product => {
        if (status === 'out_of_stock') return product.quantity === 0;
        if (status === 'low_stock') return product.quantity > 0 && product.quantity <= product.lowStockThreshold;
        if (status === 'expiring_soon') {
          if (!product.expiryDate) return false;
          const diffDays = Math.ceil((new Date(product.expiryDate) - new Date()) / (1000 * 60 * 60 * 24));
          return diffDays > 0 && diffDays <= 7;
        }
        if (status === 'expired') {
          if (!product.expiryDate) return false;
          return new Date(product.expiryDate) < new Date();
        }
        return true;
      });
    }

    // Add branch details to products JSON response safely with toObject
    const branchesCache = {};
    const populatedProducts = [];
    for (let product of products) {
      const rawProduct = product.toObject ? product.toObject() : product;
      let bName = 'Unknown Branch';
      if (branchesCache[rawProduct.branchId]) {
        bName = branchesCache[rawProduct.branchId];
      } else {
        const br = await Branch.findById(rawProduct.branchId);
        if (br) {
          bName = br.name;
          branchesCache[rawProduct.branchId] = br.name;
        }
      }
      populatedProducts.push({
        ...rawProduct,
        branchName: bName
      });
    }

    res.json(populatedProducts);
  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

exports.getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });
    
    const rawProduct = product.toObject ? product.toObject() : product;
    const branch = await Branch.findById(rawProduct.branchId);
    res.json({
      ...rawProduct,
      branchName: branch ? branch.name : 'Unknown Branch'
    });
  } catch (error) {
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

exports.createProduct = async (req, res) => {
  try {
    const { name, sku, category, quantity, price, supplier, expiryDate, branchId, lowStockThreshold, excessThreshold, isExcessShareable } = req.body;
    
    if (!name || !sku || !category || quantity === undefined || !price || !branchId) {
      return res.status(400).json({ message: 'Missing required product fields' });
    }

    // Restrict staff from creating products
    if (req.user.role === 'staff') {
      return res.status(403).json({ message: 'Staff roles cannot create products' });
    }

    const newProduct = await Product.create({
      name,
      sku,
      category,
      quantity: Number(quantity),
      price: Number(price),
      supplier,
      expiryDate: expiryDate ? new Date(expiryDate).toISOString() : null,
      branchId,
      lowStockThreshold: lowStockThreshold !== undefined ? Number(lowStockThreshold) : 10,
      excessThreshold: excessThreshold !== undefined ? Number(excessThreshold) : 100,
      isExcessShareable: isExcessShareable || false
    });

    await checkAndCreateAlerts(newProduct);

    res.status(201).json(newProduct);
  } catch (error) {
    console.error('Create product error:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

exports.updateProduct = async (req, res) => {
  try {
    const { name, sku, category, quantity, price, supplier, expiryDate, branchId, lowStockThreshold, excessThreshold, isExcessShareable } = req.body;
    
    // Authorization check
    if (req.user.role === 'staff') {
      return res.status(403).json({ message: 'Staff roles cannot edit products' });
    }

    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });

    const updates = {
      name: name || product.name,
      sku: sku || product.sku,
      category: category || product.category,
      quantity: quantity !== undefined ? Number(quantity) : product.quantity,
      price: price !== undefined ? Number(price) : product.price,
      supplier: supplier !== undefined ? supplier : product.supplier,
      expiryDate: expiryDate !== undefined ? (expiryDate ? new Date(expiryDate).toISOString() : null) : product.expiryDate,
      branchId: branchId || product.branchId,
      lowStockThreshold: lowStockThreshold !== undefined ? Number(lowStockThreshold) : product.lowStockThreshold,
      excessThreshold: excessThreshold !== undefined ? Number(excessThreshold) : product.excessThreshold,
      isExcessShareable: isExcessShareable !== undefined ? isExcessShareable : product.isExcessShareable
    };

    const updatedProduct = await Product.findByIdAndUpdate(req.params.id, updates, { new: true });
    
    await checkAndCreateAlerts(updatedProduct);

    res.json(updatedProduct);
  } catch (error) {
    console.error('Update product error:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

exports.deleteProduct = async (req, res) => {
  try {
    if (req.user.role === 'staff' || req.user.role === 'branch_user') {
      return res.status(403).json({ message: 'Access denied. Managers and Admins only.' });
    }

    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });

    await Product.findByIdAndDelete(req.params.id);
    
    // Clear notifications for this product
    await Notification.deleteMany({ referenceId: req.params.id });

    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Internal Server Error' });
  }
};
