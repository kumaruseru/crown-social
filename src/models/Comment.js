const mongoose = require('mongoose');

/**
 * Comment Schema - Comments for posts with threading support
 */
const CommentSchema = new mongoose.Schema({
    // Bài đăng chính
    post: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Post',
        required: true,
        index: true
    },
    
    // Tác giả comment
    author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    
    // Nội dung comment
    content: {
        type: String,
        required: [true, 'Nội dung comment không được để trống'],
        maxlength: [1000, 'Comment không được vượt quá 1000 ký tự'],
        trim: true
    },
    
    // Parent comment (for threading/replies)
    parentComment: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Comment',
        default: null
    },
    
    // Mention users in comment
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
    
    // Likes on comment
    likes: [{
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        createdAt: {
            type: Date,
            default: Date.now
        }
    }],
    
    // Like count for performance
    likesCount: {
        type: Number,
        default: 0,
        min: 0
    },
    
    // Reply count for performance
    repliesCount: {
        type: Number,
        default: 0,
        min: 0
    },
    
    // Media attachment (single image/gif)
    media: {
        type: {
            type: String,
            enum: ['image', 'gif']
        },
        url: String,
        thumbnail: String
    },
    
    // Status flags
    isActive: {
        type: Boolean,
        default: true
    },
    
    isEdited: {
        type: Boolean,
        default: false
    },
    
    // Edit history
    editHistory: [{
        content: String,
        editedAt: {
            type: Date,
            default: Date.now
        }
    }]
    
}, {
    timestamps: true,
    versionKey: false
});

// Indexes for performance
CommentSchema.index({ post: 1, createdAt: -1 });
CommentSchema.index({ author: 1, createdAt: -1 });
CommentSchema.index({ parentComment: 1, createdAt: 1 });
CommentSchema.index({ 'mentions.user': 1 });

// Virtual for thread level
CommentSchema.virtual('isReply').get(function() {
    return this.parentComment !== null;
});

// Static methods
CommentSchema.statics = {
    /**
     * Get comments for a post with threading
     */
    async getPostComments(postId, options = {}) {
        const { page = 1, limit = 20, includeReplies = true } = options;
        const skip = (page - 1) * limit;
        
        // First get top-level comments
        const topLevelComments = await this.find({
            post: postId,
            parentComment: null,
            isActive: true
        })
        .populate('author', 'firstName lastName username avatar')
        .populate('mentions.user', 'firstName lastName username')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean();
        
        if (!includeReplies) {
            return topLevelComments;
        }
        
        // Get replies for each comment
        for (let comment of topLevelComments) {
            const replies = await this.find({
                parentComment: comment._id,
                isActive: true
            })
            .populate('author', 'firstName lastName username avatar')
            .populate('mentions.user', 'firstName lastName username')
            .sort({ createdAt: 1 })
            .limit(5) // Limit initial replies
            .lean();
            
            comment.replies = replies;
            comment.hasMoreReplies = replies.length === 5;
        }
        
        return topLevelComments;
    },
    
    /**
     * Get replies for a specific comment
     */
    async getCommentReplies(commentId, options = {}) {
        const { page = 1, limit = 10 } = options;
        const skip = (page - 1) * limit;
        
        return await this.find({
            parentComment: commentId,
            isActive: true
        })
        .populate('author', 'firstName lastName username avatar')
        .populate('mentions.user', 'firstName lastName username')
        .sort({ createdAt: 1 })
        .skip(skip)
        .limit(limit);
    },
    
    /**
     * Get user's comment history
     */
    async getUserComments(userId, options = {}) {
        const { page = 1, limit = 20 } = options;
        const skip = (page - 1) * limit;
        
        return await this.find({
            author: userId,
            isActive: true
        })
        .populate('post', 'content author')
        .populate('post.author', 'firstName lastName username')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);
    }
};

// Instance methods
CommentSchema.methods = {
    /**
     * Toggle like on comment
     */
    async toggleLike(userId) {
        const existingLike = this.likes.find(like => like.user.equals(userId));
        
        if (existingLike) {
            // Remove like
            this.likes = this.likes.filter(like => !like.user.equals(userId));
            this.likesCount = Math.max(0, this.likesCount - 1);
        } else {
            // Add like
            this.likes.push({ 
                user: userId, 
                createdAt: new Date() 
            });
            this.likesCount = this.likesCount + 1;
        }
        
        return await this.save();
    },
    
    /**
     * Edit comment content
     */
    async editContent(newContent) {
        // Save old content to history
        if (!this.isEdited) {
            this.editHistory.push({
                content: this.content,
                editedAt: new Date()
            });
        }
        
        this.content = newContent;
        this.isEdited = true;
        
        return await this.save();
    },
    
    /**
     * Soft delete comment
     */
    async softDelete() {
        this.isActive = false;
        this.content = '[Comment đã được xóa]';
        return await this.save();
    },
    
    /**
     * Check if user can edit/delete this comment
     */
    canUserModify(userId) {
        return this.author.equals(userId);
    }
};

// Post-save middleware to update post comment count
CommentSchema.post('save', async function(doc, next) {
    if (doc.isNew && doc.isActive) {
        // Update post comment count
        await mongoose.model('Post').findByIdAndUpdate(
            doc.post,
            { $inc: { commentsCount: 1 } }
        );
        
        // Update parent comment reply count if it's a reply
        if (doc.parentComment) {
            await this.model('Comment').findByIdAndUpdate(
                doc.parentComment,
                { $inc: { repliesCount: 1 } }
            );
        }
    }
    next();
});

// Pre-remove middleware to update counts
CommentSchema.pre('deleteOne', { document: true, query: false }, async function() {
    if (this.isActive) {
        // Decrease post comment count
        await mongoose.model('Post').findByIdAndUpdate(
            this.post,
            { $inc: { commentsCount: -1 } }
        );
        
        // Decrease parent comment reply count if it's a reply
        if (this.parentComment) {
            await this.model('Comment').findByIdAndUpdate(
                this.parentComment,
                { $inc: { repliesCount: -1 } }
            );
        }
    }
});

module.exports = mongoose.model('Comment', CommentSchema);
