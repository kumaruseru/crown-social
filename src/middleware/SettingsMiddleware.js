/**
 * Settings Middleware - Xử lý middleware cho trang cài đặt
 */
class SettingsMiddleware {
    /**
     * Middleware kiểm tra quyền truy cập settings
     */
    static requireAuth(req, res, next) {
        // TODO: Implement authentication check
        // For now, just pass through
        if (req.session && req.session.user) {
            next();
        } else {
            res.status(401).json({
                success: false,
                message: 'Bạn cần đăng nhập để truy cập cài đặt'
            });
        }
    }

    /**
     * Middleware validate settings data
     */
    static validateSettingsData(req, res, next) {
        try {
            const { body } = req;
            
            // Validate notification settings
            if (body.notifications) {
                const validNotificationKeys = ['comments', 'likes', 'followers', 'messages'];
                for (const key in body.notifications) {
                    if (!validNotificationKeys.includes(key)) {
                        return res.status(400).json({
                            success: false,
                            message: `Cài đặt thông báo không hợp lệ: ${key}`
                        });
                    }
                }
            }

            // Validate display settings
            if (body.display) {
                if (body.display.theme && !['light', 'dark', 'system'].includes(body.display.theme)) {
                    return res.status(400).json({
                        success: false,
                        message: 'Chủ đề không hợp lệ'
                    });
                }
                
                if (body.display.fontSize && (body.display.fontSize < 1 || body.display.fontSize > 3)) {
                    return res.status(400).json({
                        success: false,
                        message: 'Cỡ chữ không hợp lệ'
                    });
                }
            }

            // Validate advanced settings
            if (body.advanced) {
                const validLanguages = ['vi', 'en', 'zh', 'ja', 'ko'];
                if (body.advanced.language && !validLanguages.includes(body.advanced.language)) {
                    return res.status(400).json({
                        success: false,
                        message: 'Ngôn ngữ không được hỗ trợ'
                    });
                }
            }

            next();
        } catch (error) {
            console.error('Lỗi validate settings:', error);
            res.status(400).json({
                success: false,
                message: 'Dữ liệu cài đặt không hợp lệ'
            });
        }
    }

    /**
     * Middleware validate account update
     */
    static validateAccountData(req, res, next) {
        try {
            const { firstName, lastName, username, email, bio } = req.body;

            // Validate required fields
            if (!firstName || !lastName || !username || !email) {
                return res.status(400).json({
                    success: false,
                    message: 'Vui lòng điền đầy đủ thông tin bắt buộc'
                });
            }

            // Validate email format
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                return res.status(400).json({
                    success: false,
                    message: 'Email không hợp lệ'
                });
            }

            // Validate username format
            const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
            if (!usernameRegex.test(username)) {
                return res.status(400).json({
                    success: false,
                    message: 'Username phải từ 3-20 ký tự, chỉ chứa chữ, số và dấu gạch dưới'
                });
            }

            // Validate bio length
            if (bio && bio.length > 500) {
                return res.status(400).json({
                    success: false,
                    message: 'Tiểu sử không được vượt quá 500 ký tự'
                });
            }

            next();
        } catch (error) {
            console.error('Lỗi validate account data:', error);
            res.status(400).json({
                success: false,
                message: 'Dữ liệu tài khoản không hợp lệ'
            });
        }
    }

    /**
     * Middleware validate password change
     */
    static validatePasswordChange(req, res, next) {
        try {
            const { currentPassword, newPassword, confirmPassword } = req.body;

            if (!currentPassword || !newPassword || !confirmPassword) {
                return res.status(400).json({
                    success: false,
                    message: 'Vui lòng điền đầy đủ thông tin mật khẩu'
                });
            }

            if (newPassword !== confirmPassword) {
                return res.status(400).json({
                    success: false,
                    message: 'Mật khẩu xác nhận không khớp'
                });
            }

            if (newPassword.length < 6) {
                return res.status(400).json({
                    success: false,
                    message: 'Mật khẩu mới phải có ít nhất 6 ký tự'
                });
            }

            // Check password strength
            const hasUpperCase = /[A-Z]/.test(newPassword);
            const hasLowerCase = /[a-z]/.test(newPassword);
            const hasNumbers = /\d/.test(newPassword);
            const hasNonalphas = /\W/.test(newPassword);

            if (!(hasUpperCase && hasLowerCase && hasNumbers)) {
                return res.status(400).json({
                    success: false,
                    message: 'Mật khẩu phải chứa ít nhất 1 chữ hoa, 1 chữ thường và 1 số'
                });
            }

            next();
        } catch (error) {
            console.error('Lỗi validate password:', error);
            res.status(400).json({
                success: false,
                message: 'Dữ liệu mật khẩu không hợp lệ'
            });
        }
    }

    /**
     * Middleware validate webhook URL
     */
    static validateWebhookUrl(req, res, next) {
        try {
            const { webhookUrl } = req.body;

            if (!webhookUrl) {
                return res.status(400).json({
                    success: false,
                    message: 'URL webhook không được để trống'
                });
            }

            // Validate URL format
            try {
                new URL(webhookUrl);
            } catch (error) {
                return res.status(400).json({
                    success: false,
                    message: 'URL webhook không hợp lệ'
                });
            }

            // Check if URL is HTTPS
            if (!webhookUrl.startsWith('https://')) {
                return res.status(400).json({
                    success: false,
                    message: 'URL webhook phải sử dụng HTTPS'
                });
            }

            next();
        } catch (error) {
            console.error('Lỗi validate webhook URL:', error);
            res.status(400).json({
                success: false,
                message: 'URL webhook không hợp lệ'
            });
        }
    }

    /**
     * Middleware rate limiting cho API calls
     */
    static rateLimitSettings(req, res, next) {
        // TODO: Implement rate limiting
        // For now, just pass through
        next();
    }

    /**
     * Middleware log settings changes
     */
    static logSettingsChange(req, res, next) {
        const originalSend = res.send;
        
        res.send = function(data) {
            // Log successful settings changes
            if (res.statusCode >= 200 && res.statusCode < 300) {
                console.log(`[SETTINGS] ${req.method} ${req.path} - Success`, {
                    userId: req.session?.user?.id || 'anonymous',
                    timestamp: new Date().toISOString(),
                    userAgent: req.headers['user-agent'],
                    ip: req.ip
                });
            }
            
            originalSend.call(this, data);
        };
        
        next();
    }

    /**
     * Middleware sanitize input data
     */
    static sanitizeInput(req, res, next) {
        try {
            // Remove any potentially dangerous characters
            const sanitizeString = (str) => {
                if (typeof str !== 'string') return str;
                return str.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
                         .replace(/javascript:/gi, '')
                         .replace(/on\w+\s*=/gi, '');
            };

            const sanitizeObject = (obj) => {
                if (typeof obj !== 'object' || obj === null) return obj;
                
                for (const key in obj) {
                    if (typeof obj[key] === 'string') {
                        obj[key] = sanitizeString(obj[key]);
                    } else if (typeof obj[key] === 'object') {
                        sanitizeObject(obj[key]);
                    }
                }
                return obj;
            };

            req.body = sanitizeObject(req.body);
            next();
        } catch (error) {
            console.error('Lỗi sanitize input:', error);
            res.status(400).json({
                success: false,
                message: 'Dữ liệu đầu vào không hợp lệ'
            });
        }
    }
}

module.exports = SettingsMiddleware;
