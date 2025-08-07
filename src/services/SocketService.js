/**
 * Socket Service - Real-time WebSocket Communication
 * Handles real-time messaging, notifications, and online status
 */

const socketIo = require('socket.io');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Message = require('../models/Message');

class SocketService {
    constructor(server) {
        this.io = socketIo(server, {
            cors: {
                origin: "*",
                methods: ["GET", "POST"],
                credentials: true
            },
            pingTimeout: 60000,
            pingInterval: 25000
        });
        
        this.onlineUsers = new Map(); // userId -> socketId
        this.userSockets = new Map(); // socketId -> userId
        
        this.initialize();
        console.log('✅ Socket Service initialized');
    }

    /**
     * Initialize Socket.io event handlers
     */
    initialize() {
        this.io.use(this.authenticateSocket.bind(this));
        this.io.on('connection', this.handleConnection.bind(this));
    }

    /**
     * Authenticate socket connection using JWT
     */
    async authenticateSocket(socket, next) {
        try {
            const token = socket.handshake.auth.token || socket.handshake.headers.token;
            
            if (!token) {
                return next(new Error('Authentication error: No token provided'));
            }

            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'crown-social-secret');
            const user = await User.findById(decoded.id).select('_id firstName lastName username avatar isOnline');
            
            if (!user) {
                return next(new Error('Authentication error: User not found'));
            }

            socket.userId = user._id.toString();
            socket.user = user;
            next();
        } catch (error) {
            next(new Error('Authentication error: Invalid token'));
        }
    }

    /**
     * Handle new socket connection
     */
    async handleConnection(socket) {
        const userId = socket.userId;
        const user = socket.user;
        
        console.log(`👤 User ${user.username} connected (${socket.id})`);

        // Store user connection
        this.onlineUsers.set(userId, socket.id);
        this.userSockets.set(socket.id, userId);

        // Update user online status
        await User.findByIdAndUpdate(userId, {
            isOnline: true,
            lastSeen: new Date()
        });

        // Join user to their personal room
        socket.join(userId);

        // Notify friends about online status
        await this.notifyFriendsOnlineStatus(userId, true);

        // Handle real-time events
        this.handleChatEvents(socket);
        this.handleCallEvents(socket);
        this.handleTypingEvents(socket);
        this.handleNotificationEvents(socket);

        // Handle disconnection
        socket.on('disconnect', () => this.handleDisconnection(socket));
    }

    /**
     * Handle chat-related socket events
     */
    handleChatEvents(socket) {
        const userId = socket.userId;

        // Join chat room
        socket.on('join-chat', async (data) => {
            const { chatId } = data;
            socket.join(chatId);
            console.log(`👤 User ${userId} joined chat ${chatId}`);
        });

        // Leave chat room
        socket.on('leave-chat', (data) => {
            const { chatId } = data;
            socket.leave(chatId);
            console.log(`👤 User ${userId} left chat ${chatId}`);
        });

        // Send message
        socket.on('send-message', async (data) => {
            try {
                const { receiverId, content, chatId, messageType = 'text' } = data;

                // Create message in database
                const message = new Message({
                    sender: userId,
                    receiver: receiverId,
                    content,
                    messageType,
                    chatId,
                    isRead: false
                });

                await message.save();
                await message.populate('sender', 'firstName lastName username avatar');

                // Send to receiver if online
                const receiverSocketId = this.onlineUsers.get(receiverId);
                if (receiverSocketId) {
                    this.io.to(receiverSocketId).emit('new-message', {
                        message,
                        chatId
                    });
                }

                // Send confirmation to sender
                socket.emit('message-sent', {
                    messageId: message._id,
                    chatId,
                    timestamp: message.createdAt
                });

                console.log(`💬 Message sent from ${userId} to ${receiverId}`);

            } catch (error) {
                console.error('Error sending message:', error);
                socket.emit('message-error', {
                    error: 'Failed to send message',
                    details: error.message
                });
            }
        });

        // Mark message as read
        socket.on('mark-message-read', async (data) => {
            try {
                const { messageId } = data;
                await Message.findByIdAndUpdate(messageId, { 
                    isRead: true,
                    readAt: new Date()
                });

                // Notify sender that message was read
                const message = await Message.findById(messageId);
                if (message) {
                    const senderSocketId = this.onlineUsers.get(message.sender.toString());
                    if (senderSocketId) {
                        this.io.to(senderSocketId).emit('message-read', {
                            messageId,
                            readBy: userId
                        });
                    }
                }

            } catch (error) {
                console.error('Error marking message as read:', error);
            }
        });
    }

    /**
     * Handle typing indicators
     */
    handleTypingEvents(socket) {
        const userId = socket.userId;

        socket.on('typing-start', (data) => {
            const { chatId, receiverId } = data;
            const receiverSocketId = this.onlineUsers.get(receiverId);
            
            if (receiverSocketId) {
                this.io.to(receiverSocketId).emit('user-typing', {
                    userId,
                    chatId,
                    user: socket.user
                });
            }
        });

        socket.on('typing-stop', (data) => {
            const { chatId, receiverId } = data;
            const receiverSocketId = this.onlineUsers.get(receiverId);
            
            if (receiverSocketId) {
                this.io.to(receiverSocketId).emit('user-stopped-typing', {
                    userId,
                    chatId
                });
            }
        });
    }

    /**
     * Handle call-related events
     */
    handleCallEvents(socket) {
        const userId = socket.userId;

        // Initiate call
        socket.on('initiate-call', async (data) => {
            const { receiverId, callType = 'voice' } = data;
            const receiverSocketId = this.onlineUsers.get(receiverId);

            if (receiverSocketId) {
                this.io.to(receiverSocketId).emit('incoming-call', {
                    callerId: userId,
                    caller: socket.user,
                    callType,
                    timestamp: new Date()
                });

                socket.emit('call-initiated', {
                    receiverId,
                    callType
                });

                console.log(`📞 ${callType} call initiated from ${userId} to ${receiverId}`);
            } else {
                socket.emit('call-failed', {
                    error: 'User is offline',
                    receiverId
                });
            }
        });

        // Accept call
        socket.on('accept-call', (data) => {
            const { callerId } = data;
            const callerSocketId = this.onlineUsers.get(callerId);

            if (callerSocketId) {
                this.io.to(callerSocketId).emit('call-accepted', {
                    acceptedBy: userId,
                    user: socket.user
                });
            }
        });

        // Reject call
        socket.on('reject-call', (data) => {
            const { callerId, reason = 'declined' } = data;
            const callerSocketId = this.onlineUsers.get(callerId);

            if (callerSocketId) {
                this.io.to(callerSocketId).emit('call-rejected', {
                    rejectedBy: userId,
                    reason
                });
            }
        });

        // End call
        socket.on('end-call', (data) => {
            const { participantId } = data;
            const participantSocketId = this.onlineUsers.get(participantId);

            if (participantSocketId) {
                this.io.to(participantSocketId).emit('call-ended', {
                    endedBy: userId
                });
            }
        });
    }

    /**
     * Handle notification events
     */
    handleNotificationEvents(socket) {
        const userId = socket.userId;

        socket.on('subscribe-notifications', () => {
            socket.join(`notifications-${userId}`);
            console.log(`🔔 User ${userId} subscribed to notifications`);
        });

        socket.on('unsubscribe-notifications', () => {
            socket.leave(`notifications-${userId}`);
            console.log(`🔕 User ${userId} unsubscribed from notifications`);
        });
    }

    /**
     * Handle socket disconnection
     */
    async handleDisconnection(socket) {
        const userId = socket.userId;
        const user = socket.user;

        console.log(`👤 User ${user?.username} disconnected (${socket.id})`);

        // Remove from online users
        this.onlineUsers.delete(userId);
        this.userSockets.delete(socket.id);

        // Update user offline status
        await User.findByIdAndUpdate(userId, {
            isOnline: false,
            lastSeen: new Date()
        });

        // Notify friends about offline status
        await this.notifyFriendsOnlineStatus(userId, false);
    }

    /**
     * Notify friends about online/offline status
     */
    async notifyFriendsOnlineStatus(userId, isOnline) {
        try {
            const User = require('../models/User');
            const Friend = require('../models/Friend');

            // Get user's friends
            const friendIds = await Friend.getFriendIds(userId);

            // Notify each online friend
            friendIds.forEach(friendId => {
                const friendSocketId = this.onlineUsers.get(friendId.toString());
                if (friendSocketId) {
                    this.io.to(friendSocketId).emit('friend-status-change', {
                        friendId: userId,
                        isOnline,
                        timestamp: new Date()
                    });
                }
            });

        } catch (error) {
            console.error('Error notifying friends about status change:', error);
        }
    }

    /**
     * Send notification to user
     */
    sendNotification(userId, notification) {
        const userSocketId = this.onlineUsers.get(userId.toString());
        if (userSocketId) {
            this.io.to(userSocketId).emit('notification', notification);
        }

        // Also send to notification room
        this.io.to(`notifications-${userId}`).emit('notification', notification);
    }

    /**
     * Send notification to multiple users
     */
    sendNotificationToUsers(userIds, notification) {
        userIds.forEach(userId => {
            this.sendNotification(userId, notification);
        });
    }

    /**
     * Get online users count
     */
    getOnlineUsersCount() {
        return this.onlineUsers.size;
    }

    /**
     * Get online status of user
     */
    isUserOnline(userId) {
        return this.onlineUsers.has(userId.toString());
    }

    /**
     * Get all online users
     */
    getOnlineUsers() {
        return Array.from(this.onlineUsers.keys());
    }
}

module.exports = SocketService;
