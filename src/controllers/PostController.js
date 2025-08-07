const BaseController = require('./BaseController');
const Post = require('../models/Post');
const Comment = require('../models/Comment');
const User = require('../models/User');
const Friend = require('../models/Friend');

/**
 * Enhanced Post Controller - Handle all post operations for Activity Feed
 */
class PostController extends BaseController {
    
    /**
     * Create a new post
     * POST /api/posts
     */
    createPost = async (req, res) => {
        try {
            this.logRequest(req, 'CREATE_POST');
            
            const { content, type = 'text', visibility = 'friends', tags = [], mentions = [], media = [], location } = req.body;
            const authorId = req.user.id;
            
            // Validate required fields
            if (!content || content.trim().length === 0) {
                return this.sendError(res, 'Content is required');
            }
            
            // Create new post
            const post = new Post({
                author: authorId,
                content: content.trim(),
                type,
                visibility,
                tags,
                mentions,
                media,
                location
            });
            
            await post.save();
            
            // Populate author info for response
            await post.populate('author', 'firstName lastName username avatar isOnline');
            
            console.log(`✅ Created new post by user ${req.user.email}`);
            
            return this.sendSuccess(res, post, 'Post created successfully');
            
        } catch (error) {
            console.error('❌ Error creating post:', error);
            return this.sendError(res, 'Failed to create post', [], 500);
        }
    }
    
    /**
     * Get activity feed
     * GET /api/posts/feed
     */
    getFeed = async (req, res) => {
        try {
            this.logRequest(req, 'GET_FEED');
            
            const userId = req.user.id;
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;
            
            const posts = await Post.getFeedPosts(userId, { page, limit });
            
            // Add engagement info for each post
            for (let post of posts) {
                // Check if current user liked this post
                post.isLikedByUser = post.likes.some(like => like.user.equals(userId));
                
                // Get like reactions summary
                post.reactionsSummary = {};
                post.likes.forEach(like => {
                    post.reactionsSummary[like.type] = (post.reactionsSummary[like.type] || 0) + 1;
                });
            }
            
            console.log(`📄 Retrieved ${posts.length} feed posts for user ${req.user.email}`);
            
            return this.sendSuccess(res, {
                posts,
                pagination: {
                    page,
                    limit,
                    hasMore: posts.length === limit
                }
            }, 'Feed retrieved successfully');
            
        } catch (error) {
            console.error('❌ Error getting feed:', error);
            return this.sendError(res, 'Failed to get feed', [], 500);
        }
    }
    
    /**
     * Get trending posts
     * GET /api/posts/trending
     */
    getTrendingPosts = async (req, res) => {
        try {
            this.logRequest(req, 'GET_TRENDING');
            
            const timeframe = req.query.timeframe || '24h';
            const limit = parseInt(req.query.limit) || 20;
            
            const posts = await Post.getTrendingPosts(timeframe);
            
            console.log(`📈 Retrieved ${posts.length} trending posts`);
            
            return this.sendSuccess(res, posts.slice(0, limit), 'Trending posts retrieved successfully');
            
        } catch (error) {
            console.error('❌ Error getting trending posts:', error);
            return this.sendError(res, 'Failed to get trending posts', [], 500);
        }
    }
    
    /**
     * Get single post
     * GET /api/posts/:postId
     */
    getPost = async (req, res) => {
        try {
            this.logRequest(req, 'GET_POST');
            
            const { postId } = req.params;
            const userId = req.user.id;
            
            const post = await Post.findById(postId)
                .populate('author', 'firstName lastName username avatar isOnline')
                .populate('mentions.user', 'firstName lastName username');
            
            if (!post) {
                return this.sendError(res, 'Post not found', [], 404);
            }
            
            // Check if user can view this post
            const userFriends = await Friend.getFriendIds(userId);
            if (!post.canUserView(userId, userFriends)) {
                return this.sendError(res, 'You do not have permission to view this post', [], 403);
            }
            
            // Increment view count
            await post.addView();
            
            // Add user interaction info
            post.isLikedByUser = post.likes.some(like => like.user.equals(userId));
            post.reactionsSummary = post.getLikeSummary();
            
            console.log(`👁️ User ${req.user.email} viewed post ${postId}`);
            
            return this.sendSuccess(res, post, 'Post retrieved successfully');
            
        } catch (error) {
            console.error('❌ Error getting post:', error);
            return this.sendError(res, 'Failed to get post', [], 500);
        }
    }
    
    /**
     * Toggle like on post
     * POST /api/posts/:postId/like
     */
    toggleLike = async (req, res) => {
        try {
            this.logRequest(req, 'TOGGLE_LIKE');
            
            const { postId } = req.params;
            const { reactionType = 'like' } = req.body;
            const userId = req.user.id;
            
            const post = await Post.findById(postId);
            
            if (!post || !post.isActive) {
                return this.sendError(res, 'Post not found', [], 404);
            }
            
            // Check if user can view this post
            const userFriends = await Friend.getFriendIds(userId);
            if (!post.canUserView(userId, userFriends)) {
                return this.sendError(res, 'You do not have permission to interact with this post', [], 403);
            }
            
            await post.toggleLike(userId, reactionType);
            
            console.log(`👍 User ${req.user.email} reacted to post ${postId} with ${reactionType}`);
            
            return this.sendSuccess(res, {
                likesCount: post.likesCount,
                reactionsSummary: post.getLikeSummary()
            }, 'Reaction updated');
            
        } catch (error) {
            console.error('❌ Error toggling like:', error);
            return this.sendError(res, 'Failed to update reaction', [], 500);
        }
    }
    
    /**
     * Get post comments
     * GET /api/posts/:postId/comments
     */
    getComments = async (req, res) => {
        try {
            this.logRequest(req, 'GET_COMMENTS');
            
            const { postId } = req.params;
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 20;
            const includeReplies = req.query.includeReplies !== 'false';
            
            // Check if post exists and user can view it
            const post = await Post.findById(postId);
            if (!post || !post.isActive) {
                return this.sendError(res, 'Post not found', [], 404);
            }
            
            const userFriends = await Friend.getFriendIds(req.user.id);
            if (!post.canUserView(req.user.id, userFriends)) {
                return this.sendError(res, 'You do not have permission to view this post', [], 403);
            }
            
            const comments = await Comment.getPostComments(postId, { page, limit, includeReplies });
            
            console.log(`💬 Retrieved ${comments.length} comments for post ${postId}`);
            
            return this.sendSuccess(res, {
                comments,
                pagination: {
                    page,
                    limit,
                    hasMore: comments.length === limit
                }
            }, 'Comments retrieved successfully');
            
        } catch (error) {
            console.error('❌ Error getting comments:', error);
            return this.sendError(res, 'Failed to get comments', [], 500);
        }
    }
    
    /**
     * Add comment to post
     * POST /api/posts/:postId/comments
     */
    addComment = async (req, res) => {
        try {
            this.logRequest(req, 'ADD_COMMENT');
            
            const { postId } = req.params;
            const { content, parentComment = null, mentions = [], media } = req.body;
            const userId = req.user.id;
            
            if (!content || content.trim().length === 0) {
                return this.sendError(res, 'Comment content is required');
            }
            
            // Check if post exists and user can view it
            const post = await Post.findById(postId);
            if (!post || !post.isActive) {
                return this.sendError(res, 'Post not found', [], 404);
            }
            
            const userFriends = await Friend.getFriendIds(userId);
            if (!post.canUserView(userId, userFriends)) {
                return this.sendError(res, 'You do not have permission to comment on this post', [], 403);
            }
            
            // Create comment
            const comment = new Comment({
                post: postId,
                author: userId,
                content: content.trim(),
                parentComment,
                mentions,
                media
            });
            
            await comment.save();
            
            await comment.populate([
                { path: 'author', select: 'firstName lastName username avatar' },
                { path: 'mentions.user', select: 'firstName lastName username' }
            ]);
            
            console.log(`💬 User ${req.user.email} commented on post ${postId}`);
            
            return this.sendSuccess(res, comment, 'Comment added successfully');
            
        } catch (error) {
            console.error('❌ Error adding comment:', error);
            return this.sendError(res, 'Failed to add comment', [], 500);
        }
    }
    
    /**
     * Get user's posts
     * GET /api/posts/user/:userId
     */
    getUserPosts = async (req, res) => {
        try {
            this.logRequest(req, 'GET_USER_POSTS');
            
            const { userId: profileUserId } = req.params;
            const viewerId = req.user.id;
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;
            
            const posts = await Post.getUserPosts(profileUserId, viewerId, { page, limit });
            
            // Add user interaction info
            for (let post of posts) {
                post.isLikedByUser = post.likes.some(like => like.user.equals(viewerId));
                post.reactionsSummary = post.getLikeSummary();
            }
            
            console.log(`📄 Retrieved ${posts.length} posts for user profile ${profileUserId}`);
            
            return this.sendSuccess(res, {
                posts,
                pagination: {
                    page,
                    limit,
                    hasMore: posts.length === limit
                }
            }, 'User posts retrieved successfully');
            
        } catch (error) {
            console.error('❌ Error getting user posts:', error);
            return this.sendError(res, 'Failed to get user posts', [], 500);
        }
    }
    
    /**
     * Update post
     * PUT /api/posts/:postId
     */
    updatePost = async (req, res) => {
        try {
            this.logRequest(req, 'UPDATE_POST');
            
            const { postId } = req.params;
            const { content, visibility, tags, media } = req.body;
            const userId = req.user.id;
            
            const post = await Post.findById(postId);
            
            if (!post) {
                return this.sendError(res, 'Post not found', [], 404);
            }
            
            // Check if user owns the post
            if (!post.author.equals(userId)) {
                return this.sendError(res, 'You can only edit your own posts', [], 403);
            }
            
            // Update fields
            if (content !== undefined) post.content = content.trim();
            if (visibility !== undefined) post.visibility = visibility;
            if (tags !== undefined) post.tags = tags;
            if (media !== undefined) post.media = media;
            
            await post.save();
            
            await post.populate('author', 'firstName lastName username avatar');
            
            console.log(`✏️ User ${req.user.email} updated post ${postId}`);
            
            return this.sendSuccess(res, post, 'Post updated successfully');
            
        } catch (error) {
            console.error('❌ Error updating post:', error);
            return this.sendError(res, 'Failed to update post', [], 500);
        }
    }
    
    /**
     * Delete post
     * DELETE /api/posts/:postId
     */
    deletePost = async (req, res) => {
        try {
            this.logRequest(req, 'DELETE_POST');
            
            const { postId } = req.params;
            const userId = req.user.id;
            
            const post = await Post.findById(postId);
            
            if (!post) {
                return this.sendError(res, 'Post not found', [], 404);
            }
            
            // Check if user owns the post
            if (!post.author.equals(userId)) {
                return this.sendError(res, 'You can only delete your own posts', [], 403);
            }
            
            // Soft delete
            post.isActive = false;
            await post.save();
            
            console.log(`🗑️ User ${req.user.email} deleted post ${postId}`);
            
            return this.sendSuccess(res, null, 'Post deleted successfully');
            
        } catch (error) {
            console.error('❌ Error deleting post:', error);
            return this.sendError(res, 'Failed to delete post', [], 500);
        }
    }
    
    /**
     * Pin/unpin post
     * PUT /api/posts/:postId/pin
     */
    togglePin = async (req, res) => {
        try {
            this.logRequest(req, 'TOGGLE_PIN');
            
            const { postId } = req.params;
            const userId = req.user.id;
            
            const post = await Post.findById(postId);
            
            if (!post) {
                return this.sendError(res, 'Post not found', [], 404);
            }
            
            if (!post.author.equals(userId)) {
                return this.sendError(res, 'You can only pin your own posts', [], 403);
            }
            
            post.isPinned = !post.isPinned;
            await post.save();
            
            console.log(`📌 User ${req.user.email} ${post.isPinned ? 'pinned' : 'unpinned'} post ${postId}`);
            
            return this.sendSuccess(res, { isPinned: post.isPinned }, `Post ${post.isPinned ? 'pinned' : 'unpinned'} successfully`);
            
        } catch (error) {
            console.error('❌ Error toggling pin:', error);
            return this.sendError(res, 'Failed to toggle pin', [], 500);
        }
    }
    
    /**
     * Legacy method - kept for backward compatibility
     * GET /api/posts
     */
    getPosts = async (req, res) => {
        return await this.getFeed(req, res);
    }
}

module.exports = PostController;
