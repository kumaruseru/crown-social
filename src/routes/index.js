const express = require('express');
const path = require('path');
const AuthRoutes = require('./AuthRoutes');
const PostRoutes = require('./PostRoutes');
const MessageRoutes = require('./MessageRoutes');
const SettingsRoutes = require('./SettingsRoutes');
const NewsRoutes = require('./NewsRoutes');

/**
 * Main Router - Tập hợp tất cả routes
 */
class MainRouter {
    constructor() {
        this.router = express.Router();
        this.initializeRoutes();
    }

    /**
     * Khởi tạo tất cả routes
     */
    initializeRoutes() {
        // Auth routes
        const authRoutes = new AuthRoutes();
        this.router.use('/', authRoutes.getRouter());

        // Post routes  
        const postRoutes = new PostRoutes();
        this.router.use('/api/posts', postRoutes.getRouter());
        
        // News routes
        const newsRoutes = new NewsRoutes();
        this.router.use('/api/news', newsRoutes.getRouter());
        
        // Message routes (End-to-end encrypted messaging)
        this.router.use('/api/messages', MessageRoutes);

        // Settings routes
        const settingsRoutes = new SettingsRoutes();
        this.router.use('/', settingsRoutes.getRouter());

        // Page routes for new layout pages
        this.router.get('/explore', (req, res) => {
            res.sendFile(path.join(__dirname, '../../views/explore.html'));
        });

        this.router.get('/news', (req, res) => {
            res.sendFile(path.join(__dirname, '../../views/news.html'));
        });

        this.router.get('/notifications', (req, res) => {
            res.sendFile(path.join(__dirname, '../../views/notifications.html'));
        });

        this.router.get('/maps', (req, res) => {
            res.sendFile(path.join(__dirname, '../../views/maps.html'));
        });

        // Health check route
        this.router.get('/health', (req, res) => {
            res.json({
                success: true,
                message: 'Crown Server is running',
                timestamp: new Date().toISOString(),
                uptime: process.uptime()
            });
        });

        // 404 handler for API routes
        this.router.use('/api/*', (req, res) => {
            res.status(404).json({
                success: false,
                message: 'API endpoint không tồn tại',
                timestamp: new Date().toISOString()
            });
        });

        console.log('✅ Main router đã được khởi tạo');
    }

    /**
     * Lấy router
     * @returns {express.Router}
     */
    getRouter() {
        return this.router;
    }
}

module.exports = MainRouter;
