const mongoose = require('mongoose');

/**
 * Friend Schema - Quản lý mối quan hệ bạn bè
 */
const FriendSchema = new mongoose.Schema({
    // User gửi lời mời kết bạn
    requester: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    
    // User nhận lời mời kết bạn  
    recipient: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    
    // Trạng thái mối quan hệ
    status: {
        type: String,
        enum: {
            values: ['pending', 'accepted', 'blocked', 'rejected'],
            message: 'Status must be: pending, accepted, blocked, or rejected'
        },
        default: 'pending',
        required: true,
        index: true
    },
    
    // Thời gian gửi lời mời
    requestedAt: {
        type: Date,
        default: Date.now
    },
    
    // Thời gian chấp nhận/từ chối
    respondedAt: {
        type: Date
    },
    
    // Thời gian trở thành bạn bè
    becameFriendsAt: {
        type: Date
    },
    
    // Metadata
    notes: {
        type: String,
        maxlength: [200, 'Notes cannot exceed 200 characters']
    },
    
    // Cài đặt riêng tư
    isCloseFriend: {
        type: Boolean,
        default: false
    },
    
    // Cho phép xem story
    canSeeStory: {
        type: Boolean,
        default: true
    },
    
    // Cho phép tag trong bài đăng
    canTag: {
        type: Boolean,
        default: true
    }
    
}, {
    timestamps: true,
    versionKey: false
});

// Compound indexes for efficient queries
FriendSchema.index({ requester: 1, recipient: 1 }, { unique: true });
FriendSchema.index({ recipient: 1, status: 1 });
FriendSchema.index({ requester: 1, status: 1 });
FriendSchema.index({ status: 1, createdAt: -1 });

// Virtual for friend relationship
FriendSchema.virtual('isAccepted').get(function() {
    return this.status === 'accepted';
});

// Static methods
FriendSchema.statics = {
    /**
     * Check if two users are friends
     */
    async areFriends(userId1, userId2) {
        const friendship = await this.findOne({
            $or: [
                { requester: userId1, recipient: userId2, status: 'accepted' },
                { requester: userId2, recipient: userId1, status: 'accepted' }
            ]
        });
        return !!friendship;
    },
    
    /**
     * Get friends list for a user
     */
    async getFriendsList(userId, options = {}) {
        const { page = 1, limit = 20, search = '' } = options;
        const skip = (page - 1) * limit;
        
        const pipeline = [
            {
                $match: {
                    $or: [
                        { requester: new mongoose.Types.ObjectId(userId), status: 'accepted' },
                        { recipient: new mongoose.Types.ObjectId(userId), status: 'accepted' }
                    ]
                }
            },
            {
                $lookup: {
                    from: 'users',
                    localField: 'requester',
                    foreignField: '_id',
                    as: 'requesterInfo'
                }
            },
            {
                $lookup: {
                    from: 'users',
                    localField: 'recipient',
                    foreignField: '_id',
                    as: 'recipientInfo'
                }
            },
            {
                $addFields: {
                    friendInfo: {
                        $cond: {
                            if: { $eq: ['$requester', new mongoose.Types.ObjectId(userId)] },
                            then: { $arrayElemAt: ['$recipientInfo', 0] },
                            else: { $arrayElemAt: ['$requesterInfo', 0] }
                        }
                    }
                }
            },
            {
                $match: search ? {
                    $or: [
                        { 'friendInfo.firstName': { $regex: search, $options: 'i' } },
                        { 'friendInfo.lastName': { $regex: search, $options: 'i' } },
                        { 'friendInfo.username': { $regex: search, $options: 'i' } }
                    ]
                } : {}
            },
            {
                $project: {
                    friendInfo: {
                        _id: 1,
                        firstName: 1,
                        lastName: 1,
                        username: 1,
                        avatar: 1,
                        isOnline: 1,
                        lastSeen: 1
                    },
                    isCloseFriend: 1,
                    becameFriendsAt: 1,
                    canSeeStory: 1,
                    canTag: 1
                }
            },
            { $sort: { becameFriendsAt: -1 } },
            { $skip: skip },
            { $limit: limit }
        ];
        
        return await this.aggregate(pipeline);
    },
    
    /**
     * Get pending friend requests for a user
     */
    async getPendingRequests(userId, type = 'received') {
        const query = type === 'received' 
            ? { recipient: userId, status: 'pending' }
            : { requester: userId, status: 'pending' };
            
        return await this.find(query)
            .populate(type === 'received' ? 'requester' : 'recipient', 
                'firstName lastName username avatar')
            .sort({ createdAt: -1 });
    },
    
    /**
     * Send friend request
     */
    async sendRequest(requesterId, recipientId) {
        // Check if request already exists
        const existingRequest = await this.findOne({
            $or: [
                { requester: requesterId, recipient: recipientId },
                { requester: recipientId, recipient: requesterId }
            ]
        });
        
        if (existingRequest) {
            if (existingRequest.status === 'accepted') {
                throw new Error('Users are already friends');
            }
            if (existingRequest.status === 'pending') {
                throw new Error('Friend request already sent');
            }
            if (existingRequest.status === 'blocked') {
                throw new Error('Cannot send friend request');
            }
        }
        
        // Create new friend request
        const friendRequest = new this({
            requester: requesterId,
            recipient: recipientId,
            status: 'pending',
            requestedAt: new Date()
        });
        
        return await friendRequest.save();
    },
    
    /**
     * Get friend suggestions based on mutual friends and location
     */
    async getFriendSuggestions(userId, options = {}) {
        const { limit = 10 } = options;
        
        try {
            // Get current friends and blocked users
            const existingRelations = await this.find({
                $or: [
                    { requester: userId },
                    { recipient: userId }
                ]
            }).select('requester recipient status');
            
            const excludeIds = new Set([userId.toString()]);
            existingRelations.forEach(rel => {
                excludeIds.add(rel.requester.toString());
                excludeIds.add(rel.recipient.toString());
            });
            
            // Find users not in existing relations
            const User = mongoose.model('User');
            const suggestions = await User.find({
                _id: { $nin: Array.from(excludeIds) },
                isActive: true
            })
            .select('firstName lastName username avatar location')
            .limit(limit)
            .lean();
            
            return suggestions;
        } catch (error) {
            console.error('Error getting friend suggestions:', error);
            return [];
        }
    },
    
    /**
     * Get friendship status between two users
     */
    async getFriendshipStatus(userId1, userId2) {
        try {
            const friendship = await this.findOne({
                $or: [
                    { requester: userId1, recipient: userId2 },
                    { requester: userId2, recipient: userId1 }
                ]
            });
            
            if (!friendship) {
                return 'none';
            }
            
            // Handle blocked status
            if (friendship.status === 'blocked') {
                return friendship.blockedBy && friendship.blockedBy.equals(userId1) ? 'blocked' : 'blocked_by';
            }
            
            return friendship.status;
        } catch (error) {
            console.error('Error getting friendship status:', error);
            return 'none';
        }
    },
    
    /**
     * Get friend IDs for a user (for quick lookups)
     */
    async getFriendIds(userId) {
        try {
            const friendships = await this.find({
                $or: [
                    { requester: userId, status: 'accepted' },
                    { recipient: userId, status: 'accepted' }
                ]
            }).lean();
            
            return friendships.map(friendship => {
                return friendship.requester.equals(userId) 
                    ? friendship.recipient 
                    : friendship.requester;
            });
        } catch (error) {
            console.error('Error getting friend IDs:', error);
            return [];
        }
    },
    
    /**
     * Get sent friend requests
     */
    async getSentRequests(userId, options = {}) {
        const { page = 1, limit = 10 } = options;
        const skip = (page - 1) * limit;
        
        return await this.find({
            requester: userId,
            status: 'pending'
        })
        .populate('recipient', 'firstName lastName username avatar')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);
    }
};

// Instance methods
FriendSchema.methods = {
    /**
     * Accept friend request
     */
    async accept() {
        if (this.status !== 'pending') {
            throw new Error('Only pending requests can be accepted');
        }
        
        this.status = 'accepted';
        this.respondedAt = new Date();
        this.becameFriendsAt = new Date();
        
        return await this.save();
    },
    
    /**
     * Reject friend request
     */
    async reject() {
        if (this.status !== 'pending') {
            throw new Error('Only pending requests can be rejected');
        }
        
        this.status = 'rejected';
        this.respondedAt = new Date();
        
        return await this.save();
    },
    
    /**
     * Block user
     */
    async block() {
        this.status = 'blocked';
        this.respondedAt = new Date();
        
        return await this.save();
    },
    
    /**
     * Remove friendship
     */
    async unfriend() {
        return await this.deleteOne();
    }
};

// Pre-save middleware
FriendSchema.pre('save', function(next) {
    // Prevent self-friendship
    if (this.requester.equals(this.recipient)) {
        return next(new Error('Users cannot be friends with themselves'));
    }
    next();
});

module.exports = mongoose.model('Friend', FriendSchema);
