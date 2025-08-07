const RSSService = require('./RSSService');
const Article = require('../models/Article');

class NewsService {
    constructor() {
        this.rssService = new RSSService();
        this.syncInterval = null;
        this.isRunning = false;
    }

    // Khởi động service đồng bộ tin tức
    async startNewsSync() {
        if (this.isRunning) {
            console.log('📰 News sync đã đang chạy');
            return;
        }

        console.log('🚀 Khởi động News Sync Service...');
        this.isRunning = true;

        // Đồng bộ ngay lập tức
        await this.syncAllNews();

        // Thiết lập đồng bộ định kỳ mỗi 30 phút
        this.syncInterval = setInterval(async () => {
            await this.syncAllNews();
        }, 30 * 60 * 1000);

        console.log('✅ News Sync Service đã khởi động');
    }

    // Dừng service đồng bộ
    stopNewsSync() {
        if (this.syncInterval) {
            clearInterval(this.syncInterval);
            this.syncInterval = null;
        }
        this.isRunning = false;
        console.log('⏹️ News Sync Service đã dừng');
    }

    // Đồng bộ tất cả tin tức
    async syncAllNews() {
        try {
            console.log('🔄 Bắt đầu đồng bộ tin tức từ tất cả nguồn RSS...');
            const startTime = Date.now();

            // Lấy tin mới nhất từ tất cả nguồn
            const latestNews = await this.rssService.getLatestNews(500);
            
            let newCount = 0;
            let updatedCount = 0;
            let errorCount = 0;

            // Xử lý từng bài tin
            for (const newsItem of latestNews) {
                try {
                    const result = await this.saveArticle(newsItem);
                    if (result.isNew) {
                        newCount++;
                    } else {
                        updatedCount++;
                    }
                } catch (error) {
                    errorCount++;
                    console.error(`❌ Lỗi khi lưu bài "${newsItem.title}":`, error.message);
                }
            }

            const duration = Date.now() - startTime;
            console.log(`✅ Hoàn thành đồng bộ tin tức:`);
            console.log(`   📊 Thống kê: ${newCount} mới, ${updatedCount} cập nhật, ${errorCount} lỗi`);
            console.log(`   ⏱️ Thời gian: ${Math.round(duration / 1000)}s`);

        } catch (error) {
            console.error('❌ Lỗi khi đồng bộ tin tức:', error);
        }
    }

    // Lưu bài viết vào database
    async saveArticle(newsItem) {
        try {
            // Kiểm tra xem bài đã tồn tại chưa
            let existingArticle = await Article.findOne({
                $or: [
                    { originalId: newsItem.id },
                    { link: newsItem.link },
                    { 
                        title: newsItem.title,
                        source: newsItem.source 
                    }
                ]
            });

            if (existingArticle) {
                // Cập nhật bài viết nếu có thay đổi
                const updated = await this.updateArticleIfChanged(existingArticle, newsItem);
                return { isNew: false, article: existingArticle, updated };
            }

            // Tạo bài viết mới
            const article = new Article({
                originalId: newsItem.id,
                title: newsItem.title,
                description: newsItem.description,
                content: newsItem.content,
                link: newsItem.link,
                source: newsItem.source,
                category: newsItem.category,
                author: newsItem.author,
                image: newsItem.image,
                tags: newsItem.tags || [],
                publishedAt: new Date(newsItem.pubDate),
                views: 0,
                likes: 0,
                shares: 0,
                isActive: true,
                isFeatured: false
            });

            await article.save();
            return { isNew: true, article };

        } catch (error) {
            console.error('❌ Lỗi khi lưu bài viết:', error);
            throw error;
        }
    }

    // Cập nhật bài viết nếu có thay đổi
    async updateArticleIfChanged(existingArticle, newsItem) {
        let hasChanges = false;
        const updates = {};

        // Kiểm tra các trường có thể thay đổi
        if (existingArticle.title !== newsItem.title) {
            updates.title = newsItem.title;
            hasChanges = true;
        }

        if (existingArticle.description !== newsItem.description) {
            updates.description = newsItem.description;
            hasChanges = true;
        }

        if (existingArticle.content !== newsItem.content) {
            updates.content = newsItem.content;
            hasChanges = true;
        }

        if (existingArticle.image !== newsItem.image && newsItem.image) {
            updates.image = newsItem.image;
            hasChanges = true;
        }

        if (hasChanges) {
            updates.updatedAt = new Date();
            await Article.findByIdAndUpdate(existingArticle._id, updates);
            console.log(`🔄 Cập nhật bài viết: ${existingArticle.title}`);
            return true;
        }

        return false;
    }

    // Lấy tin tức theo danh mục
    async getNewsByCategory(category, page = 1, limit = 20) {
        const skip = (page - 1) * limit;
        
        const articles = await Article.find({ 
            category: category,
            isActive: true 
        })
        .sort({ publishedAt: -1 })
        .skip(skip)
        .limit(limit)
        .select('-content'); // Không lấy content đầy đủ cho danh sách

        const total = await Article.countDocuments({ 
            category: category,
            isActive: true 
        });

        return {
            articles,
            total,
            page,
            totalPages: Math.ceil(total / limit),
            hasNext: page * limit < total,
            hasPrev: page > 1
        };
    }

    // Lấy tin tức mới nhất
    async getLatestNews(limit = 20) {
        return await Article.find({ isActive: true })
            .sort({ publishedAt: -1 })
            .limit(limit)
            .select('-content');
    }

    // Lấy tin tức nổi bật
    async getFeaturedNews(limit = 10) {
        return await Article.find({ 
            isFeatured: true,
            isActive: true 
        })
        .sort({ publishedAt: -1 })
        .limit(limit)
        .select('-content');
    }

    // Lấy tin tức phổ biến (nhiều view nhất)
    async getPopularNews(limit = 10) {
        return await Article.find({ isActive: true })
            .sort({ views: -1, publishedAt: -1 })
            .limit(limit)
            .select('-content');
    }

    // Tìm kiếm tin tức
    async searchNews(query, page = 1, limit = 20) {
        const skip = (page - 1) * limit;
        
        const searchRegex = new RegExp(query, 'i');
        const filter = {
            isActive: true,
            $or: [
                { title: searchRegex },
                { description: searchRegex },
                { tags: { $in: [searchRegex] } }
            ]
        };

        const articles = await Article.find(filter)
            .sort({ publishedAt: -1 })
            .skip(skip)
            .limit(limit)
            .select('-content');

        const total = await Article.countDocuments(filter);

        return {
            articles,
            total,
            page,
            totalPages: Math.ceil(total / limit),
            hasNext: page * limit < total,
            hasPrev: page > 1,
            query
        };
    }

    // Lấy bài viết đầy đủ theo ID
    async getArticleById(id) {
        const article = await Article.findById(id);
        if (article) {
            // Tăng số lượt xem
            await Article.findByIdAndUpdate(id, { $inc: { views: 1 } });
        }
        return article;
    }

    // Lấy bài viết liên quan
    async getRelatedArticles(articleId, limit = 5) {
        const article = await Article.findById(articleId);
        if (!article) return [];

        return await Article.find({
            _id: { $ne: articleId },
            $or: [
                { category: article.category },
                { tags: { $in: article.tags } },
                { source: article.source }
            ],
            isActive: true
        })
        .sort({ publishedAt: -1 })
        .limit(limit)
        .select('-content');
    }

    // Lấy thống kê tin tức
    async getNewsStatistics() {
        const total = await Article.countDocuments({ isActive: true });
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const todayCount = await Article.countDocuments({
            isActive: true,
            createdAt: { $gte: today }
        });

        const categoryStats = await Article.aggregate([
            { $match: { isActive: true } },
            { $group: { _id: '$category', count: { $sum: 1 } } },
            { $sort: { count: -1 } }
        ]);

        const sourceStats = await Article.aggregate([
            { $match: { isActive: true } },
            { $group: { _id: '$source', count: { $sum: 1 } } },
            { $sort: { count: -1 } }
        ]);

        return {
            total,
            todayCount,
            categoryStats,
            sourceStats,
            rssStats: this.rssService.getStatistics()
        };
    }

    // Đồng bộ tin theo danh mục cụ thể
    async syncNewsByCategory(category) {
        try {
            console.log(`🔄 Đồng bộ tin tức danh mục: ${category}`);
            const categoryNews = await this.rssService.getFeedsByCategory(category, 100);
            
            let newCount = 0;
            for (const newsItem of categoryNews) {
                try {
                    const result = await this.saveArticle(newsItem);
                    if (result.isNew) newCount++;
                } catch (error) {
                    console.error(`❌ Lỗi khi lưu bài tin ${category}:`, error.message);
                }
            }

            console.log(`✅ Đồng bộ ${category}: ${newCount} bài mới`);
            return newCount;
            
        } catch (error) {
            console.error(`❌ Lỗi khi đồng bộ danh mục ${category}:`, error);
            throw error;
        }
    }

    // Làm sạch tin tức cũ (xóa tin cũ hơn 30 ngày)
    async cleanupOldNews(daysOld = 30) {
        try {
            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - daysOld);

            const result = await Article.deleteMany({
                publishedAt: { $lt: cutoffDate },
                views: { $lt: 10 }, // Chỉ xóa tin ít người đọc
                likes: { $lt: 5 }
            });

            console.log(`🗑️ Đã xóa ${result.deletedCount} bài tin cũ (>${daysOld} ngày)`);
            return result.deletedCount;

        } catch (error) {
            console.error('❌ Lỗi khi dọn dẹp tin tức cũ:', error);
            throw error;
        }
    }
}

module.exports = NewsService;
