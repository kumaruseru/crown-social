const express = require('express');
const path = require('path');
const AuthRoutes = require('./AuthRoutes');
const PostRoutes = require('./PostRoutes');
const MessageRoutes = require('./MessageRoutes');
const SettingsRoutes = require('./SettingsRoutes');
const NewsRoutes = require('./NewsRoutes');
const IntegrationRoutes = require('./IntegrationRoutes');
const friendsRouter = require('./friends');

/**
 * Enhanced Main Router - All routes including social features
 */
class MainRouter {
    constructor() {
        this.router = express.Router();
        this.initializeRoutes();
    }

    /**
     * Initialize all routes
     */
    initializeRoutes() {
        // Auth routes
        const authRoutes = new AuthRoutes();
        this.router.use('/', authRoutes.getRouter());

        // API routes - must be placed BEFORE 404 handler
        
        // Social features routes
        this.router.use('/api/friends', friendsRouter);
        
        // Post routes with enhanced social features
        const postRoutes = new PostRoutes();
        this.router.use('/api/posts', postRoutes.getRouter());
        
        // Posts status endpoint
        this.router.get('/api/posts/status', (req, res) => {
            res.json({
                success: true,
                service: 'Posts Service',
                status: 'active',
                timestamp: new Date().toISOString(),
                endpoints: ['/api/posts', '/api/posts/status']
            });
        });
        
        // News routes
        const newsRoutes = new NewsRoutes();
        this.router.use('/api/news', newsRoutes.getRouter());
        
        // News status endpoint
        this.router.get('/api/news/status', (req, res) => {
            res.json({
                success: true,
                service: 'News Service',
                status: 'active',
                timestamp: new Date().toISOString(),
                endpoints: ['/api/news', '/api/news/status']
            });
        });
        
        // Message routes (End-to-end encrypted messaging)
        this.router.use('/api/messages', MessageRoutes);

        // Settings routes
        const settingsRoutes = new SettingsRoutes();
        this.router.use('/', settingsRoutes.getRouter());

        // Integration routes (Multi-language Integration)
        const integrationRoutes = new IntegrationRoutes();
        this.router.use('/api/integration', integrationRoutes.getRouter());
        this.router.use('/api/native', integrationRoutes.getRouter()); 
        this.router.use('/api/orchestrator', integrationRoutes.getRouter());

        // Test endpoints for stress testing (conditionally loaded)
        if (process.env.NODE_ENV === 'test' || process.env.ENABLE_TEST_ENDPOINTS === 'true') {
            const TestEndpoints = require('./TestEndpoints');
            this.router.use('/', TestEndpoints);
            console.log('🧪 Test endpoints loaded for stress testing');
        }

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

        // Auth page routes
        this.router.get('/login.html', (req, res) => {
            res.sendFile(path.join(__dirname, '../../views/login.html'));
        });

        this.router.get('/register.html', (req, res) => {
            res.sendFile(path.join(__dirname, '../../views/register.html'));
        });

        // Health check route with enhanced info
        this.router.get('/health', (req, res) => {
            res.json({
                success: true,
                message: 'Crown Social Network Server is running',
                timestamp: new Date().toISOString(),
                uptime: process.uptime(),
                features: {
                    socialFeatures: true,
                    friendSystem: true,
                    activityFeed: true,
                    realTimeMessaging: true,
                    newsSystem: true
                }
            });
        });

        // API Status endpoints for testing
        this.router.get('/api/auth/status', (req, res) => {
            res.json({
                success: true,
                service: 'Authentication Service',
                status: 'active',
                timestamp: new Date().toISOString()
            });
        });

        this.router.get('/api/users/status', (req, res) => {
            res.json({
                success: true,
                service: 'User Service',
                status: 'active',
                timestamp: new Date().toISOString()
            });
        });

        this.router.get('/api/gdpr/status', (req, res) => {
            res.json({
                success: true,
                service: 'GDPR Compliance Service',
                status: 'active',
                timestamp: new Date().toISOString()
            });
        });

        this.router.get('/api/settings/status', (req, res) => {
            res.json({
                success: true,
                service: 'Settings Service',
                status: 'active',
                timestamp: new Date().toISOString()
            });
        });

        // 404 handler for API routes - MUST BE PLACED LAST
        this.router.use('/api/*', (req, res) => {
            res.status(404).json({
                success: false,
                message: 'API endpoint not found',
                timestamp: new Date().toISOString()
            });
        });

        console.log('✅ Enhanced Main router initialized with social features');
    }

    /**
     * Get router instance
     * @returns {express.Router}
     */
    getRouter() {
        return this.router;
    }
}

module.exports = MainRouter;
