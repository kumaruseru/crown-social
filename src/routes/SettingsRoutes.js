const express = require('express');
const path = require('path');
const SettingsMiddleware = require('../middleware/SettingsMiddleware');

/**
 * Settings Routes - Quản lý routes cho trang cài đặt
 */
class SettingsRoutes {
    constructor() {
        this.router = express.Router();
        this.initializeRoutes();
    }

    /**
     * Khởi tạo routes
     */
    initializeRoutes() {
        // Apply common middleware
        this.router.use('/api/settings', SettingsMiddleware.sanitizeInput);
        this.router.use('/api/settings', SettingsMiddleware.logSettingsChange);
        this.router.use('/api/settings', SettingsMiddleware.rateLimitSettings);

        // Main settings page
        this.router.get('/settings', this.renderSettingsPage.bind(this));
        
        // Settings API endpoints
        this.router.get('/api/settings', SettingsMiddleware.requireAuth, this.getSettings.bind(this));
        this.router.post('/api/settings', SettingsMiddleware.requireAuth, SettingsMiddleware.validateSettingsData, this.updateSettings.bind(this));
        this.router.post('/api/settings/account', SettingsMiddleware.requireAuth, SettingsMiddleware.validateAccountData, this.updateAccountSettings.bind(this));
        this.router.post('/api/settings/privacy', SettingsMiddleware.requireAuth, this.updatePrivacySettings.bind(this));
        this.router.post('/api/settings/notifications', SettingsMiddleware.requireAuth, this.updateNotificationSettings.bind(this));
        this.router.post('/api/settings/display', SettingsMiddleware.requireAuth, this.updateDisplaySettings.bind(this));
        this.router.post('/api/settings/advanced', SettingsMiddleware.requireAuth, this.updateAdvancedSettings.bind(this));
        
        // Developer API endpoints
        this.router.post('/api/settings/regenerate-api-key', SettingsMiddleware.requireAuth, this.regenerateApiKey.bind(this));
        this.router.post('/api/settings/test-webhook', SettingsMiddleware.requireAuth, SettingsMiddleware.validateWebhookUrl, this.testWebhook.bind(this));
        
        // Integration endpoints
        this.router.post('/api/settings/integrations/social/:platform', SettingsMiddleware.requireAuth, this.connectSocialMedia.bind(this));
        this.router.delete('/api/settings/integrations/social/:platform', SettingsMiddleware.requireAuth, this.disconnectSocialMedia.bind(this));
        this.router.post('/api/settings/integrations/cloud/:provider', SettingsMiddleware.requireAuth, this.connectCloudStorage.bind(this));
        this.router.delete('/api/settings/integrations/cloud/:provider', SettingsMiddleware.requireAuth, this.disconnectCloudStorage.bind(this));
        
        // Account management
        this.router.post('/api/settings/change-password', SettingsMiddleware.requireAuth, SettingsMiddleware.validatePasswordChange, this.changePassword.bind(this));
        this.router.post('/api/settings/delete-account', SettingsMiddleware.requireAuth, this.requestAccountDeletion.bind(this));
        this.router.get('/api/settings/login-sessions', SettingsMiddleware.requireAuth, this.getLoginSessions.bind(this));
        this.router.delete('/api/settings/login-sessions/:sessionId', SettingsMiddleware.requireAuth, this.logoutSession.bind(this));
        
        console.log('✅ Settings routes đã được khởi tạo');
    }

    /**
     * Render trang cài đặt
     */
    async renderSettingsPage(req, res) {
        try {
            res.sendFile(path.join(__dirname, '../../views/settings.html'));
        } catch (error) {
            console.error('Lỗi render settings page:', error);
            res.status(500).json({
                success: false,
                message: 'Không thể tải trang cài đặt'
            });
        }
    }

    /**
     * Lấy cài đặt người dùng
     */
    async getSettings(req, res) {
        try {
            // TODO: Lấy từ database
            const mockSettings = {
                account: {
                    firstName: 'An',
                    lastName: 'Nguyễn Văn',
                    username: 'username',
                    email: 'user@example.com',
                    bio: 'Chào mừng đến với trang của tôi!'
                },
                notifications: {
                    comments: true,
                    likes: true,
                    followers: false,
                    messages: true
                },
                display: {
                    theme: 'dark',
                    fontSize: 2,
                    accentColor: '#FBBF24'
                },
                advanced: {
                    preloadContent: true,
                    compressImages: true,
                    dataSaver: false,
                    language: 'vi',
                    timezone: 'Asia/Ho_Chi_Minh',
                    sensitiveContent: false,
                    autoplayVideo: true
                },
                developer: {
                    debugMode: false,
                    apiKey: 'cr_1234567890abcdef',
                    webhookUrl: '',
                    webhookEvents: {
                        newPost: false,
                        likes: false,
                        comments: false,
                        follows: false,
                        messages: false
                    }
                },
                integrations: {
                    socialMedia: {
                        twitter: { connected: false, username: '' },
                        facebook: { connected: false, username: '' },
                        linkedin: { connected: false, username: '' }
                    },
                    cloudStorage: {
                        googleDrive: { connected: false, quota: 0 },
                        oneDrive: { connected: false, quota: 0 }
                    }
                }
            };

            res.json({
                success: true,
                data: mockSettings
            });
        } catch (error) {
            console.error('Lỗi lấy settings:', error);
            res.status(500).json({
                success: false,
                message: 'Không thể lấy cài đặt'
            });
        }
    }

    /**
     * Cập nhật cài đặt chung
     */
    async updateSettings(req, res) {
        try {
            const { settings } = req.body;
            
            // TODO: Lưu vào database
            console.log('Cập nhật settings:', settings);

            res.json({
                success: true,
                message: 'Cài đặt đã được cập nhật'
            });
        } catch (error) {
            console.error('Lỗi cập nhật settings:', error);
            res.status(500).json({
                success: false,
                message: 'Không thể cập nhật cài đặt'
            });
        }
    }

    /**
     * Cập nhật thông tin tài khoản
     */
    async updateAccountSettings(req, res) {
        try {
            const { firstName, lastName, username, email, bio } = req.body;
            
            // TODO: Validate và lưu vào database
            console.log('Cập nhật account:', { firstName, lastName, username, email, bio });

            res.json({
                success: true,
                message: 'Thông tin tài khoản đã được cập nhật'
            });
        } catch (error) {
            console.error('Lỗi cập nhật account:', error);
            res.status(500).json({
                success: false,
                message: 'Không thể cập nhật thông tin tài khoản'
            });
        }
    }

    /**
     * Cập nhật cài đặt bảo mật
     */
    async updatePrivacySettings(req, res) {
        try {
            const { settings } = req.body;
            
            // TODO: Lưu vào database
            console.log('Cập nhật privacy settings:', settings);

            res.json({
                success: true,
                message: 'Cài đặt bảo mật đã được cập nhật'
            });
        } catch (error) {
            console.error('Lỗi cập nhật privacy settings:', error);
            res.status(500).json({
                success: false,
                message: 'Không thể cập nhật cài đặt bảo mật'
            });
        }
    }

    /**
     * Cập nhật cài đặt thông báo
     */
    async updateNotificationSettings(req, res) {
        try {
            const { notifications } = req.body;
            
            // TODO: Lưu vào database
            console.log('Cập nhật notification settings:', notifications);

            res.json({
                success: true,
                message: 'Cài đặt thông báo đã được cập nhật'
            });
        } catch (error) {
            console.error('Lỗi cập nhật notification settings:', error);
            res.status(500).json({
                success: false,
                message: 'Không thể cập nhật cài đặt thông báo'
            });
        }
    }

    /**
     * Cập nhật cài đặt giao diện
     */
    async updateDisplaySettings(req, res) {
        try {
            const { display } = req.body;
            
            // TODO: Lưu vào database
            console.log('Cập nhật display settings:', display);

            res.json({
                success: true,
                message: 'Cài đặt giao diện đã được cập nhật'
            });
        } catch (error) {
            console.error('Lỗi cập nhật display settings:', error);
            res.status(500).json({
                success: false,
                message: 'Không thể cập nhật cài đặt giao diện'
            });
        }
    }

    /**
     * Cập nhật cài đặt nâng cao
     */
    async updateAdvancedSettings(req, res) {
        try {
            const { advanced } = req.body;
            
            // TODO: Lưu vào database
            console.log('Cập nhật advanced settings:', advanced);

            res.json({
                success: true,
                message: 'Cài đặt nâng cao đã được cập nhật'
            });
        } catch (error) {
            console.error('Lỗi cập nhật advanced settings:', error);
            res.status(500).json({
                success: false,
                message: 'Không thể cập nhật cài đặt nâng cao'
            });
        }
    }

    /**
     * Tạo lại API key
     */
    async regenerateApiKey(req, res) {
        try {
            // Tạo API key mới
            const newApiKey = 'cr_' + Math.random().toString(36).substr(2, 16);
            
            // TODO: Lưu vào database và vô hiệu hóa key cũ
            console.log('Tạo API key mới:', newApiKey);

            res.json({
                success: true,
                data: { apiKey: newApiKey },
                message: 'API key mới đã được tạo'
            });
        } catch (error) {
            console.error('Lỗi tạo API key:', error);
            res.status(500).json({
                success: false,
                message: 'Không thể tạo API key mới'
            });
        }
    }

    /**
     * Test webhook
     */
    async testWebhook(req, res) {
        try {
            const { webhookUrl } = req.body;
            
            if (!webhookUrl) {
                return res.status(400).json({
                    success: false,
                    message: 'URL webhook không được để trống'
                });
            }

            // TODO: Gửi test webhook
            console.log('Test webhook:', webhookUrl);

            res.json({
                success: true,
                message: 'Webhook test thành công'
            });
        } catch (error) {
            console.error('Lỗi test webhook:', error);
            res.status(500).json({
                success: false,
                message: 'Webhook test thất bại'
            });
        }
    }

    /**
     * Kết nối mạng xã hội
     */
    async connectSocialMedia(req, res) {
        try {
            const { platform } = req.params;
            
            // TODO: Implement OAuth flow
            console.log('Kết nối social media:', platform);

            res.json({
                success: true,
                message: `Đã kết nối thành công với ${platform}`
            });
        } catch (error) {
            console.error('Lỗi kết nối social media:', error);
            res.status(500).json({
                success: false,
                message: 'Không thể kết nối mạng xã hội'
            });
        }
    }

    /**
     * Ngắt kết nối mạng xã hội
     */
    async disconnectSocialMedia(req, res) {
        try {
            const { platform } = req.params;
            
            // TODO: Revoke OAuth tokens
            console.log('Ngắt kết nối social media:', platform);

            res.json({
                success: true,
                message: `Đã ngắt kết nối với ${platform}`
            });
        } catch (error) {
            console.error('Lỗi ngắt kết nối social media:', error);
            res.status(500).json({
                success: false,
                message: 'Không thể ngắt kết nối mạng xã hội'
            });
        }
    }

    /**
     * Kết nối cloud storage
     */
    async connectCloudStorage(req, res) {
        try {
            const { provider } = req.params;
            
            // TODO: Implement OAuth flow
            console.log('Kết nối cloud storage:', provider);

            res.json({
                success: true,
                message: `Đã kết nối thành công với ${provider}`
            });
        } catch (error) {
            console.error('Lỗi kết nối cloud storage:', error);
            res.status(500).json({
                success: false,
                message: 'Không thể kết nối lưu trữ đám mây'
            });
        }
    }

    /**
     * Ngắt kết nối cloud storage
     */
    async disconnectCloudStorage(req, res) {
        try {
            const { provider } = req.params;
            
            // TODO: Revoke OAuth tokens
            console.log('Ngắt kết nối cloud storage:', provider);

            res.json({
                success: true,
                message: `Đã ngắt kết nối với ${provider}`
            });
        } catch (error) {
            console.error('Lỗi ngắt kết nối cloud storage:', error);
            res.status(500).json({
                success: false,
                message: 'Không thể ngắt kết nối lưu trữ đám mây'
            });
        }
    }

    /**
     * Đổi mật khẩu
     */
    async changePassword(req, res) {
        try {
            const { currentPassword, newPassword } = req.body;
            
            if (!currentPassword || !newPassword) {
                return res.status(400).json({
                    success: false,
                    message: 'Vui lòng điền đầy đủ thông tin'
                });
            }

            // TODO: Verify current password và update
            console.log('Đổi mật khẩu');

            res.json({
                success: true,
                message: 'Mật khẩu đã được thay đổi'
            });
        } catch (error) {
            console.error('Lỗi đổi mật khẩu:', error);
            res.status(500).json({
                success: false,
                message: 'Không thể đổi mật khẩu'
            });
        }
    }

    /**
     * Yêu cầu xóa tài khoản
     */
    async requestAccountDeletion(req, res) {
        try {
            // TODO: Tạo request xóa tài khoản
            console.log('Yêu cầu xóa tài khoản');

            res.json({
                success: true,
                message: 'Yêu cầu xóa tài khoản đã được gửi'
            });
        } catch (error) {
            console.error('Lỗi yêu cầu xóa tài khoản:', error);
            res.status(500).json({
                success: false,
                message: 'Không thể gửi yêu cầu xóa tài khoản'
            });
        }
    }

    /**
     * Lấy danh sách session đăng nhập
     */
    async getLoginSessions(req, res) {
        try {
            // TODO: Lấy từ database
            const mockSessions = [
                {
                    id: 1,
                    device: 'Chrome trên Windows 11',
                    location: 'TP. Hồ Chí Minh',
                    lastActive: new Date().toISOString(),
                    current: true,
                    ip: '192.168.1.1'
                },
                {
                    id: 2,
                    device: 'Safari trên iPhone',
                    location: 'Hà Nội',
                    lastActive: new Date(Date.now() - 86400000).toISOString(),
                    current: false,
                    ip: '192.168.1.2'
                }
            ];

            res.json({
                success: true,
                data: mockSessions
            });
        } catch (error) {
            console.error('Lỗi lấy login sessions:', error);
            res.status(500).json({
                success: false,
                message: 'Không thể lấy danh sách phiên đăng nhập'
            });
        }
    }

    /**
     * Đăng xuất session
     */
    async logoutSession(req, res) {
        try {
            const { sessionId } = req.params;
            
            // TODO: Invalidate session
            console.log('Đăng xuất session:', sessionId);

            res.json({
                success: true,
                message: 'Đã đăng xuất khỏi thiết bị'
            });
        } catch (error) {
            console.error('Lỗi đăng xuất session:', error);
            res.status(500).json({
                success: false,
                message: 'Không thể đăng xuất'
            });
        }
    }

    /**
     * Lấy router
     * @returns {express.Router}
     */
    getRouter() {
        return this.router;
    }
}

module.exports = SettingsRoutes;
