/**
 * WebSocket Service - Real-time Communication
 * Implements Socket.io for real-time chat, notifications, and live updates
 */

const socketIo = require('socket.io');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Message = require('../models/Message');
const Friend = require('../models/Friend');

class WebSocketService {
    constructor(server) {
        this.io = socketIo(server, {
            cors: {
                origin: "*",
                methods: ["GET", "POST"]
            },
            transports: ['websocket', 'polling']
        });
        
        this.connectedUsers = new Map(); // userId -> socketId mapping
        this.userSockets = new Map(); // socketId -> user info mapping
        
        this.initializeEventHandlers();
        console.log('🔌 WebSocket Service initialized');
    }

    /**
     * Initialize Socket.io event handlers
     */
    initializeEventHandlers() {
        this.io.use(this.authenticateSocket.bind(this));
        
        this.io.on('connection', (socket) => {
            this.handleConnection(socket);
            
            // Chat events
            socket.on('join_chat', (data) => this.handleJoinChat(socket, data));
            socket.on('send_message', (data) => this.handleSendMessage(socket, data));
            socket.on('typing_start', (data) => this.handleTypingStart(socket, data));
            socket.on('typing_stop', (data) => this.handleTypingStop(socket, data));
            socket.on('message_read', (data) => this.handleMessageRead(socket, data));
            
            // Friend events
            socket.on('friend_request', (data) => this.handleFriendRequest(socket, data));
            socket.on('friend_accept', (data) => this.handleFriendAccept(socket, data));
            
            // Post events
            socket.on('post_like', (data) => this.handlePostLike(socket, data));
            socket.on('post_comment', (data) => this.handlePostComment(socket, data));
            
            // General events
            socket.on('user_online', () => this.handleUserOnline(socket));
            socket.on('user_offline', () => this.handleUserOffline(socket));
            socket.on('disconnect', () => this.handleDisconnection(socket));
        });
    }

    /**
     * Authenticate socket connection
     */
    async authenticateSocket(socket, next) {
        try {
            const token = socket.handshake.auth.token || socket.handshake.headers.authorization;
            
            if (!token) {
                return next(new Error('Authentication error: No token provided'));
            }

            const decoded = jwt.verify(token.replace('Bearer ', ''), process.env.JWT_SECRET);
            const user = await User.findById(decoded.userId).select('firstName lastName username avatar isOnline');
            
            if (!user) {
                return next(new Error('Authentication error: User not found'));
            }

            socket.userId = user._id.toString();
            socket.userInfo = user;
            next();
        } catch (error) {
            console.error('Socket authentication error:', error);
            next(new Error('Authentication error: Invalid token'));
        }
    }

    /**
     * Handle new connection
     */
    async handleConnection(socket) {
        const userId = socket.userId;
        const userInfo = socket.userInfo;
        
        console.log(`👤 User connected: ${userInfo.username} (${userId})`);
        
        // Track user connection
        this.connectedUsers.set(userId, socket.id);
        this.userSockets.set(socket.id, { userId, userInfo });
        
        // Update user online status
        await User.findByIdAndUpdate(userId, {
            isOnline: true,
            lastSeen: new Date()
        });
        
        // Join user's personal room
        socket.join(`user_${userId}`);
        
        // Notify friends about online status
        await this.notifyFriendsOnlineStatus(userId, true);
        
        // Send initial data
        socket.emit('connection_established', {
            success: true,
            user: userInfo,
            timestamp: new Date()
        });
    }

    /**
     * Handle user disconnection
     */
    async handleDisconnection(socket) {
        const userId = socket.userId;
        const userInfo = socket.userInfo;
        
        if (userId && userInfo) {
            console.log(`👤 User disconnected: ${userInfo.username} (${userId})`);
            
            // Remove from tracking
            this.connectedUsers.delete(userId);
            this.userSockets.delete(socket.id);
            
            // Update user offline status
            await User.findByIdAndUpdate(userId, {
                isOnline: false,
                lastSeen: new Date()
            });
            
            // Notify friends about offline status
            await this.notifyFriendsOnlineStatus(userId, false);
        }
    }

    /**
     * Handle join chat room
     */
    handleJoinChat(socket, data) {
        const { chatId, recipientId } = data;
        const userId = socket.userId;
        
        // Create or join chat room
        const roomName = this.getChatRoomName(userId, recipientId);
        socket.join(roomName);
        
        console.log(`💬 User ${socket.userInfo.username} joined chat: ${roomName}`);
        
        socket.emit('chat_joined', {
            success: true,
            chatId: roomName,
            timestamp: new Date()
        });
    }

    /**
     * Handle send message
     */
    async handleSendMessage(socket, data) {
        try {
            const { recipientId, content, messageType = 'text', attachments = [] } = data;
            const senderId = socket.userId;
            const senderInfo = socket.userInfo;
            
            // Validate recipient
            const recipient = await User.findById(recipientId);
            if (!recipient) {
                return socket.emit('message_error', { error: 'Recipient not found' });
            }
            
            // Check if users are friends
            const areFriends = await Friend.areFriends(senderId, recipientId);
            if (!areFriends) {
                return socket.emit('message_error', { error: 'You can only message friends' });
            }
            
            // Create message
            const message = new Message({
                sender: senderId,
                recipient: recipientId,
                content,
                messageType,
                attachments,
                isRead: false,
                deliveredAt: new Date()
            });
            
            await message.save();
            await message.populate('sender', 'firstName lastName username avatar');
            
            // Get chat room name
            const roomName = this.getChatRoomName(senderId, recipientId);
            
            // Emit to chat room
            this.io.to(roomName).emit('new_message', {
                message: {
                    _id: message._id,
                    sender: {
                        _id: senderId,
                        firstName: senderInfo.firstName,
                        lastName: senderInfo.lastName,
                        username: senderInfo.username,
                        avatar: senderInfo.avatar
                    },
                    recipient: recipientId,
                    content,
                    messageType,
                    attachments,
                    isRead: false,
                    createdAt: message.createdAt,
                    deliveredAt: message.deliveredAt
                },
                timestamp: new Date()
            });
            
            // Send push notification if recipient is offline
            const recipientSocketId = this.connectedUsers.get(recipientId);
            if (!recipientSocketId) {
                await this.sendPushNotification(recipientId, {
                    title: `${senderInfo.firstName} ${senderInfo.lastName}`,
                    body: messageType === 'text' ? content : `Sent ${messageType}`,
                    type: 'new_message',
                    senderId
                });
            }
            
            console.log(`💬 Message sent from ${senderInfo.username} to ${recipient.username}`);
            
        } catch (error) {
            console.error('Send message error:', error);
            socket.emit('message_error', { error: 'Failed to send message' });
        }
    }

    /**
     * Handle typing indicators
     */
    handleTypingStart(socket, data) {
        const { recipientId } = data;
        const userId = socket.userId;
        const userInfo = socket.userInfo;
        
        const roomName = this.getChatRoomName(userId, recipientId);
        socket.to(roomName).emit('user_typing', {
            userId,
            username: userInfo.username,
            isTyping: true
        });
    }

    handleTypingStop(socket, data) {
        const { recipientId } = data;
        const userId = socket.userId;
        const userInfo = socket.userInfo;
        
        const roomName = this.getChatRoomName(userId, recipientId);
        socket.to(roomName).emit('user_typing', {
            userId,
            username: userInfo.username,
            isTyping: false
        });
    }

    /**
     * Handle message read status
     */
    async handleMessageRead(socket, data) {
        try {
            const { messageId } = data;
            const userId = socket.userId;
            
            await Message.findByIdAndUpdate(messageId, {
                isRead: true,
                readAt: new Date()
            });
            
            // Notify sender about read status
            const message = await Message.findById(messageId);
            if (message) {
                const senderSocketId = this.connectedUsers.get(message.sender.toString());
                if (senderSocketId) {
                    this.io.to(senderSocketId).emit('message_read', {
                        messageId,
                        readBy: userId,
                        readAt: new Date()
                    });
                }
            }
            
        } catch (error) {
            console.error('Message read error:', error);
        }
    }

    /**
     * Handle friend request notifications
     */
    async handleFriendRequest(socket, data) {
        const { recipientId } = data;
        const senderId = socket.userId;
        const senderInfo = socket.userInfo;
        
        // Notify recipient
        this.io.to(`user_${recipientId}`).emit('friend_request_received', {
            sender: {
                _id: senderId,
                firstName: senderInfo.firstName,
                lastName: senderInfo.lastName,
                username: senderInfo.username,
                avatar: senderInfo.avatar
            },
            timestamp: new Date()
        });
    }

    /**
     * Handle friend accept notifications
     */
    async handleFriendAccept(socket, data) {
        const { requesterId } = data;
        const accepterId = socket.userId;
        const accepterInfo = socket.userInfo;
        
        // Notify requester
        this.io.to(`user_${requesterId}`).emit('friend_request_accepted', {
            accepter: {
                _id: accepterId,
                firstName: accepterInfo.firstName,
                lastName: accepterInfo.lastName,
                username: accepterInfo.username,
                avatar: accepterInfo.avatar
            },
            timestamp: new Date()
        });
    }

    /**
     * Handle post interactions
     */
    async handlePostLike(socket, data) {
        const { postId, authorId } = data;
        const userId = socket.userId;
        const userInfo = socket.userInfo;
        
        // Notify post author
        if (userId !== authorId) {
            this.io.to(`user_${authorId}`).emit('post_liked', {
                postId,
                liker: {
                    _id: userId,
                    firstName: userInfo.firstName,
                    lastName: userInfo.lastName,
                    username: userInfo.username,
                    avatar: userInfo.avatar
                },
                timestamp: new Date()
            });
        }
    }

    async handlePostComment(socket, data) {
        const { postId, authorId, comment } = data;
        const userId = socket.userId;
        const userInfo = socket.userInfo;
        
        // Notify post author
        if (userId !== authorId) {
            this.io.to(`user_${authorId}`).emit('post_commented', {
                postId,
                comment,
                commenter: {
                    _id: userId,
                    firstName: userInfo.firstName,
                    lastName: userInfo.lastName,
                    username: userInfo.username,
                    avatar: userInfo.avatar
                },
                timestamp: new Date()
            });
        }
    }

    /**
     * Utility methods
     */
    getChatRoomName(userId1, userId2) {
        const sortedIds = [userId1, userId2].sort();
        return `chat_${sortedIds[0]}_${sortedIds[1]}`;
    }

    async notifyFriendsOnlineStatus(userId, isOnline) {
        try {
            const friendIds = await Friend.getFriendIds(userId);
            
            friendIds.forEach(friendId => {
                this.io.to(`user_${friendId}`).emit('friend_status_changed', {
                    userId,
                    isOnline,
                    timestamp: new Date()
                });
            });
        } catch (error) {
            console.error('Error notifying friends online status:', error);
        }
    }

    async sendPushNotification(userId, notification) {
        // Integration with push notification service
        console.log(`📱 Push notification for user ${userId}:`, notification);
        // TODO: Implement actual push notification service
    }

    /**
     * Public methods for external use
     */
    emitToUser(userId, event, data) {
        const socketId = this.connectedUsers.get(userId);
        if (socketId) {
            this.io.to(socketId).emit(event, data);
            return true;
        }
        return false;
    }

    emitToRoom(room, event, data) {
        this.io.to(room).emit(event, data);
    }

    getOnlineUsers() {
        return Array.from(this.connectedUsers.keys());
    }

    isUserOnline(userId) {
        return this.connectedUsers.has(userId);
    }
}

module.exports = WebSocketService;
