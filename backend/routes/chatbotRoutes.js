const express = require('express');
const router = express.Router();
const chatbotController = require('../controllers/chatbotController');
const authMiddleware = require('../middleware/authMiddleware');

router.use(authMiddleware);

router.post('/ask', chatbotController.askChatbot);

module.exports = router;
