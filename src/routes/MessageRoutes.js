const express = require('express');
const MessageController = require('../controllers/MessageController');
const { requireAuth } = require('../middleware/AuthMiddleware');
const FileUploadService = require('../services/FileUploadService');

const router = express.Router();

/**
 * Enhanced Message Routes - Real-time chat with file upload and E2E encryption
 */

// Middleware: Yêu cầu xác thực cho tất cả routes
router.use(requireAuth);

// Enhanced real-time message operations
router.post('/send', MessageController.sendMessage.bind(MessageController));
router.post('/send-with-files',
    FileUploadService.getMultipleUploadMiddleware([
        { name: 'attachments', maxCount: 5 }
    ]),
    MessageController.sendMessageWithFiles ? MessageController.sendMessageWithFiles.bind(MessageController) : MessageController.sendMessage.bind(MessageController)
);

// File-specific message types
router.post('/send-image',
    FileUploadService.getUploadMiddleware('image'),
    MessageController.sendImageMessage ? MessageController.sendImageMessage.bind(MessageController) : MessageController.sendMessage.bind(MessageController)
);

router.post('/send-video',
    FileUploadService.getUploadMiddleware('video'),
    MessageController.sendVideoMessage ? MessageController.sendVideoMessage.bind(MessageController) : MessageController.sendMessage.bind(MessageController)
);

// Existing E2E encryption features
router.post('/keys/init', MessageController.initializeUserKeys.bind(MessageController));
router.get('/keys/user/:userId', MessageController.getUserPublicKey.bind(MessageController));

// Session management
router.post('/session/create', MessageController.createSession.bind(MessageController));

// Message operations
router.get('/conversation/:sessionId', MessageController.getConversationMessages.bind(MessageController));
router.get('/conversation/user/:userId', MessageController.getUserConversation ? MessageController.getUserConversation.bind(MessageController) : MessageController.getConversationMessages.bind(MessageController));
router.get('/decrypt/:messageId', MessageController.getDecryptionInfo.bind(MessageController));
router.delete('/:messageId', MessageController.deleteMessage.bind(MessageController));

// Real-time features
router.put('/mark-read/:userId', MessageController.markAsRead ? MessageController.markAsRead.bind(MessageController) : MessageController.getConversationMessages.bind(MessageController));
router.post('/:messageId/reaction', MessageController.addReaction ? MessageController.addReaction.bind(MessageController) : MessageController.getConversationMessages.bind(MessageController));

// Conversation management
router.get('/conversations/recent', MessageController.getRecentConversations.bind(MessageController));
router.get('/conversations', MessageController.getUserConversations ? MessageController.getUserConversations.bind(MessageController) : MessageController.getRecentConversations.bind(MessageController));
router.get('/unread/count', MessageController.getUnreadCount.bind(MessageController));

// Search functionality  
router.get('/search', MessageController.searchMessages ? MessageController.searchMessages.bind(MessageController) : MessageController.getConversationMessages.bind(MessageController));

module.exports = router;
