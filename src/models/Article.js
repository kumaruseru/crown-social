const mongoose = require('mongoose');

const articleSchema = new mongoose.Schema({
    // ID gốc từ RSS feed
    originalId: {
        type: String,
        required: true,
        index: true
    },

    // Thông tin cơ bản
    title: {
        type: String,
        required: true,
        trim: true,
        maxlength: 500
    },
    
    description: {
        type: String,
        required: true,
        maxlength: 1000
    },
    
    content: {
        type: String,
        required: true
    },
    
    link: {
        type: String,
        required: true,
        unique: true
    },

    // Thông tin nguồn
    source: {
        type: String,
        required: true,
        index: true
    },
    
    category: {
        type: String,
        required: true,
        enum: [
            'latest', 'politics', 'world', 'business', 'technology', 
            'sports', 'entertainment', 'health', 'education', 'travel',
            'culture', 'law', 'science', 'finance', 'startup', 'gaming',
            'mobile', 'internet', 'stocks', 'realestate', 'banking',
            'football', 'medicine', 'nutrition', 'university', 'exam',
            'home', 'general', 'music', 'movie', 'fashion', 'lifestyle',
            'auto', 'publishing', 'factcheck', 'relaxation', 'reader',
            'video', 'society', 'profile', 'military', 'islands', 'local',
            'perspective', 'photo', 'infographics', 'special', 'ethnic',
            'photo360'
        ],
        index: true
    },
    
    author: {
        type: String,
        default: ''
    },

    // Media
    image: {
        type: String,
        default: null
    },
    
    // SEO và tags
    tags: [{
        type: String,
        trim: true
    }],
    
    // Thống kê
    views: {
        type: Number,
        default: 0,
        min: 0
    },
    
    likes: {
        type: Number,
        default: 0,
        min: 0
    },
    
    shares: {
        type: Number,
        default: 0,
        min: 0
    },
    
    // Trạng thái
    isActive: {
        type: Boolean,
        default: true,
        index: true
    },
    
    isFeatured: {
        type: Boolean,
        default: false,
        index: true
    },
    
    isBreaking: {
        type: Boolean,
        default: false,
        index: true
    },

    // Thời gian
    publishedAt: {
        type: Date,
        required: true,
        index: true
    },
    
    createdAt: {
        type: Date,
        default: Date.now,
        index: true
    },
    
    updatedAt: {
        type: Date,
        default: Date.now
    },

    // Comments từ users
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
        },
        likes: {
            type: Number,
            default: 0
        }
    }],

    // Những user đã like bài viết
    likedBy: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],

    // Những user đã share bài viết
    sharedBy: [{
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        sharedAt: {
            type: Date,
            default: Date.now
        },
        platform: {
            type: String,
            enum: ['facebook', 'twitter', 'telegram', 'copy_link'],
            default: 'copy_link'
        }
    }],

    // Metadata cho AI/ML
    sentiment: {
        type: String,
        enum: ['positive', 'negative', 'neutral'],
        default: 'neutral'
    },
    
    readingTime: {
        type: Number, // phút
        default: 0
    },
    
    language: {
        type: String,
        default: 'vi'
    },
    
    // Quan trọng với thuật toán
    priority: {
        type: Number,
        default: 0,
        min: 0,
        max: 10
    }
}, {
    timestamps: true,
    toJSON: { 
        virtuals: true,
        transform: function(doc, ret) {
            delete ret.__v;
            return ret;
        }
    },
    toObject: { virtuals: true }
});

// Indexes for performance
articleSchema.index({ publishedAt: -1, isActive: 1 });
articleSchema.index({ category: 1, publishedAt: -1 });
articleSchema.index({ source: 1, publishedAt: -1 });
articleSchema.index({ views: -1, publishedAt: -1 });
articleSchema.index({ isFeatured: 1, publishedAt: -1 });
articleSchema.index({ isBreaking: 1, publishedAt: -1 });
articleSchema.index({ tags: 1 });

// Text index for search
articleSchema.index({ 
    title: 'text', 
    description: 'text', 
    content: 'text',
    tags: 'text'
}, {
    weights: {
        title: 10,
        description: 5,
        tags: 3,
        content: 1
    }
});

// Virtual for comment count
articleSchema.virtual('commentCount').get(function() {
    return this.comments ? this.comments.length : 0;
});

// Virtual for like count
articleSchema.virtual('likeCount').get(function() {
    return this.likedBy ? this.likedBy.length : 0;
});

// Virtual for share count  
articleSchema.virtual('shareCount').get(function() {
    return this.sharedBy ? this.sharedBy.length : 0;
});

// Virtual for reading time calculation
articleSchema.virtual('estimatedReadingTime').get(function() {
    if (this.readingTime > 0) return this.readingTime;
    
    const wordsPerMinute = 200;
    const wordCount = this.content ? this.content.split(' ').length : 0;
    return Math.ceil(wordCount / wordsPerMinute) || 1;
});

// Virtual for formatted date
articleSchema.virtual('formattedPublishedAt').get(function() {
    return this.publishedAt.toLocaleDateString('vi-VN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
});

// Middleware to update readingTime before saving
articleSchema.pre('save', function(next) {
    if (this.isModified('content')) {
        const wordsPerMinute = 200;
        const wordCount = this.content ? this.content.split(' ').length : 0;
        this.readingTime = Math.ceil(wordCount / wordsPerMinute) || 1;
    }
    
    if (this.isModified()) {
        this.updatedAt = new Date();
    }
    
    next();
});

// Static method to get trending articles
articleSchema.statics.getTrending = function(limit = 10) {
    const oneDayAgo = new Date();
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);
    
    return this.find({
        isActive: true,
        publishedAt: { $gte: oneDayAgo }
    })
    .sort({ views: -1, likes: -1, shares: -1 })
    .limit(limit);
};

// Static method to get breaking news
articleSchema.statics.getBreakingNews = function(limit = 5) {
    return this.find({
        isBreaking: true,
        isActive: true
    })
    .sort({ publishedAt: -1 })
    .limit(limit);
};

// Instance method to add comment
articleSchema.methods.addComment = function(userId, content) {
    this.comments.push({
        user: userId,
        content: content,
        createdAt: new Date()
    });
    return this.save();
};

// Instance method to toggle like
articleSchema.methods.toggleLike = function(userId) {
    const index = this.likedBy.indexOf(userId);
    if (index > -1) {
        this.likedBy.splice(index, 1);
        this.likes = Math.max(0, this.likes - 1);
    } else {
        this.likedBy.push(userId);
        this.likes += 1;
    }
    return this.save();
};

// Instance method to add share
articleSchema.methods.addShare = function(userId, platform = 'copy_link') {
    this.sharedBy.push({
        user: userId,
        platform: platform,
        sharedAt: new Date()
    });
    this.shares += 1;
    return this.save();
};

module.exports = mongoose.model('Article', articleSchema);
