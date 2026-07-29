const { GoogleGenAI } = require('@google/genai');
const Product = require('../models/Product');
const Branch = require('../models/Branch');
const Defect = require('../models/Defect');
const TransferRequest = require('../models/TransferRequest');
const ChatLog = require('../models/ChatLog');

// Initialize Gen AI client with robust API key cleaning
const rawKey = process.env.GEMINI_API_KEY || '';
let cleanKey = rawKey.trim();
if (cleanKey.includes('GEMINI_API_KEY=')) {
  cleanKey = cleanKey.split('GEMINI_API_KEY=')[0].trim();
}
cleanKey = cleanKey.replace(/[\s\r\n]/g, '');

const ai = new GoogleGenAI({ apiKey: cleanKey });

exports.askChatbot = async (req, res) => {
  try {
    const { message, history } = req.body;
    const { companyId, role, name: userName, id: userId } = req.user;

    if (!message) {
      return res.status(400).json({ message: 'Message is required' });
    }

    if (!process.env.GEMINI_API_KEY) {
      console.error('[CHATBOT ERROR] process.env.GEMINI_API_KEY is not defined!');
      return res.status(200).json({
        success: false,
        reply: "Sorry, I couldn't reach the AI service. Please configure the GEMINI_API_KEY.",
        source: "gemini"
      });
    }

    // 1. Classify the user query intent using Gemini JSON Schema
    const classifierPrompt = `
You are an intent classifier for a Smart Stock Warehouse Inventory Management System.
Analyze the user's current message and optional history, and decide if it requires querying the database or not.

You must return a JSON object matching this schema:
{
  "intent": "query_db" | "general_knowledge",
  "query_type": "all_products" | "low_stock" | "expiry" | "defects" | "transfers" | "newly_added" | "total_value" | "search_product" | "none",
  "search_term": "string",
  "source": "gemini" | "database" | "hybrid",
  "pathAction": "/path" | null
}

Rules for "source":
- Set "source" to "gemini" if the intent is "general_knowledge".
- Set "source" to "database" if the query is a simple stock lookup, count, listing, or database query.
- Set "source" to "hybrid" if the query is asking for suggestions, analysis, recommendations, or asking "why" based on database information.

Rules for "pathAction" (only set if user explicitly requests page navigation, else null):
- "/" for dashboard/statistics/home
- "/products" for product catalog/list
- "/forecasting" for demand forecasting/reorder suggestions
- "/defects" for defect management/faults/camera scanner
- "/branches" for branch management
- "/transfers" for transfers tracking
- "/reports" for reports center
- "/settings" for system settings/profile

Current User Message: "${message}"
`;

    let classification = {
      intent: "general_knowledge",
      query_type: "none",
      search_term: "",
      source: "gemini",
      pathAction: null
    };

    try {
      const responseClassifier = await ai.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: classifierPrompt,
        config: {
          responseMimeType: 'application/json'
        }
      });

      if (responseClassifier.text) {
        classification = JSON.parse(responseClassifier.text);
      }
    } catch (classifyErr) {
      console.error('[CLASSIFIER ERROR] Intent detection failed, falling back to general_knowledge:', classifyErr);
    }

    // 2. Fetch data from MongoDB if intent is query_db
    let dbResult = null;
    if (classification.intent === 'query_db') {
      try {
        const companyBranches = await Branch.find({ companyId });
        const companyBranchIds = companyBranches.map(b => b._id.toString());
        const branchMap = {};
        companyBranches.forEach(b => { branchMap[b._id.toString()] = b.name; });

        switch (classification.query_type) {
          case 'all_products':
            const allProd = await Product.find({ branchId: { $in: companyBranchIds } });
            dbResult = allProd.map(p => ({
              name: p.name,
              sku: p.sku,
              quantity: p.quantity,
              price: p.price,
              category: p.category,
              branchName: branchMap[p.branchId] || 'Warehouse'
            }));
            break;

          case 'low_stock':
            const lowProd = await Product.find({ branchId: { $in: companyBranchIds } });
            dbResult = lowProd
              .filter(p => p.quantity <= (p.lowStockThreshold || 5))
              .map(p => ({
                name: p.name,
                sku: p.sku,
                quantity: p.quantity,
                lowStockThreshold: p.lowStockThreshold,
                branchName: branchMap[p.branchId] || 'Warehouse'
              }));
            break;

          case 'expiry':
            const expProd = await Product.find({ branchId: { $in: companyBranchIds } });
            const today = new Date();
            dbResult = expProd
              .filter(p => p.expiryDate)
              .map(p => {
                const diffDays = Math.ceil((new Date(p.expiryDate) - today) / (1000 * 60 * 60 * 24));
                return {
                  name: p.name,
                  sku: p.sku,
                  expiryDate: p.expiryDate,
                  daysUntilExpiry: diffDays,
                  branchName: branchMap[p.branchId] || 'Warehouse'
                };
              })
              .filter(p => p.daysUntilExpiry <= 30);
            break;

          case 'defects':
            const defects = await Defect.find({ branchId: { $in: companyBranchIds } });
            dbResult = defects.map(d => ({
              productName: d.productName || 'Unlisted Item',
              productSku: d.productSku || 'UNLISTED',
              quantity: d.quantity,
              reason: d.reason,
              status: d.status,
              severity: d.severity,
              rackNumber: d.rackNumber,
              warehouse: d.warehouse,
              category: d.category
            }));
            break;

          case 'transfers':
            const transfers = await TransferRequest.find({
              $or: [
                { sourceCompanyId: companyId },
                { targetCompanyId: companyId }
              ]
            });
            dbResult = transfers.map(t => ({
              id: t._id.toString(),
              sourceBranchName: branchMap[t.sourceBranchId] || 'Branch A',
              targetBranchName: branchMap[t.targetBranchId] || 'Branch B',
              status: t.status,
              type: t.type,
              items: t.items || [],
              createdAt: t.createdAt
            }));
            break;

          case 'newly_added':
            const startOfToday = new Date();
            startOfToday.setHours(0, 0, 0, 0);
            const newProd = await Product.find({
              branchId: { $in: companyBranchIds },
              createdAt: { $gte: startOfToday }
            });
            dbResult = newProd.map(p => ({
              name: p.name,
              sku: p.sku,
              quantity: p.quantity,
              category: p.category,
              branchName: branchMap[p.branchId] || 'Warehouse'
            }));
            break;

          case 'total_value':
            const valProd = await Product.find({ branchId: { $in: companyBranchIds } });
            let totalVal = 0;
            let totalCount = 0;
            valProd.forEach(p => {
              totalVal += (p.price || 0) * (p.quantity || 0);
              totalCount += (p.quantity || 0);
            });
            dbResult = {
              totalInventoryValue: totalVal,
              totalStoredItemsCount: totalCount,
              currency: 'INR'
            };
            break;

          case 'search_product':
            const term = classification.search_term || '';
            const query = { branchId: { $in: companyBranchIds } };
            
            if (term.match(/^[0-9a-fA-F]{24}$/)) {
              query._id = term;
            } else {
              query.$or = [
                { name: { $regex: term, $options: 'i' } },
                { sku: { $regex: term, $options: 'i' } },
                { category: { $regex: term, $options: 'i' } }
              ];
            }
            const matchProducts = await Product.find(query);
            dbResult = matchProducts.map(p => ({
              name: p.name,
              sku: p.sku,
              quantity: p.quantity,
              price: p.price,
              category: p.category,
              branchName: branchMap[p.branchId] || 'Warehouse',
              lowStockThreshold: p.lowStockThreshold
            }));
            break;

          default:
            dbResult = [];
        }
      } catch (dbErr) {
        console.error('[MONGO ERROR] Failed to query database context:', dbErr);
        return res.status(200).json({
          success: false,
          reply: "Unable to retrieve inventory data.",
          source: "database"
        });
      }
    }

    // 3. Assemble chat contents history list for session memory
    const contents = [];
    if (Array.isArray(history) && history.length > 0) {
      // Crop history to last 15 messages to conserve prompt tokens
      const recentHistory = history.slice(-15);
      recentHistory.forEach(msg => {
        if (msg.sender === 'user') {
          contents.push({ role: 'user', parts: [{ text: msg.text }] });
        } else if (msg.sender === 'bot') {
          contents.push({ role: 'model', parts: [{ text: msg.text }] });
        }
      });
    }

    // Append context to final turn if database was queried
    if (classification.intent === 'query_db') {
      const contextMessage = `
[SYSTEM CONTEXT: The user is asking about live inventory/warehouse records. Querying MongoDB retrieved the following database records. DO NOT invent or assume any inventory records that are not in this list. If the list is empty, state that no matching products/records were found in the database. Use this data along with your general knowledge to answer the user's question naturally.]

DATABASE RECORDS RETRIEVED:
${JSON.stringify(dbResult, null, 2)}

USER QUERY: "${message}"
`;
      contents.push({ role: 'user', parts: [{ text: contextMessage }] });
    } else {
      contents.push({ role: 'user', parts: [{ text: message }] });
    }

    // 4. Generate Final Response using Gemini
    let replyText = "";
    try {
      const chatResponse = await ai.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: contents
      });
      replyText = chatResponse.text || "Sorry, I couldn't process that query.";
    } catch (geminiErr) {
      console.error('[GEMINI ERROR] Text generation failed:', geminiErr);
      return res.status(200).json({
        success: false,
        reply: "Sorry, I couldn't reach the AI service. Please try again.",
        source: "gemini"
      });
    }

    // 5. Log chat to Database
    try {
      await ChatLog.create({
        userId: userId.toString(),
        userName,
        userMessage: message,
        botResponse: replyText,
        intent: classification.intent,
        pathAction: classification.pathAction || null
      });
    } catch (logErr) {
      console.error('[DB WARN] Failed to log chat event:', logErr);
    }

    // 6. Return response matching requested format
    res.json({
      success: true,
      reply: replyText,
      source: classification.source,
      action: classification.pathAction || null
    });

  } catch (error) {
    console.error('Chatbot Controller Crash:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};
