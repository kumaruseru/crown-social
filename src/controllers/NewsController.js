const NewsService = require('../services/NewsService');

class NewsController {
    constructor() {
        this.newsService = new NewsService();
        
        // Khởi động News Service
        this.newsService.startNewsSync();
        
        console.log('📰 News Controller đã được khởi tạo');
    }

    // Lấy tin tức mới nhất
    async getLatestNews(req, res) {
        try {
            const limit = parseInt(req.query.limit) || 20;
            const articles = await this.newsService.getLatestNews(limit);
            
            res.json({
                success: true,
                data: articles,
                count: articles.length
            });
        } catch (error) {
            console.error('❌ Lỗi khi lấy tin mới nhất:', error);
            res.status(500).json({
                success: false,
                message: 'Lỗi khi lấy tin tức mới nhất',
                error: error.message
            });
        }
    }

    // Lấy tin theo danh mục
    async getNewsByCategory(req, res) {
        try {
            const { category } = req.params;
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 20;
            
            const result = await this.newsService.getNewsByCategory(category, page, limit);
            
            res.json({
                success: true,
                data: result.articles,
                pagination: {
                    page: result.page,
                    totalPages: result.totalPages,
                    total: result.total,
                    hasNext: result.hasNext,
                    hasPrev: result.hasPrev
                }
            });
        } catch (error) {
            console.error('❌ Lỗi khi lấy tin theo danh mục:', error);
            res.status(500).json({
                success: false,
                message: 'Lỗi khi lấy tin tức theo danh mục',
                error: error.message
            });
        }
    }

    // Lấy tin nổi bật
    async getFeaturedNews(req, res) {
        try {
            const limit = parseInt(req.query.limit) || 10;
            const articles = await this.newsService.getFeaturedNews(limit);
            
            res.json({
                success: true,
                data: articles,
                count: articles.length
            });
        } catch (error) {
            console.error('❌ Lỗi khi lấy tin nổi bật:', error);
            res.status(500).json({
                success: false,
                message: 'Lỗi khi lấy tin tức nổi bật',
                error: error.message
            });
        }
    }

    // Lấy tin phổ biến
    async getPopularNews(req, res) {
        try {
            const limit = parseInt(req.query.limit) || 10;
            const articles = await this.newsService.getPopularNews(limit);
            
            res.json({
                success: true,
                data: articles,
                count: articles.length
            });
        } catch (error) {
            console.error('❌ Lỗi khi lấy tin phổ biến:', error);
            res.status(500).json({
                success: false,
                message: 'Lỗi khi lấy tin tức phổ biến',
                error: error.message
            });
        }
    }

    // Tìm kiếm tin tức
    async searchNews(req, res) {
        try {
            const { q: query } = req.query;
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 20;
            
            if (!query) {
                return res.status(400).json({
                    success: false,
                    message: 'Thiếu từ khóa tìm kiếm'
                });
            }
            
            const result = await this.newsService.searchNews(query, page, limit);
            
            res.json({
                success: true,
                data: result.articles,
                pagination: {
                    page: result.page,
                    totalPages: result.totalPages,
                    total: result.total,
                    hasNext: result.hasNext,
                    hasPrev: result.hasPrev,
                    query: result.query
                }
            });
        } catch (error) {
            console.error('❌ Lỗi khi tìm kiếm tin tức:', error);
            res.status(500).json({
                success: false,
                message: 'Lỗi khi tìm kiếm tin tức',
                error: error.message
            });
        }
    }

    // Lấy chi tiết bài viết
    async getArticleDetails(req, res) {
        try {
            const { id } = req.params;
            const article = await this.newsService.getArticleById(id);
            
            if (!article) {
                return res.status(404).json({
                    success: false,
                    message: 'Không tìm thấy bài viết'
                });
            }

            // Lấy bài viết liên quan
            const relatedArticles = await this.newsService.getRelatedArticles(id, 5);
            
            res.json({
                success: true,
                data: {
                    article,
                    relatedArticles
                }
            });
        } catch (error) {
            console.error('❌ Lỗi khi lấy chi tiết bài viết:', error);
            res.status(500).json({
                success: false,
                message: 'Lỗi khi lấy chi tiết bài viết',
                error: error.message
            });
        }
    }

    // Like bài viết
    async likeArticle(req, res) {
        try {
            const { id } = req.params;
            const userId = req.user ? req.user.id : null;
            
            if (!userId) {
                return res.status(401).json({
                    success: false,
                    message: 'Vui lòng đăng nhập để thực hiện hành động này'
                });
            }

            const article = await this.newsService.getArticleById(id);
            if (!article) {
                return res.status(404).json({
                    success: false,
                    message: 'Không tìm thấy bài viết'
                });
            }

            await article.toggleLike(userId);
            
            res.json({
                success: true,
                message: 'Đã cập nhật trạng thái like',
                data: {
                    likes: article.likes,
                    isLiked: article.likedBy.includes(userId)
                }
            });
        } catch (error) {
            console.error('❌ Lỗi khi like bài viết:', error);
            res.status(500).json({
                success: false,
                message: 'Lỗi khi cập nhật like',
                error: error.message
            });
        }
    }

    // Thêm comment
    async addComment(req, res) {
        try {
            const { id } = req.params;
            const { content } = req.body;
            const userId = req.user ? req.user.id : null;
            
            if (!userId) {
                return res.status(401).json({
                    success: false,
                    message: 'Vui lòng đăng nhập để bình luận'
                });
            }

            if (!content || content.trim().length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Nội dung bình luận không được để trống'
                });
            }

            const article = await this.newsService.getArticleById(id);
            if (!article) {
                return res.status(404).json({
                    success: false,
                    message: 'Không tìm thấy bài viết'
                });
            }

            await article.addComment(userId, content.trim());
            
            res.json({
                success: true,
                message: 'Đã thêm bình luận thành công',
                data: {
                    commentCount: article.commentCount
                }
            });
        } catch (error) {
            console.error('❌ Lỗi khi thêm comment:', error);
            res.status(500).json({
                success: false,
                message: 'Lỗi khi thêm bình luận',
                error: error.message
            });
        }
    }

    // Share bài viết
    async shareArticle(req, res) {
        try {
            const { id } = req.params;
            const { platform } = req.body;
            const userId = req.user ? req.user.id : null;
            
            if (!userId) {
                return res.status(401).json({
                    success: false,
                    message: 'Vui lòng đăng nhập để thực hiện hành động này'
                });
            }

            const article = await this.newsService.getArticleById(id);
            if (!article) {
                return res.status(404).json({
                    success: false,
                    message: 'Không tìm thấy bài viết'
                });
            }

            await article.addShare(userId, platform || 'copy_link');
            
            res.json({
                success: true,
                message: 'Đã ghi nhận chia sẻ',
                data: {
                    shares: article.shares
                }
            });
        } catch (error) {
            console.error('❌ Lỗi khi share bài viết:', error);
            res.status(500).json({
                success: false,
                message: 'Lỗi khi chia sẻ bài viết',
                error: error.message
            });
        }
    }

    // Lấy thống kê tin tức
    async getNewsStatistics(req, res) {
        try {
            const stats = await this.newsService.getNewsStatistics();
            
            res.json({
                success: true,
                data: stats
            });
        } catch (error) {
            console.error('❌ Lỗi khi lấy thống kê:', error);
            res.status(500).json({
                success: false,
                message: 'Lỗi khi lấy thống kê tin tức',
                error: error.message
            });
        }
    }

    // Đồng bộ tin tức thủ công
    async syncNews(req, res) {
        try {
            const { category } = req.body;
            
            if (category) {
                const newCount = await this.newsService.syncNewsByCategory(category);
                res.json({
                    success: true,
                    message: `Đã đồng bộ ${newCount} bài tin mới cho danh mục ${category}`
                });
            } else {
                // Trigger đồng bộ tất cả (async)
                this.newsService.syncAllNews();
                res.json({
                    success: true,
                    message: 'Đã bắt đầu đồng bộ tất cả tin tức'
                });
            }
        } catch (error) {
            console.error('❌ Lỗi khi đồng bộ tin tức:', error);
            res.status(500).json({
                success: false,
                message: 'Lỗi khi đồng bộ tin tức',
                error: error.message
            });
        }
    }

    // Danh sách danh mục có sẵn
    async getCategories(req, res) {
        try {
            const categories = [
                { id: 'latest', name: 'Mới nhất', icon: '🆕' },
                { id: 'politics', name: 'Thời sự', icon: '🏛️' },
                { id: 'world', name: 'Thế giới', icon: '🌍' },
                { id: 'business', name: 'Kinh doanh', icon: '💼' },
                { id: 'technology', name: 'Công nghệ', icon: '💻' },
                { id: 'sports', name: 'Thể thao', icon: '⚽' },
                { id: 'entertainment', name: 'Giải trí', icon: '🎭' },
                { id: 'health', name: 'Sức khỏe', icon: '🏥' },
                { id: 'education', name: 'Giáo dục', icon: '📚' },
                { id: 'travel', name: 'Du lịch', icon: '✈️' },
                { id: 'culture', name: 'Văn hóa', icon: '🎨' },
                { id: 'law', name: 'Pháp luật', icon: '⚖️' },
                { id: 'science', name: 'Khoa học', icon: '🔬' },
                { id: 'music', name: 'Âm nhạc', icon: '🎵' },
                { id: 'movie', name: 'Phim ảnh', icon: '🎬' },
                { id: 'fashion', name: 'Thời trang', icon: '👗' },
                { id: 'lifestyle', name: 'Sống trẻ', icon: '🌟' },
                { id: 'auto', name: 'Ô tô - Xe máy', icon: '🚗' },
                { id: 'publishing', name: 'Xuất bản', icon: '📖' },
                { id: 'factcheck', name: 'Giả - Thật', icon: '🔍' },
                { id: 'relaxation', name: 'Thư giãn', icon: '😌' },
                { id: 'reader', name: 'Bạn đọc', icon: '👥' },
                { id: 'video', name: 'Video', icon: '🎥' },
                { id: 'realestate', name: 'Nhà đất', icon: '🏠' },
                { id: 'society', name: 'Xã hội', icon: '👥' },
                { id: 'profile', name: 'Hồ sơ', icon: '📄' },
                { id: 'military', name: 'Quân sự', icon: '⚔️' },
                { id: 'islands', name: 'Biển đảo', icon: '🏝️' },
                { id: 'local', name: 'Địa phương', icon: '🌆' },
                { id: 'perspective', name: 'Góc nhìn', icon: '👁️' },
                { id: 'photo', name: 'Ảnh', icon: '📸' },
                { id: 'infographics', name: 'Infographics', icon: '📊' },
                { id: 'special', name: 'Đặc biệt', icon: '⭐' },
                { id: 'ethnic', name: 'Dân tộc miền núi', icon: '🏔️' },
                { id: 'photo360', name: 'Ảnh 360', icon: '🌐' }
            ];

            res.json({
                success: true,
                data: categories
            });
        } catch (error) {
            console.error('❌ Lỗi khi lấy danh mục:', error);
            res.status(500).json({
                success: false,
                message: 'Lỗi khi lấy danh sách danh mục',
                error: error.message
            });
        }
    }

    // Tin trending
    async getTrendingNews(req, res) {
        try {
            const limit = parseInt(req.query.limit) || 10;
            const Article = require('../models/Article');
            const articles = await Article.getTrending(limit);
            
            res.json({
                success: true,
                data: articles,
                count: articles.length
            });
        } catch (error) {
            console.error('❌ Lỗi khi lấy tin trending:', error);
            res.status(500).json({
                success: false,
                message: 'Lỗi khi lấy tin tức trending',
                error: error.message
            });
        }
    }

    // Tin nóng (breaking news)
    async getBreakingNews(req, res) {
        try {
            const limit = parseInt(req.query.limit) || 5;
            const Article = require('../models/Article');
            const articles = await Article.getBreakingNews(limit);
            
            res.json({
                success: true,
                data: articles,
                count: articles.length
            });
        } catch (error) {
            console.error('❌ Lỗi khi lấy tin nóng:', error);
            res.status(500).json({
                success: false,
                message: 'Lỗi khi lấy tin tức nóng',
                error: error.message
            });
        }
    }
}

module.exports = NewsController;
