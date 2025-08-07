const express = require('express');
const MessageController = require('../controllers/MessageController');
const { requireAuth } = require('../middleware/AuthMiddleware');

const router = express.Router();

/**
 * Message Routes - Định tuyến cho tin nhắn được mã hóa đầu cuối
 */

// Middleware: Yêu cầu xác thực cho tất cả routes
router.use(requireAuth);

// Encryption keys management
router.post('/keys/init', MessageController.initializeUserKeys.bind(MessageController));
router.get('/keys/user/:userId', MessageController.getUserPublicKey.bind(MessageController));

// Session management
router.post('/session/create', MessageController.createSession.bind(MessageController));

// Message operations
router.post('/send', MessageController.sendMessage.bind(MessageController));
router.get('/conversation/:sessionId', MessageController.getConversationMessages.bind(MessageController));
router.get('/decrypt/:messageId', MessageController.getDecryptionInfo.bind(MessageController));
router.delete('/:messageId', MessageController.deleteMessage.bind(MessageController));

// Conversation management
router.get('/conversations/recent', MessageController.getRecentConversations.bind(MessageController));
router.get('/unread/count', MessageController.getUnreadCount.bind(MessageController));

module.exports = router;
