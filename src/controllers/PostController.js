const BaseController = require('./BaseController');
const Post = require('../models/Post');

/**
 * Post Controller - Xử lý các requests liên quan đến bài đăng
 */
class PostController extends BaseController {
    
    /**
     * Lấy danh sách posts cho newsfeed
     * GET /api/posts
     */
    getPosts = async (req, res) => {
        try {
            this.logRequest(req, 'GET_POSTS');

            // Pagination
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;
            const skip = (page - 1) * limit;

            // Get posts
            const posts = await Post.getNewsfeed(req.user._id, { limit, skip });
            
            console.log(`📄 Retrieved ${posts.length} posts for user ${req.user.email}`);
            
            return this.sendSuccess(res, {
                posts,
                pagination: {
                    page,
                    limit,
                    total: posts.length,
                    hasMore: posts.length === limit
                }
            }, 'Posts retrieved successfully');

        } catch (error) {
            console.error('❌ Error getting posts:', error);
            return this.sendError(res, 'Có lỗi xảy ra khi lấy danh sách bài đăng', [], 500);
        }
    }

    /**
     * Tạo bài đăng mới
     * POST /api/posts
     */
    createPost = async (req, res) => {
        try {
            this.logRequest(req, 'CREATE_POST');

            // Validate required fields
            const requiredFields = ['content'];
            const validationErrors = this.validateRequiredFields(req.body, requiredFields);
            
            if (validationErrors.length > 0) {
                return this.sendError(res, 'Thiếu thông tin bắt buộc', validationErrors);
            }

            // Create new post
            const postData = {
                author: req.user._id,
                content: req.body.content,
                images: req.body.images || [],
                video: req.body.video || null,
                hashtags: this.extractHashtags(req.body.content),
                mentions: req.body.mentions || [],
                privacy: req.body.privacy || 'public',
                location: req.body.location || null
            };

            const post = new Post(postData);
            await post.save();

            // Populate author info
            await post.populate('author', 'firstName lastName username avatar');

            console.log(`✅ Created new post by user ${req.user.email}`);
            
            return this.sendSuccess(res, { post }, 'Bài đăng đã được tạo thành công');

        } catch (error) {
            console.error('❌ Error creating post:', error);
            return this.sendError(res, 'Có lỗi xảy ra khi tạo bài đăng', [], 500);
        }
    }

    /**
     * Like/Unlike bài đăng
     * POST /api/posts/:id/like
     */
    toggleLike = async (req, res) => {
        try {
            this.logRequest(req, 'TOGGLE_LIKE');

            const postId = req.params.id;
            const userId = req.user._id;

            const post = await Post.findById(postId);
            if (!post) {
                return this.sendError(res, 'Không tìm thấy bài đăng', [], 404);
            }

            // Check if user already liked
            const likeIndex = post.likes.findIndex(like => like.user.toString() === userId.toString());
            
            if (likeIndex > -1) {
                // Unlike
                post.likes.splice(likeIndex, 1);
            } else {
                // Like
                post.likes.push({ user: userId });
            }

            await post.save();

            console.log(`👍 User ${req.user.email} ${likeIndex > -1 ? 'unliked' : 'liked'} post ${postId}`);
            
            return this.sendSuccess(res, {
                liked: likeIndex === -1,
                likeCount: post.likeCount
            }, 'Cập nhật like thành công');

        } catch (error) {
            console.error('❌ Error toggling like:', error);
            return this.sendError(res, 'Có lỗi xảy ra khi cập nhật like', [], 500);
        }
    }

    /**
     * Thêm comment
     * POST /api/posts/:id/comment
     */
    addComment = async (req, res) => {
        try {
            this.logRequest(req, 'ADD_COMMENT');

            const postId = req.params.id;
            const { content } = req.body;

            if (!content || content.trim() === '') {
                return this.sendError(res, 'Nội dung comment không được để trống');
            }

            const post = await Post.findById(postId);
            if (!post) {
                return this.sendError(res, 'Không tìm thấy bài đăng', [], 404);
            }

            // Add comment
            post.comments.push({
                user: req.user._id,
                content: content.trim()
            });

            await post.save();

            // Populate comment user info
            await post.populate('comments.user', 'firstName lastName username avatar');

            const newComment = post.comments[post.comments.length - 1];

            console.log(`💬 User ${req.user.email} commented on post ${postId}`);
            
            return this.sendSuccess(res, {
                comment: newComment,
                commentCount: post.commentCount
            }, 'Comment đã được thêm thành công');

        } catch (error) {
            console.error('❌ Error adding comment:', error);
            return this.sendError(res, 'Có lỗi xảy ra khi thêm comment', [], 500);
        }
    }

    /**
     * Extract hashtags from content
     */
    extractHashtags(content) {
        const hashtags = content.match(/#[\w\u00C0-\u024F\u1E00-\u1EFF]+/g);
        return hashtags ? hashtags.map(tag => tag.substring(1).toLowerCase()) : [];
    }
}

module.exports = PostController;
