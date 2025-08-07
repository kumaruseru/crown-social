const mongoose = require('mongoose');

/**
 * Enhanced Post Schema - Complete social media post model
 */
const PostSchema = new mongoose.Schema({
    // Tác giả bài đăng
    author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    
    // Nội dung bài đăng
    content: {
        type: String,
        required: [true, 'Nội dung bài đăng không được để trống'],
        maxlength: [5000, 'Nội dung không được vượt quá 5000 ký tự'],
        trim: true
    },
    
    // Loại bài đăng
    type: {
        type: String,
        enum: {
            values: ['text', 'image', 'video', 'link', 'poll'],
            message: 'Type must be: text, image, video, link, or poll'
        },
        default: 'text',
        required: true
    },
    
    // Media attachments
    media: [{
        type: {
            type: String,
            enum: ['image', 'video', 'document'],
            required: true
        },
        url: {
            type: String,
            required: true
        },
        thumbnail: String,
        filename: String,
        size: Number,
        mimeType: String
    }],
    
    // Tags và mentions
    tags: [{
        type: String,
        lowercase: true,
        trim: true
    }],
    
    mentions: [{
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        username: {
            type: String,
            required: true
        }
    }],
    
    // Privacy settings
    visibility: {
        type: String,
        enum: {
            values: ['public', 'friends', 'close_friends', 'private'],
            message: 'Visibility must be: public, friends, close_friends, or private'
        },
        default: 'friends',
        required: true
    },
    
    // Engagement metrics
    likesCount: {
        type: Number,
        default: 0,
        min: 0
    },
    
    commentsCount: {
        type: Number,
        default: 0,
        min: 0
    },
    
    sharesCount: {
        type: Number,
        default: 0,
        min: 0
    },
    
    viewsCount: {
        type: Number,
        default: 0,
        min: 0
    },
    
    // Likes với reaction types
    likes: [{
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        type: {
            type: String,
            enum: ['like', 'love', 'laugh', 'angry', 'sad', 'wow'],
            default: 'like'
        },
        createdAt: {
            type: Date,
            default: Date.now
        }
    }],
    
    // Status flags
    isActive: {
        type: Boolean,
        default: true
    },
    
    isPinned: {
        type: Boolean,
        default: false
    },
    
    isPromoted: {
        type: Boolean,
        default: false
    },
    
    // Location
    location: {
        type: {
            type: String,
            enum: ['Point']
        },
        coordinates: {
            type: [Number], // [longitude, latitude]
            index: '2dsphere'
        },
        name: String,
        address: String
    }
    
}, {
    timestamps: true,
    versionKey: false
});

// Indexes for performance
PostSchema.index({ author: 1, createdAt: -1 });
PostSchema.index({ createdAt: -1 });
PostSchema.index({ tags: 1 });
PostSchema.index({ visibility: 1, isActive: 1, createdAt: -1 });
PostSchema.index({ 'mentions.user': 1 });

// Virtual for engagement score
PostSchema.virtual('engagementScore').get(function() {
    return (this.likesCount * 1) + (this.commentsCount * 2) + (this.sharesCount * 3);
});

// Static methods
PostSchema.statics = {
    /**
     * Get feed posts for a user
     */
    async getFeedPosts(userId, options = {}) {
        const { page = 1, limit = 10 } = options;
        const skip = (page - 1) * limit;
        
        try {
            // Get user's friends for feed
            const Friend = mongoose.model('Friend');
            const friends = await Friend.getFriendsList(userId, { limit: 1000 });
            const friendIds = friends.map(f => f.friendInfo._id);
            friendIds.push(new mongoose.Types.ObjectId(userId)); // Include own posts
            
            return await this.find({
                author: { $in: friendIds },
                isActive: true
            })
            .populate('author', 'firstName lastName username avatar isOnline')
            .populate('mentions.user', 'firstName lastName username')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean();
        } catch (error) {
            console.error('Error getting feed posts:', error);
            // Fallback to public posts if friend system fails
            return await this.find({
                visibility: 'public',
                isActive: true
            })
            .populate('author', 'firstName lastName username avatar isOnline')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean();
        }
    },
    
    /**
     * Get trending posts
     */
    async getTrendingPosts(timeframe = '24h') {
        const hoursAgo = timeframe === '24h' ? 24 : timeframe === '7d' ? 168 : 720; // 30d
        const since = new Date(Date.now() - (hoursAgo * 60 * 60 * 1000));
        
        return await this.aggregate([
            {
                $match: {
                    createdAt: { $gte: since },
                    isActive: true,
                    visibility: { $in: ['public', 'friends'] }
                }
            },
            {
                $addFields: {
                    trendingScore: {
                        $add: [
                            { $multiply: ['$likesCount', 1] },
                            { $multiply: ['$commentsCount', 2] },
                            { $multiply: ['$sharesCount', 3] },
                            { $multiply: ['$viewsCount', 0.1] }
                        ]
                    }
                }
            },
            { $sort: { trendingScore: -1 } },
            { $limit: 20 },
            {
                $lookup: {
                    from: 'users',
                    localField: 'author',
                    foreignField: '_id',
                    as: 'author'
                }
            },
            { $unwind: '$author' }
        ]);
    },
    
    /**
     * Get user's posts
     */
    async getUserPosts(userId, viewerId = null, options = {}) {
        const { page = 1, limit = 10 } = options;
        const skip = (page - 1) * limit;
        
        const query = {
            author: userId,
            isActive: true
        };
        
        // If viewing someone else's profile, respect privacy
        if (viewerId && !userId.equals(viewerId)) {
            query.visibility = { $in: ['public', 'friends'] };
        }
        
        return await this.find(query)
            .populate('author', 'firstName lastName username avatar')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);
    }
};

// Instance methods
PostSchema.methods = {
    /**
     * Add or remove like
     */
    async toggleLike(userId, reactionType = 'like') {
        const existingLike = this.likes.find(like => like.user.equals(userId));
        
        if (existingLike) {
            if (existingLike.type === reactionType) {
                // Remove like
                this.likes = this.likes.filter(like => !like.user.equals(userId));
                this.likesCount = Math.max(0, this.likesCount - 1);
            } else {
                // Change reaction type
                existingLike.type = reactionType;
            }
        } else {
            // Add new like
            this.likes.push({ 
                user: userId, 
                type: reactionType, 
                createdAt: new Date() 
            });
            this.likesCount = this.likesCount + 1;
        }
        
        return await this.save();
    },
    
    /**
     * Increment view count
     */
    async addView() {
        this.viewsCount = this.viewsCount + 1;
        return await this.save();
    },
    
    /**
     * Check if user can view this post
     */
    canUserView(userId, userFriends = []) {
        if (!this.isActive) return false;
        
        switch (this.visibility) {
            case 'public':
                return true;
            case 'private':
                return this.author.equals(userId);
            case 'friends':
                return this.author.equals(userId) || 
                       userFriends.some(friend => friend.equals(this.author));
            case 'close_friends':
                return this.author.equals(userId);
            default:
                return false;
        }
    },
    
    /**
     * Get like summary
     */
    getLikeSummary() {
        const reactions = {};
        this.likes.forEach(like => {
            reactions[like.type] = (reactions[like.type] || 0) + 1;
        });
        return reactions;
    }
};

// Post-save middleware to update user's post count
PostSchema.post('save', async function(doc) {
    if (doc.isNew && doc.isActive) {
        await mongoose.model('User').findByIdAndUpdate(
            doc.author,
            { $inc: { postsCount: 1 } }
        );
    }
});

module.exports = mongoose.model('Post', PostSchema);
