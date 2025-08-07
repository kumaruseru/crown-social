const express = require('express');
const PostController = require('../controllers/PostController');

/**
 * Post Routes - Định tuyến cho các API liên quan đến bài đăng
 */
class PostRoutes {
    constructor() {
        this.router = express.Router();
        this.postController = new PostController();
        this.initializeRoutes();
    }

    /**
     * Khởi tạo các routes
     */
    initializeRoutes() {
        // Middleware kiểm tra authentication cho tất cả routes
        this.router.use(this.requireAuth);

        // GET /api/posts - Lấy danh sách posts
        this.router.get('/', this.postController.getPosts);

        // POST /api/posts - Tạo bài đăng mới
        this.router.post('/', this.postController.createPost);

        // POST /api/posts/:id/like - Like/Unlike bài đăng
        this.router.post('/:id/like', this.postController.toggleLike);

        // POST /api/posts/:id/comment - Thêm comment
        this.router.post('/:id/comment', this.postController.addComment);

        console.log('✅ Post routes đã được khởi tạo');
    }

    /**
     * Middleware kiểm tra authentication
     */
    requireAuth = (req, res, next) => {
        if (!req.isAuthenticated()) {
            return res.status(401).json({
                success: false,
                message: 'Bạn cần đăng nhập để thực hiện hành động này'
            });
        }
        next();
    }

    /**
     * Lấy router
     */
    getRouter() {
        return this.router;
    }
}

module.exports = PostRoutes;
