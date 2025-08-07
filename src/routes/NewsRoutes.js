const express = require('express');
const NewsController = require('../controllers/NewsController');
const { authenticate } = require('../middleware/AuthMiddleware');

class NewsRoutes {
    constructor() {
        this.router = express.Router();
        this.newsController = new NewsController();
        this.initializeRoutes();
        console.log('📰 News routes đã được khởi tạo');
    }

    initializeRoutes() {
        // Public routes - không cần authentication
        
        // GET /api/news/latest - Tin mới nhất
        this.router.get('/latest', 
            this.newsController.getLatestNews.bind(this.newsController)
        );

        // GET /api/news/categories - Danh sách danh mục
        this.router.get('/categories', 
            this.newsController.getCategories.bind(this.newsController)
        );

        // GET /api/news/category/:category - Tin theo danh mục
        this.router.get('/category/:category', 
            this.newsController.getNewsByCategory.bind(this.newsController)
        );

        // GET /api/news/featured - Tin nổi bật
        this.router.get('/featured', 
            this.newsController.getFeaturedNews.bind(this.newsController)
        );

        // GET /api/news/popular - Tin phổ biến
        this.router.get('/popular', 
            this.newsController.getPopularNews.bind(this.newsController)
        );

        // GET /api/news/trending - Tin trending
        this.router.get('/trending', 
            this.newsController.getTrendingNews.bind(this.newsController)
        );

        // GET /api/news/breaking - Tin nóng
        this.router.get('/breaking', 
            this.newsController.getBreakingNews.bind(this.newsController)
        );

        // GET /api/news/search - Tìm kiếm tin tức
        this.router.get('/search', 
            this.newsController.searchNews.bind(this.newsController)
        );

        // GET /api/news/:id - Chi tiết bài viết
        this.router.get('/:id', 
            this.newsController.getArticleDetails.bind(this.newsController)
        );

        // GET /api/news/stats - Thống kê tin tức (public cho dashboard)
        this.router.get('/admin/statistics', 
            this.newsController.getNewsStatistics.bind(this.newsController)
        );

        // Protected routes - cần authentication
        
        // POST /api/news/:id/like - Like bài viết
        this.router.post('/:id/like', 
            authenticate, 
            this.newsController.likeArticle.bind(this.newsController)
        );

        // POST /api/news/:id/comment - Thêm comment
        this.router.post('/:id/comment', 
            authenticate, 
            this.newsController.addComment.bind(this.newsController)
        );

        // POST /api/news/:id/share - Chia sẻ bài viết
        this.router.post('/:id/share', 
            authenticate, 
            this.newsController.shareArticle.bind(this.newsController)
        );

        // Admin routes - cần admin privileges (sẽ thêm middleware admin sau)
        
        // POST /api/news/sync - Đồng bộ tin tức thủ công
        this.router.post('/admin/sync', 
            // authenticate, 
            // requireAdmin, // Sẽ thêm sau
            this.newsController.syncNews.bind(this.newsController)
        );

        // Specific category routes for easier access
        this.setupCategoryRoutes();
    }

    setupCategoryRoutes() {
        // Các route shortcut cho từng danh mục
        const categories = [
            'politics', 'world', 'business', 'technology', 
            'sports', 'entertainment', 'health', 'education',
            'travel', 'culture', 'law', 'science', 'music',
            'movie', 'fashion', 'lifestyle', 'auto', 'publishing',
            'factcheck', 'relaxation', 'reader', 'video', 'realestate',
            'society', 'profile', 'military', 'islands', 'local',
            'perspective', 'photo', 'infographics', 'special', 
            'ethnic', 'photo360'
        ];

        categories.forEach(category => {
            this.router.get(`/${category}`, (req, res) => {
                req.params.category = category;
                this.newsController.getNewsByCategory(req, res);
            });
        });
    }

    getRouter() {
        return this.router;
    }
}

module.exports = NewsRoutes;
