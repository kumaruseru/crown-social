const jwt = require('jsonwebtoken');
const SecurityUtils = require('../utils/SecurityUtils');
const User = require('../models/User');

/**
 * Enhanced Authentication Middleware
 * Middleware xác thực nâng cao với JWT và security features
 */
class EnhancedAuthMiddleware {

    /**
     * Authenticate JWT Token with enhanced security
     * @param {Object} req 
     * @param {Object} res 
     * @param {Function} next 
     */
    static async authenticateToken(req, res, next) {
        try {
            const authHeader = req.headers['authorization'];
            const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

            if (!token) {
                return res.status(401).json({
                    success: false,
                    message: 'Token xác thực không được cung cấp',
                    code: 'NO_TOKEN'
                });
            }

            // Verify JWT token
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            
            // Check if user still exists
            const user = await User.findById(decoded.userId);
            if (!user) {
                return res.status(401).json({
                    success: false,
                    message: 'Người dùng không tồn tại',
                    code: 'USER_NOT_FOUND'
                });
            }

            // Check if user is active
            if (!user.isActive) {
                return res.status(401).json({
                    success: false,
                    message: 'Tài khoản đã bị vô hiệu hóa',
                    code: 'ACCOUNT_DISABLED'
                });
            }

            // Check token expiration more strictly
            const tokenAge = Date.now() - decoded.iat * 1000;
            const maxAge = 15 * 60 * 1000; // 15 minutes
            
            if (tokenAge > maxAge) {
                return res.status(401).json({
                    success: false,
                    message: 'Token đã hết hạn',
                    code: 'TOKEN_EXPIRED'
                });
            }

            // Attach user to request
            req.user = user;
            req.tokenPayload = decoded;

            next();
        } catch (error) {
            if (error.name === 'JsonWebTokenError') {
                return res.status(401).json({
                    success: false,
                    message: 'Token không hợp lệ',
                    code: 'INVALID_TOKEN'
                });
            }
            
            if (error.name === 'TokenExpiredError') {
                return res.status(401).json({
                    success: false,
                    message: 'Token đã hết hạn',
                    code: 'TOKEN_EXPIRED'
                });
            }

            console.error('Auth middleware error:', error);
            return res.status(500).json({
                success: false,
                message: 'Lỗi xác thực',
                code: 'AUTH_ERROR'
            });
        }
    }

    /**
     * Enhanced session authentication
     * @param {Object} req 
     * @param {Object} res 
     * @param {Function} next 
     */
    static requireAuth(req, res, next) {
        // Check session authentication first
        if (!req.isAuthenticated || !req.isAuthenticated()) {
            return res.status(401).json({
                success: false,
                message: 'Vui lòng đăng nhập để truy cập',
                code: 'NOT_AUTHENTICATED',
                redirect: '/login.html'
            });
        }

        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Phiên đăng nhập không hợp lệ',
                code: 'INVALID_SESSION'
            });
        }

        // Check if user is still active
        if (!req.user.isActive) {
            req.logout(() => {
                return res.status(401).json({
                    success: false,
                    message: 'Tài khoản đã bị vô hiệu hóa',
                    code: 'ACCOUNT_DISABLED',
                    redirect: '/login.html'
                });
            });
            return;
        }

        next();
    }

    /**
     * Enhanced admin role check
     * @param {Object} req 
     * @param {Object} res 
     * @param {Function} next 
     */
    static requireAdmin(req, res, next) {
        this.requireAuth(req, res, () => {
            if (req.user.role !== 'admin') {
                return res.status(403).json({
                    success: false,
                    message: 'Không có quyền truy cập chức năng này',
                    code: 'INSUFFICIENT_PERMISSIONS'
                });
            }

            // Log admin access
            console.log(`🔐 Admin access: ${req.user.email} - ${req.method} ${req.originalUrl} - IP: ${req.ip}`);
            
            next();
        });
    }

    /**
     * Enhanced rate limiting with multiple strategies
     * @param {Object} options 
     * @returns {Function}
     */
    static enhancedRateLimit(options = {}) {
        const {
            windowMs = 15 * 60 * 1000, // 15 minutes
            max = 100,
            skipSuccessfulRequests = false,
            keyGenerator = (req) => req.user?.id || req.ip
        } = options;

        const requestCounts = new Map();

        return (req, res, next) => {
            const key = keyGenerator(req);
            const now = Date.now();
            const windowStart = now - windowMs;

            if (!requestCounts.has(key)) {
                requestCounts.set(key, []);
            }

            const requests = requestCounts.get(key);

            // Remove old requests outside window
            while (requests.length > 0 && requests[0].timestamp < windowStart) {
                requests.shift();
            }

            // Count failed requests more heavily
            const failedRequests = requests.filter(r => r.failed).length;
            const adjustedCount = requests.length + failedRequests;

            if (adjustedCount >= max) {
                // Log suspicious activity
                console.warn(`🚨 Rate limit exceeded: ${key} - ${req.originalUrl}`);
                
                return res.status(429).json({
                    success: false,
                    message: 'Quá nhiều request, vui lòng thử lại sau',
                    code: 'RATE_LIMIT_EXCEEDED',
                    retryAfter: Math.ceil(windowMs / 1000)
                });
            }

            // Track this request
            const requestInfo = {
                timestamp: now,
                url: req.originalUrl,
                failed: false
            };

            requests.push(requestInfo);
            requestCounts.set(key, requests);

            // Mark as failed if response is error
            res.on('finish', () => {
                if (res.statusCode >= 400 && !skipSuccessfulRequests) {
                    requestInfo.failed = true;
                }
            });

            next();
        };
    }

    /**
     * CSRF Protection middleware
     * @param {Object} req 
     * @param {Object} res 
     * @param {Function} next 
     */
    static csrfProtection(req, res, next) {
        // Skip CSRF for safe methods
        if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
            return next();
        }

        // Generate CSRF token if not exists
        if (!req.session.csrfToken) {
            req.session.csrfToken = SecurityUtils.generateCSRFToken();
        }

        const token = req.headers['x-csrf-token'] || req.body._csrf;
        
        if (!token) {
            return res.status(403).json({
                success: false,
                message: 'CSRF token missing',
                code: 'CSRF_TOKEN_MISSING'
            });
        }

        if (!SecurityUtils.verifyCSRFToken(token, req.session.csrfToken)) {
            return res.status(403).json({
                success: false,
                message: 'Invalid CSRF token',
                code: 'INVALID_CSRF_TOKEN'
            });
        }

        next();
    }

    /**
     * API Key authentication
     * @param {Object} req 
     * @param {Object} res 
     * @param {Function} next 
     */
    static async authenticateApiKey(req, res, next) {
        try {
            const apiKey = req.headers['x-api-key'];
            
            if (!apiKey) {
                return res.status(401).json({
                    success: false,
                    message: 'API key required',
                    code: 'API_KEY_MISSING'
                });
            }

            // In production, you should store hashed API keys in database
            // This is a simplified example
            const hashedKey = process.env.API_KEY_HASH;
            
            if (!hashedKey || !SecurityUtils.verifyApiKey(apiKey, hashedKey)) {
                // Log failed API key attempt
                console.warn(`🔑 Invalid API key attempt from IP: ${req.ip}`);
                
                return res.status(401).json({
                    success: false,
                    message: 'Invalid API key',
                    code: 'INVALID_API_KEY'
                });
            }

            next();
        } catch (error) {
            console.error('API key auth error:', error);
            return res.status(500).json({
                success: false,
                message: 'API authentication error',
                code: 'API_AUTH_ERROR'
            });
        }
    }

    /**
     * Security headers middleware
     * @param {Object} req 
     * @param {Object} res 
     * @param {Function} next 
     */
    static securityHeaders(req, res, next) {
        // Remove server information
        res.removeHeader('X-Powered-By');
        
        // Add security headers
        res.setHeader('X-Content-Type-Options', 'nosniff');
        res.setHeader('X-Frame-Options', 'DENY');
        res.setHeader('X-XSS-Protection', '1; mode=block');
        res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
        res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
        
        // HSTS in production
        if (process.env.NODE_ENV === 'production') {
            res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
        }

        next();
    }

    /**
     * Request sanitization middleware
     * @param {Object} req 
     * @param {Object} res 
     * @param {Function} next 
     */
    static sanitizeInput(req, res, next) {
        try {
            // Sanitize request body
            if (req.body && typeof req.body === 'object') {
                req.body = SecurityUtils.sanitizeInput(req.body);
            }

            // Sanitize query parameters
            if (req.query && typeof req.query === 'object') {
                req.query = SecurityUtils.sanitizeInput(req.query);
            }

            // Sanitize URL parameters
            if (req.params && typeof req.params === 'object') {
                req.params = SecurityUtils.sanitizeInput(req.params);
            }

            next();
        } catch (error) {
            console.error('Input sanitization error:', error);
            return res.status(400).json({
                success: false,
                message: 'Invalid input format',
                code: 'INVALID_INPUT'
            });
        }
    }

    /**
     * Security audit logging
     * @param {Object} req 
     * @param {Object} res 
     * @param {Function} next 
     */
    static auditLog(req, res, next) {
        const startTime = Date.now();
        
        // Log request details
        const logData = {
            timestamp: new Date().toISOString(),
            method: req.method,
            url: req.originalUrl,
            ip: req.ip,
            userAgent: req.get('User-Agent'),
            userId: req.user?.id,
            sessionId: req.sessionID
        };

        // Log response details
        res.on('finish', () => {
            logData.statusCode = res.statusCode;
            logData.responseTime = Date.now() - startTime;

            // Log security-relevant requests
            if (req.originalUrl.includes('/login') || 
                req.originalUrl.includes('/register') || 
                req.originalUrl.includes('/admin') ||
                res.statusCode >= 400) {
                console.log('🔍 Security Audit:', JSON.stringify(logData));
            }
        });

        next();
    }
}

module.exports = EnhancedAuthMiddleware;
