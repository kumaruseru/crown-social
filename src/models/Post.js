const mongoose = require('mongoose');

/**
 * Post Schema - Mô hình bài đăng
 */
const postSchema = new mongoose.Schema({
    // Thông tin tác giả
    author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    
    // Nội dung bài đăng
    content: {
        type: String,
        required: true,
        maxlength: 2000
    },
    
    // Hình ảnh đính kèm (array để hỗ trợ nhiều ảnh)
    images: [{
        url: {
            type: String,
            required: true
        },
        alt: {
            type: String,
            default: ''
        }
    }],
    
    // Video đính kèm
    video: {
        url: String,
        thumbnail: String
    },
    
    // Thông tin tương tác
    likes: [{
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        createdAt: {
            type: Date,
            default: Date.now
        }
    }],
    
    // Comments
    comments: [{
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        content: {
            type: String,
            required: true,
            maxlength: 500
        },
        createdAt: {
            type: Date,
            default: Date.now
        }
    }],
    
    // Shares
    shares: [{
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        createdAt: {
            type: Date,
            default: Date.now
        }
    }],
    
    // Hashtags
    hashtags: [{
        type: String,
        lowercase: true
    }],
    
    // Mentions
    mentions: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    
    // Privacy settings
    privacy: {
        type: String,
        enum: ['public', 'friends', 'private'],
        default: 'public'
    },
    
    // Location
    location: {
        name: String,
        coordinates: {
            type: [Number], // [longitude, latitude]
            index: '2dsphere'
        }
    },
    
    // Post status
    status: {
        type: String,
        enum: ['active', 'hidden', 'deleted'],
        default: 'active'
    },
    
    // Thời gian
    createdAt: {
        type: Date,
        default: Date.now
    },
    
    updatedAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true,
    versionKey: false
});

// Indexes for performance
postSchema.index({ author: 1, createdAt: -1 });
postSchema.index({ createdAt: -1 });
postSchema.index({ hashtags: 1 });
postSchema.index({ 'location.coordinates': '2dsphere' });

// Virtual for like count
postSchema.virtual('likeCount').get(function() {
    return this.likes ? this.likes.length : 0;
});

// Virtual for comment count
postSchema.virtual('commentCount').get(function() {
    return this.comments ? this.comments.length : 0;
});

// Virtual for share count
postSchema.virtual('shareCount').get(function() {
    return this.shares ? this.shares.length : 0;
});

// Ensure virtuals are included in JSON
postSchema.set('toJSON', { 
    virtuals: true,
    transform: function(doc, ret) {
        delete ret._id;
        delete ret.__v;
        return ret;
    }
});

// Pre-save middleware to update timestamps
postSchema.pre('save', function(next) {
    this.updatedAt = new Date();
    next();
});

// Static method to get posts for newsfeed
postSchema.statics.getNewsfeed = function(userId, options = {}) {
    const limit = options.limit || 10;
    const skip = options.skip || 0;
    
    return this.find({
        status: 'active',
        $or: [
            { privacy: 'public' },
            { author: userId, privacy: { $in: ['public', 'friends', 'private'] } }
        ]
    })
    .populate('author', 'firstName lastName username avatar')
    .populate('likes.user', 'firstName lastName username')
    .populate('comments.user', 'firstName lastName username avatar')
    .sort({ createdAt: -1 })
    .limit(limit)
    .skip(skip);
};

module.exports = mongoose.model('Post', postSchema);
