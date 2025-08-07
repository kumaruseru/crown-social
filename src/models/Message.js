const mongoose = require('mongoose');
const { Schema } = mongoose;

/**
 * Message Schema - MongoDB Schema cho tin nhắn được mã hóa đầu cuối
 */
const MessageSchema = new Schema({
    // Thông tin người gửi và người nhận
    senderId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    receiverId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    
    // ID phiên trò chuyện (hash của senderId + receiverId)
    sessionId: {
        type: String,
        required: true,
        index: true
    },
    
    // Nội dung tin nhắn đã mã hóa
    encryptedContent: {
        type: String,
        required: true
    },
    
    // Vector khởi tạo cho AES-GCM
    iv: {
        type: String,
        required: true
    },
    
    // Authentication tag cho AES-GCM
    authTag: {
        type: String,
        required: true
    },
    
    // Khóa AES đã mã hóa cho người gửi (bằng khóa công khai của người gửi)
    senderEncryptedKey: {
        type: String,
        required: true
    },
    
    // Khóa AES đã mã hóa cho người nhận (bằng khóa công khai của người nhận)
    receiverEncryptedKey: {
        type: String,
        required: true
    },
    
    // Hash của tin nhắn gốc để kiểm tra tính toàn vẹn
    messageHash: {
        type: String,
        required: true
    },
    
    // Loại tin nhắn
    messageType: {
        type: String,
        enum: ['text', 'image', 'file', 'voice', 'video'],
        default: 'text'
    },
    
    // Metadata cho file đính kèm (nếu có)
    fileMetadata: {
        originalName: String,
        mimeType: String,
        size: Number,
        encryptedPath: String  // Đường dẫn file đã mã hóa
    },
    
    // Trạng thái tin nhắn
    status: {
        type: String,
        enum: ['sent', 'delivered', 'read'],
        default: 'sent',
        index: true
    },
    
    // Thời gian đã đọc
    readAt: {
        type: Date,
        default: null
    },
    
    // Thời gian gửi và cập nhật
    sentAt: {
        type: Date,
        default: Date.now,
        index: true
    },
    
    // Có phải tin nhắn đã bị xóa không
    isDeleted: {
        type: Boolean,
        default: false,
        index: true
    },
    
    // Thời gian xóa (nếu có)
    deletedAt: {
        type: Date,
        default: null
    },
    
    // Có phải tin nhắn quan trọng không
    isImportant: {
        type: Boolean,
        default: false
    },
    
    // Reply to message (nếu đây là tin nhắn trả lời)
    replyTo: {
        type: Schema.Types.ObjectId,
        ref: 'Message',
        default: null
    }
}, {
    timestamps: true,
    collection: 'messages'
});

// Indexes cho hiệu suất truy vấn
MessageSchema.index({ sessionId: 1, sentAt: -1 });
MessageSchema.index({ senderId: 1, receiverId: 1, sentAt: -1 });
MessageSchema.index({ receiverId: 1, status: 1 });
MessageSchema.index({ sentAt: -1 });

/**
 * Static method: Lấy tin nhắn trong một phiên trò chuyện
 */
MessageSchema.statics.getConversationMessages = function(sessionId, limit = 50, skip = 0) {
    return this.find({
        sessionId,
        isDeleted: false
    })
    .populate('senderId', 'firstName lastName username avatar')
    .populate('receiverId', 'firstName lastName username avatar')
    .populate('replyTo', 'encryptedContent messageType sentAt')
    .sort({ sentAt: -1 })
    .limit(limit)
    .skip(skip);
};

/**
 * Static method: Đánh dấu tin nhắn đã đọc
 */
MessageSchema.statics.markAsRead = function(sessionId, userId) {
    return this.updateMany({
        sessionId,
        receiverId: userId,
        status: { $ne: 'read' }
    }, {
        status: 'read',
        readAt: new Date()
    });
};

/**
 * Static method: Đếm tin nhắn chưa đọc
 */
MessageSchema.statics.countUnreadMessages = function(userId) {
    return this.countDocuments({
        receiverId: userId,
        status: { $ne: 'read' },
        isDeleted: false
    });
};

/**
 * Static method: Lấy danh sách cuộc trò chuyện gần đây
 */
MessageSchema.statics.getRecentConversations = function(userId, limit = 20) {
    return this.aggregate([
        {
            $match: {
                $or: [
                    { senderId: mongoose.Types.ObjectId(userId) },
                    { receiverId: mongoose.Types.ObjectId(userId) }
                ],
                isDeleted: false
            }
        },
        {
            $sort: { sentAt: -1 }
        },
        {
            $group: {
                _id: '$sessionId',
                lastMessage: { $first: '$$ROOT' },
                unreadCount: {
                    $sum: {
                        $cond: [
                            {
                                $and: [
                                    { $eq: ['$receiverId', mongoose.Types.ObjectId(userId)] },
                                    { $ne: ['$status', 'read'] }
                                ]
                            },
                            1,
                            0
                        ]
                    }
                }
            }
        },
        {
            $lookup: {
                from: 'users',
                localField: 'lastMessage.senderId',
                foreignField: '_id',
                as: 'sender'
            }
        },
        {
            $lookup: {
                from: 'users',
                localField: 'lastMessage.receiverId',
                foreignField: '_id',
                as: 'receiver'
            }
        },
        {
            $addFields: {
                otherUser: {
                    $cond: [
                        { $eq: ['$lastMessage.senderId', mongoose.Types.ObjectId(userId)] },
                        { $arrayElemAt: ['$receiver', 0] },
                        { $arrayElemAt: ['$sender', 0] }
                    ]
                }
            }
        },
        {
            $project: {
                sessionId: '$_id',
                lastMessage: 1,
                unreadCount: 1,
                otherUser: {
                    _id: 1,
                    firstName: 1,
                    lastName: 1,
                    username: 1,
                    avatar: 1,
                    isOnline: 1,
                    lastActivity: 1
                }
            }
        },
        {
            $sort: { 'lastMessage.sentAt': -1 }
        },
        {
            $limit: limit
        }
    ]);
};

/**
 * Instance method: Xóa mềm tin nhắn
 */
MessageSchema.methods.softDelete = function() {
    this.isDeleted = true;
    this.deletedAt = new Date();
    return this.save();
};

/**
 * Instance method: Khôi phục tin nhắn đã xóa
 */
MessageSchema.methods.restore = function() {
    this.isDeleted = false;
    this.deletedAt = null;
    return this.save();
};

/**
 * Middleware: Cập nhật thời gian modified khi có thay đổi
 */
MessageSchema.pre('save', function(next) {
    if (this.isModified() && !this.isNew) {
        this.updatedAt = new Date();
    }
    next();
});

const Message = mongoose.model('Message', MessageSchema);

module.exports = Message;
