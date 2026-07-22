const Product = require('../models/Product');
const Branch = require('../models/Branch');
const Defect = require('../models/Defect');
const TransferRequest = require('../models/TransferRequest');
const ChatLog = require('../models/ChatLog');

exports.askChatbot = async (req, res) => {
  try {
    const { message } = req.body;
    const { companyId, branchId, role, name: userName, id: userId } = req.user;

    if (!message) {
      return res.status(400).json({ message: 'Message is required' });
    }

    const lowerMessage = message.toLowerCase().trim();

    // Context scoping: get branches of the company
    const companyBranches = await Branch.find({ companyId });
    const companyBranchIds = companyBranches.map(b => b._id.toString());
    const branchMap = {};
    companyBranches.forEach(b => { branchMap[b._id.toString()] = b.name; });

    let botResponse = "";
    let intent = "general";
    let pathAction = null;

    // 1. Navigation intents
    if (lowerMessage.includes('go to') || lowerMessage.includes('navigate') || lowerMessage.includes('show me') || lowerMessage.includes('take me to') || lowerMessage.includes('open')) {
      intent = "navigation";
      if (lowerMessage.includes('dashboard') || lowerMessage.includes('home') || lowerMessage.includes('stat')) {
        botResponse = "Sure, routing you to the main dashboard analytics page.";
        pathAction = "/";
      } else if (lowerMessage.includes('product') || lowerMessage.includes('stock list') || lowerMessage.includes('inventory') || lowerMessage.includes('catalog')) {
        botResponse = "Opening the Product Catalog page where you can manage items, search, and edit records.";
        pathAction = "/products";
      } else if (lowerMessage.includes('forecast') || lowerMessage.includes('prediction') || lowerMessage.includes('demand') || lowerMessage.includes('season')) {
        botResponse = "Navigating to the Demand Forecasting & Predictive Reordering page.";
        pathAction = "/forecasting";
      } else if (lowerMessage.includes('defect') || lowerMessage.includes('fault') || lowerMessage.includes('damage') || lowerMessage.includes('webcam')) {
        botResponse = "Routing you to the Defect Management and Webcam Fault Detection center.";
        pathAction = "/defects";
      } else if (lowerMessage.includes('branch') || lowerMessage.includes('warehouse')) {
        botResponse = "Opening the Multi-Branch Management panel.";
        pathAction = "/branches";
      } else if (lowerMessage.includes('market') || lowerMessage.includes('exchange') || lowerMessage.includes('inter-company') || lowerMessage.includes('partner')) {
        botResponse = "Routing you to the Inter-Company Goods Exchange Marketplace.";
        pathAction = "/marketplace";
      } else if (lowerMessage.includes('transfer') || lowerMessage.includes('request')) {
        botResponse = "Opening the Internal Transfers history and requests tracking panel.";
        pathAction = "/transfers";
      } else if (lowerMessage.includes('report') || lowerMessage.includes('analytics file') || lowerMessage.includes('download')) {
        botResponse = "Opening the Reports module. You can build and export custom reports here.";
        pathAction = "/reports";
      } else if (lowerMessage.includes('setting') || lowerMessage.includes('profile') || lowerMessage.includes('config')) {
        botResponse = "Opening System Settings.";
        pathAction = "/settings";
      } else {
        botResponse = "I support navigation shortcuts! You can ask me to open pages like: *Dashboard*, *Products*, *Forecasting*, *Defects*, *Branches*, *Marketplace*, *Transfers*, or *Reports*.";
      }
    } 

    // 2. Specific Data Query Intents
    
    // 2a. Low stock or out of stock items
    else if (lowerMessage.includes('low stock') || lowerMessage.includes('out of stock') || lowerMessage.includes('running out')) {
      intent = "check_low_stock";
      const products = await Product.find({ branchId: { $in: companyBranchIds } });
      const outOfStockItems = products.filter(p => p.quantity === 0);
      const lowStockItems = products.filter(p => p.quantity > 0 && p.quantity <= p.lowStockThreshold);

      let responseLines = [];
      if (outOfStockItems.length > 0) {
        responseLines.push("**Out of Stock Items:**");
        outOfStockItems.slice(0, 5).forEach(p => {
          responseLines.push(`- ${p.name} (SKU: ${p.sku}) in ${branchMap[p.branchId] || 'Branch'}`);
        });
        if (outOfStockItems.length > 5) responseLines.push(`*...and ${outOfStockItems.length - 5} more items.*`);
      }
      
      if (lowStockItems.length > 0) {
        responseLines.push("\n**Low Stock Items:**");
        lowStockItems.slice(0, 5).forEach(p => {
          responseLines.push(`- ${p.name}: ${p.quantity} left (Threshold: ${p.lowStockThreshold}) in ${branchMap[p.branchId] || 'Branch'}`);
        });
        if (lowStockItems.length > 5) responseLines.push(`*...and ${lowStockItems.length - 5} more items.*`);
      }

      if (responseLines.length === 0) {
        botResponse = "Great news! No products are currently out of stock or low on stock.";
      } else {
        botResponse = responseLines.join('\n');
      }
    }

    // 2b. Expiring soon items
    else if (lowerMessage.includes('expire') || lowerMessage.includes('expiry') || lowerMessage.includes('spoiled')) {
      intent = "check_expiry";
      const products = await Product.find({ branchId: { $in: companyBranchIds } });
      const today = new Date();
      
      const expired = [];
      const expiringSoon = [];

      products.forEach(p => {
        if (!p.expiryDate) return;
        const diffDays = Math.ceil((new Date(p.expiryDate) - today) / (1000 * 60 * 60 * 24));
        if (diffDays < 0) {
          expired.push(p);
        } else if (diffDays <= 30) { // check within 30 days
          expiringSoon.push({ product: p, days: diffDays });
        }
      });

      let responseLines = [];
      if (expired.length > 0) {
        responseLines.push("**Expired Products (Needs immediate removal):**");
        expired.slice(0, 5).forEach(p => {
          responseLines.push(`- ${p.name} (SKU: ${p.sku}) - Expired on ${new Date(p.expiryDate).toLocaleDateString()} in ${branchMap[p.branchId]}`);
        });
      }

      if (expiringSoon.length > 0) {
        responseLines.push("\n**Expiring in next 30 Days (Priority Sales Recommended):**");
        expiringSoon.slice(0, 5).forEach(item => {
          responseLines.push(`- ${item.product.name} (SKU: ${item.product.sku}) - Expires in ${item.days} days (${new Date(item.product.expiryDate).toLocaleDateString()}) in ${branchMap[item.product.branchId]}`);
        });
      }

      if (responseLines.length === 0) {
        botResponse = "No expired or expiring products found in your inventory database.";
      } else {
        botResponse = responseLines.join('\n');
      }
    }

    // 2c. Defective items
    else if (lowerMessage.includes('defect') || lowerMessage.includes('damaged') || lowerMessage.includes('broken')) {
      intent = "check_defects";
      const defects = await Defect.find({ branchId: { $in: companyBranchIds }, status: 'Pending Review' });
      const totalQty = defects.reduce((sum, d) => sum + d.quantity, 0);

      if (totalQty === 0) {
        botResponse = "There are no pending defective items requiring review in your branches.";
      } else {
        botResponse = `There are currently **${defects.length} defect reports** representing **${totalQty} defective items** awaiting administrative review. Use the Defects page to review details or open the webcam module.`;
        pathAction = "/defects";
      }
    }

    // 2d. Pending transfers
    else if (lowerMessage.includes('pending transfer') || lowerMessage.includes('transfers') || lowerMessage.includes('exchange request')) {
      intent = "check_transfers";
      const pendingTransfers = await TransferRequest.find({
        $or: [
          { sourceCompanyId: companyId },
          { targetCompanyId: companyId }
        ],
        status: 'pending'
      });

      if (pendingTransfers.length === 0) {
        botResponse = "No pending stock transfers or inter-company goods exchange requests at this moment.";
      } else {
        botResponse = `There are **${pendingTransfers.length} pending transfer requests** matching your company. I can take you to the Transfer Center to review them.`;
        pathAction = "/transfers";
      }
    }

    // 2e. Reorder suggestions
    else if (lowerMessage.includes('reorder') || lowerMessage.includes('restock') || lowerMessage.includes('suggest')) {
      intent = "check_reorders";
      const products = await Product.find({ branchId: { $in: companyBranchIds } });
      const suggestions = [];

      products.forEach(p => {
        if (p.quantity <= p.lowStockThreshold) {
          const qty = Math.max(20, p.lowStockThreshold * 3 - p.quantity);
          suggestions.push(`- **${p.name}** (SKU: ${p.sku}) in ${branchMap[p.branchId]}: Suggest ordering **${qty} units** from ${p.supplier || 'supplier'}.`);
        }
      });

      if (suggestions.length === 0) {
        botResponse = "Inventory levels are healthy! No automated reorder suggestions generated.";
      } else {
        botResponse = "**Predictive Reorder Recommendations:**\n" + suggestions.slice(0, 5).join('\n') + "\n\nNavigate to *Forecasting* to see timeline schedules.";
        pathAction = "/forecasting";
      }
    }

    // 2f. Generic search query for products (e.g. "How many laptops available?", "Which branch has paracetamol?")
    else {
      // Extract words to find matching items
      const words = lowerMessage.split(/\s+/);
      // Remove common stop words
      const stopWords = ['how', 'many', 'much', 'is', 'are', 'available', 'which', 'branch', 'has', 'have', 'do', 'we', 'in', 'stock', 'the', 'of', 'for', 'laptops', 'laptops?'];
      const searchTerms = words.filter(w => !stopWords.includes(w) && w.length > 2).map(w => w.replace(/[?.,!]/g, ''));

      let matchedProduct = null;
      if (searchTerms.length > 0) {
        // Query database for products matching terms
        const queryTerm = searchTerms[0];
        // Match product name, SKU, or category
        const matchProducts = await Product.find({
          branchId: { $in: companyBranchIds },
          $or: [
            { name: { $regex: queryTerm, $options: 'i' } },
            { category: { $regex: queryTerm, $options: 'i' } }
          ]
        });

        if (matchProducts.length > 0) {
          intent = "search_product";
          // Group by name and aggregate quantities across branches
          const productSummary = {};
          matchProducts.forEach(p => {
            if (!productSummary[p.name]) {
              productSummary[p.name] = {
                sku: p.sku,
                totalQty: 0,
                branches: []
              };
            }
            productSummary[p.name].totalQty += p.quantity;
            productSummary[p.name].branches.push({
              branchName: branchMap[p.branchId] || 'Branch',
              qty: p.quantity
            });
          });

          let lines = ["**Search Query Results:**"];
          for (let name in productSummary) {
            const summary = productSummary[name];
            lines.push(`- **${name}** (SKU: ${summary.sku}): **${summary.totalQty} total units** available.`);
            summary.branches.forEach(b => {
              lines.push(`  * ${b.branchName}: ${b.qty} units`);
            });
          }
          botResponse = lines.join('\n');
        }
      }

      // Default fallback if no pattern matched
      if (!botResponse) {
        botResponse = `Hello ${userName}! I am the Smart Stock Intelligence Assistant. I am linked to your live database. 

You can ask me questions such as:
- *"Which items are low stock?"*
- *"Show reorder suggestions"*
- *"What products expire soon?"*
- *"Are there any pending transfers?"*
- *"How many [Product Name] do we have?"*

I can also route pages for you. Try asking: *"Take me to the defects page."*`;
      }
    }

    // Save Chat Log
    await ChatLog.create({
      userId: userId.toString(),
      userName,
      userMessage: message,
      botResponse,
      intent,
      pathAction
    });

    res.json({
      message: botResponse,
      action: pathAction
    });

  } catch (error) {
    console.error('Chatbot error:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};
