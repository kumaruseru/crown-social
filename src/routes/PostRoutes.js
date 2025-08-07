const express = require('express');
const PostController = require('../controllers/PostController');
const AuthMiddleware = require('../middleware/AuthMiddleware');

/**
 * Enhanced Post Routes - Complete social media post endpoints
 */
class PostRoutes {
    constructor() {
        this.router = express.Router();
        this.postController = new PostController();
        this.initializeRoutes();
    }

    /**
     * Initialize all routes
     */
    initializeRoutes() {
        // Apply authentication middleware to all routes
        this.router.use(AuthMiddleware.requireAuth);

        // Feed and Discovery
        this.router.get('/feed', this.postController.getFeed);
        this.router.get('/trending', this.postController.getTrendingPosts);
        
        // Individual Post Operations
        this.router.get('/:postId', this.postController.getPost);
        this.router.put('/:postId', this.postController.updatePost);
        this.router.delete('/:postId', this.postController.deletePost);
        this.router.put('/:postId/pin', this.postController.togglePin);
        
        // Post Interactions
        this.router.post('/:postId/like', this.postController.toggleLike);
        
        // Comments
        this.router.get('/:postId/comments', this.postController.getComments);
        this.router.post('/:postId/comments', this.postController.addComment);
        
        // User Posts
        this.router.get('/user/:userId', this.postController.getUserPosts);
        
        // Create New Post
        this.router.post('/', this.postController.createPost);
        
        // Legacy Routes (backward compatibility)
        this.router.get('/', this.postController.getPosts); // Fallback to feed
        this.router.post('/:id/like', this.postController.toggleLike); // Legacy like endpoint
        this.router.post('/:id/comment', this.postController.addComment); // Legacy comment endpoint

        console.log('✅ Enhanced Post routes initialized with social features');
    }

    /**
     * Get router instance
     */
    getRouter() {
        return this.router;
    }
}

module.exports = PostRoutes;
