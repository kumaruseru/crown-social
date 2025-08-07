const Message = require('../models/Message');
const User = require('../models/User');
const EncryptionService = require('../services/EncryptionService');
const BaseController = require('./BaseController');
const FileUploadService = require('../services/FileUploadService');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const crypto = require('crypto');

/**
 * MessageController - Xử lý các request liên quan đến tin nhắn
 */
class MessageController extends BaseController {
    
    /**
     * Khởi tạo encryption keys cho user nếu chưa có
     */
    async initializeUserKeys(req, res) {
        try {
            const userId = req.user.id;
            const user = await User.findById(userId);
            
            if (!user) {
                return this.sendError(res, 'Không tìm thấy người dùng', 404);
            }
            
            // Kiểm tra xem user đã có keys chưa
            if (user.publicKey && user.privateKey) {
                return this.sendSuccess(res, {
                    publicKey: user.publicKey,
                    keyFingerprint: user.keyFingerprint,
                    keyGeneratedAt: user.keyGeneratedAt
                }, 'Keys đã tồn tại');
            }
            
            // Tạo cặp khóa RSA mới
            const { publicKey, privateKey } = EncryptionService.generateRSAKeyPair();
            const keyFingerprint = EncryptionService.generateKeyFingerprint(publicKey);
            
            // Mã hóa private key bằng password của user (nếu có)
            let encryptedPrivateKey = privateKey;
            if (user.password) {
                // Tạo key từ password để mã hóa private key
                const salt = crypto.randomBytes(16);
                const key = crypto.pbkdf2Sync(user.password, salt, 100000, 32, 'sha256');
                const iv = crypto.randomBytes(16);
                
                const cipher = crypto.createCipher('aes-256-cbc', key);
                let encrypted = cipher.update(privateKey, 'utf8');
                encrypted = Buffer.concat([encrypted, cipher.final()]);
                
                encryptedPrivateKey = JSON.stringify({
                    encrypted: encrypted.toString('base64'),
                    salt: salt.toString('base64'),
                    iv: iv.toString('base64')
                });
            }
            
            // Lưu keys vào database
            user.publicKey = publicKey;
            user.privateKey = encryptedPrivateKey;
            user.keyFingerprint = keyFingerprint;
            user.keyGeneratedAt = new Date();
            await user.save();
            
            return this.sendSuccess(res, {
                publicKey: publicKey,
                keyFingerprint: keyFingerprint,
                keyGeneratedAt: user.keyGeneratedAt
            }, 'Khởi tạo encryption keys thành công');
            
        } catch (error) {
            console.error('Error initializing user keys:', error);
            return this.sendError(res, 'Không thể khởi tạo encryption keys', 500);
        }
    }
    
    /**
     * Lấy public key của user khác để mã hóa tin nhắn
     */
    async getUserPublicKey(req, res) {
        try {
            const { userId } = req.params;
            
            const user = await User.findById(userId).select('publicKey keyFingerprint keyGeneratedAt firstName lastName username');
            
            if (!user) {
                return this.sendError(res, 'Không tìm thấy người dùng', 404);
            }
            
            if (!user.publicKey) {
                return this.sendError(res, 'Người dùng chưa khởi tạo encryption keys', 400);
            }
            
            return this.sendSuccess(res, {
                userId: user._id,
                publicKey: user.publicKey,
                keyFingerprint: user.keyFingerprint,
                keyGeneratedAt: user.keyGeneratedAt,
                userInfo: {
                    firstName: user.firstName,
                    lastName: user.lastName,
                    username: user.username
                }
            });
            
        } catch (error) {
            console.error('Error getting user public key:', error);
            return this.sendError(res, 'Không thể lấy public key', 500);
        }
    }
    
    /**
     * Gửi tin nhắn được mã hóa
     */
    async sendMessage(req, res) {
        try {
            const senderId = req.user.id;
            const { receiverId, message, messageType = 'text', replyTo = null } = req.body;
            
            // Validation
            if (!receiverId || !message) {
                return this.sendError(res, 'Thiếu thông tin bắt buộc', 400);
            }
            
            // Kiểm tra receiver tồn tại
            const receiver = await User.findById(receiverId).select('publicKey keyFingerprint');
            if (!receiver) {
                return this.sendError(res, 'Không tìm thấy người nhận', 404);
            }
            
            if (!receiver.publicKey) {
                return this.sendError(res, 'Người nhận chưa khởi tạo encryption keys', 400);
            }
            
            // Lấy public key của sender
            const sender = await User.findById(senderId).select('publicKey');
            if (!sender.publicKey) {
                return this.sendError(res, 'Bạn chưa khởi tạo encryption keys', 400);
            }
            
            // Tạo khóa AES cho tin nhắn này
            const aesKey = EncryptionService.generateAESKey();
            
            // Mã hóa tin nhắn bằng AES
            const { encryptedMessage, iv, authTag } = EncryptionService.encryptMessage(message, aesKey);
            
            // Mã hóa khóa AES bằng public key của cả sender và receiver
            const senderEncryptedKey = EncryptionService.encryptAESKey(aesKey, sender.publicKey);
            const receiverEncryptedKey = EncryptionService.encryptAESKey(aesKey, receiver.publicKey);
            
            // Tạo hash của tin nhắn gốc
            const messageHash = EncryptionService.hashMessage(message);
            
            // Tạo session ID
            const sessionId = EncryptionService.generateSessionId(senderId, receiverId);
            
            // Tạo tin nhắn mới
            const newMessage = new Message({
                senderId,
                receiverId,
                sessionId,
                encryptedContent: encryptedMessage,
                iv,
                authTag,
                senderEncryptedKey,
                receiverEncryptedKey,
                messageHash,
                messageType,
                replyTo
            });
            
            await newMessage.save();
            
            // Populate thông tin user để trả về
            await newMessage.populate('senderId', 'firstName lastName username avatar');
            await newMessage.populate('receiverId', 'firstName lastName username avatar');
            
            if (replyTo) {
                await newMessage.populate('replyTo', 'encryptedContent messageType sentAt');
            }
            
            return this.sendSuccess(res, newMessage, 'Gửi tin nhắn thành công');
            
        } catch (error) {
            console.error('Error sending message:', error);
            return this.sendError(res, 'Không thể gửi tin nhắn', 500);
        }
    }
    
    /**
     * Lấy danh sách tin nhắn trong một cuộc trò chuyện
     */
    async getConversationMessages(req, res) {
        try {
            const userId = req.user.id;
            const { sessionId } = req.params;
            const { limit = 50, skip = 0 } = req.query;
            
            // Verify user có quyền truy cập session này không
            const sampleMessage = await Message.findOne({ sessionId }).select('senderId receiverId');
            if (!sampleMessage) {
                return this.sendError(res, 'Không tìm thấy cuộc trò chuyện', 404);
            }
            
            const userIdStr = userId.toString();
            if (sampleMessage.senderId.toString() !== userIdStr && 
                sampleMessage.receiverId.toString() !== userIdStr) {
                return this.sendError(res, 'Không có quyền truy cập cuộc trò chuyện này', 403);
            }
            
            // Lấy tin nhắn
            const messages = await Message.getConversationMessages(sessionId, parseInt(limit), parseInt(skip));
            
            // Đánh dấu tin nhắn đã đọc
            await Message.markAsRead(sessionId, userId);
            
            return this.sendSuccess(res, messages);
            
        } catch (error) {
            console.error('Error getting conversation messages:', error);
            return this.sendError(res, 'Không thể lấy tin nhắn', 500);
        }
    }
    
    /**
     * Giải mã tin nhắn (client-side sẽ gọi để lấy thông tin cần thiết)
     */
    async getDecryptionInfo(req, res) {
        try {
            const userId = req.user.id;
            const { messageId } = req.params;
            
            const message = await Message.findById(messageId);
            if (!message) {
                return this.sendError(res, 'Không tìm thấy tin nhắn', 404);
            }
            
            // Kiểm tra quyền truy cập
            const userIdStr = userId.toString();
            if (message.senderId.toString() !== userIdStr && 
                message.receiverId.toString() !== userIdStr) {
                return this.sendError(res, 'Không có quyền truy cập tin nhắn này', 403);
            }
            
            // Trả về thông tin cần thiết để giải mã
            const encryptedKey = message.senderId.toString() === userIdStr ? 
                message.senderEncryptedKey : message.receiverEncryptedKey;
            
            return this.sendSuccess(res, {
                encryptedContent: message.encryptedContent,
                iv: message.iv,
                authTag: message.authTag,
                encryptedKey: encryptedKey,
                messageHash: message.messageHash
            });
            
        } catch (error) {
            console.error('Error getting decryption info:', error);
            return this.sendError(res, 'Không thể lấy thông tin giải mã', 500);
        }
    }
    
    /**
     * Lấy danh sách cuộc trò chuyện gần đây
     */
    async getRecentConversations(req, res) {
        try {
            const userId = req.user.id;
            const { limit = 20 } = req.query;
            
            const conversations = await Message.getRecentConversations(userId, parseInt(limit));
            
            return this.sendSuccess(res, conversations);
            
        } catch (error) {
            console.error('Error getting recent conversations:', error);
            return this.sendError(res, 'Không thể lấy danh sách cuộc trò chuyện', 500);
        }
    }
    
    /**
     * Đếm tin nhắn chưa đọc
     */
    async getUnreadCount(req, res) {
        try {
            const userId = req.user.id;
            
            const unreadCount = await Message.countUnreadMessages(userId);
            
            return this.sendSuccess(res, { unreadCount });
            
        } catch (error) {
            console.error('Error getting unread count:', error);
            return this.sendError(res, 'Không thể đếm tin nhắn chưa đọc', 500);
        }
    }
    
    /**
     * Xóa tin nhắn
     */
    async deleteMessage(req, res) {
        try {
            const userId = req.user.id;
            const { messageId } = req.params;
            
            const message = await Message.findById(messageId);
            if (!message) {
                return this.sendError(res, 'Không tìm thấy tin nhắn', 404);
            }
            
            // Chỉ cho phép sender xóa tin nhắn của mình
            if (message.senderId.toString() !== userId.toString()) {
                return this.sendError(res, 'Không có quyền xóa tin nhắn này', 403);
            }
            
            await message.softDelete();
            
            return this.sendSuccess(res, null, 'Xóa tin nhắn thành công');
            
        } catch (error) {
            console.error('Error deleting message:', error);
            return this.sendError(res, 'Không thể xóa tin nhắn', 500);
        }
    }
    
    /**
     * Tạo session ID từ hai user ID
     */
    async createSession(req, res) {
        try {
            const userId1 = req.user.id;
            const { userId2 } = req.body;
            
            if (!userId2) {
                return this.sendError(res, 'Thiếu userId2', 400);
            }
            
            // Kiểm tra user2 tồn tại
            const user2 = await User.findById(userId2).select('firstName lastName username avatar publicKey');
            if (!user2) {
                return this.sendError(res, 'Không tìm thấy người dùng', 404);
            }
            
            const sessionId = EncryptionService.generateSessionId(userId1, userId2);
            
            return this.sendSuccess(res, {
                sessionId,
                otherUser: {
                    _id: user2._id,
                    firstName: user2.firstName,
                    lastName: user2.lastName,
                    username: user2.username,
                    avatar: user2.avatar,
                    hasPublicKey: !!user2.publicKey
                }
            });
            
        } catch (error) {
            console.error('Error creating session:', error);
            return this.sendError(res, 'Không thể tạo session', 500);
        }
    }

    /**
     * Enhanced methods for real-time chat and file uploads
     */

    /**
     * Send message with file attachments
     */
    async sendMessageWithFiles(req, res) {
        try {
            const { recipientId, content = '', messageType = 'file' } = req.body;
            const senderId = req.user.id;
            const files = req.files?.attachments || [];

            if (!recipientId) {
                return this.sendError(res, 'Recipient ID is required', 400);
            }

            if (files.length === 0) {
                return this.sendError(res, 'At least one file attachment is required', 400);
            }

            // Process uploaded files
            const attachments = [];
            for (const file of files) {
                try {
                    const fileInfo = await FileUploadService.processFileUpload(file, senderId, 'message_attachment');
                    
                    attachments.push({
                        type: file.mimetype.startsWith('image/') ? 'image' :
                              file.mimetype.startsWith('video/') ? 'video' :
                              file.mimetype.startsWith('audio/') ? 'audio' : 'document',
                        url: FileUploadService.getFileUrl(fileInfo.paths.processed || fileInfo.paths.original),
                        filename: fileInfo.originalName,
                        size: fileInfo.size,
                        mimeType: file.mimetype,
                        thumbnail: fileInfo.paths.thumbnail ? FileUploadService.getFileUrl(fileInfo.paths.thumbnail) : null
                    });
                } catch (fileError) {
                    console.error('File processing error:', fileError);
                    // Continue with other files
                }
            }

            // Create message with attachments
            const message = new Message({
                senderId,
                receiverId: recipientId,
                sender: senderId,
                recipient: recipientId,
                content: content || `Sent ${attachments.length} file(s)`,
                messageType,
                attachments,
                isRead: false,
                sentAt: new Date(),
                deliveredAt: new Date()
            });

            await message.save();
            await message.populate('sender', 'firstName lastName username avatar');

            return this.sendSuccess(res, message, 'Message with files sent successfully');

        } catch (error) {
            console.error('Send message with files error:', error);
            return this.sendError(res, 'Failed to send message with files', 500);
        }
    }

    /**
     * Send image message
     */
    async sendImageMessage(req, res) {
        try {
            const { recipientId, content = '' } = req.body;
            const senderId = req.user.id;
            const imageFile = req.file;

            if (!imageFile) {
                return this.sendError(res, 'Image file is required', 400);
            }

            // Process image
            const fileInfo = await FileUploadService.processFileUpload(imageFile, senderId, 'image_message');
            
            const attachment = {
                type: 'image',
                url: FileUploadService.getFileUrl(fileInfo.paths.processed || fileInfo.paths.original),
                filename: fileInfo.originalName,
                size: fileInfo.size,
                mimeType: imageFile.mimetype,
                thumbnail: fileInfo.paths.thumbnail ? FileUploadService.getFileUrl(fileInfo.paths.thumbnail) : null
            };

            const message = new Message({
                senderId,
                receiverId: recipientId,
                sender: senderId,
                recipient: recipientId,
                content: content || 'Sent an image',
                messageType: 'image',
                attachments: [attachment],
                isRead: false,
                sentAt: new Date(),
                deliveredAt: new Date()
            });

            await message.save();
            await message.populate('sender', 'firstName lastName username avatar');

            return this.sendSuccess(res, message, 'Image message sent successfully');

        } catch (error) {
            console.error('Send image message error:', error);
            return this.sendError(res, 'Failed to send image message', 500);
        }
    }

    /**
     * Get user conversations (enhanced)
     */
    async getUserConversations(req, res) {
        try {
            const userId = req.user.id;
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 20;

            const conversations = await Message.getUserConversations ? 
                await Message.getUserConversations(userId, { page, limit }) :
                await this.getRecentConversations(req, res);

            return this.sendSuccess(res, {
                conversations,
                pagination: {
                    page,
                    limit,
                    hasMore: conversations.length === limit
                }
            });

        } catch (error) {
            console.error('Get conversations error:', error);
            return this.sendError(res, 'Failed to get conversations', 500);
        }
    }

    /**
     * Mark messages as read
     */
    async markAsRead(req, res) {
        try {
            const userId = req.user.id;
            const { userId: otherUserId } = req.params;

            const result = await Message.markAsRead ? 
                await Message.markAsRead(userId, otherUserId) :
                { modifiedCount: 0 };

            return this.sendSuccess(res, { 
                messagesRead: result.modifiedCount 
            }, 'Messages marked as read');

        } catch (error) {
            console.error('Mark as read error:', error);
            return this.sendError(res, 'Failed to mark messages as read', 500);
        }
    }

    /**
     * Search messages
     */
    async searchMessages(req, res) {
        try {
            const userId = req.user.id;
            const { query } = req.query;
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 20;

            if (!query) {
                return this.sendError(res, 'Search query is required', 400);
            }

            const messages = await Message.searchMessages ? 
                await Message.searchMessages(userId, query, { page, limit }) :
                [];

            return this.sendSuccess(res, {
                messages,
                pagination: {
                    page,
                    limit,
                    hasMore: messages.length === limit
                }
            });

        } catch (error) {
            console.error('Search messages error:', error);
            return this.sendError(res, 'Failed to search messages', 500);
        }
    }
}

module.exports = new MessageController();
