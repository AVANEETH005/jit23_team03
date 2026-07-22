const { getModel } = require('../config/db');

const ChatLogSchema = {
  userId: { type: String },
  userName: { type: String },
  userMessage: { type: String, required: true },
  botResponse: { type: String, required: true },
  intent: { type: String }, // e.g. 'check_stock', 'reorder_suggest', 'navigation'
  pathAction: { type: String } // e.g. '/defects' for page redirects
};

module.exports = getModel('ChatLog', ChatLogSchema);
