const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

/**
 * Security Middleware for Docker Environment
 * Cấu hình bảo mật cho ứng dụng Docker
 */
class SecurityMiddleware {
    
    /**
     * Cấu hình Helmet cho bảo mật headers
     */
    static getHelmetConfig() {
        return helmet({
            contentSecurityPolicy: {
                directives: {
                    defaultSrc: ["'self'"],
                    styleSrc: [
                        "'self'", 
                        "'unsafe-inline'", 
                        "https://fonts.googleapis.com",
                        "https://cdn.tailwindcss.com",
                        "https://unpkg.com"
                    ],
                    scriptSrc: [
                        "'self'", 
                        "'unsafe-inline'",
                        "https://cdn.tailwindcss.com",
                        "https://unpkg.com"
                    ],
                    fontSrc: [
                        "'self'", 
                        "https://fonts.gstatic.com"
                    ],
                    imgSrc: [
                        "'self'", 
                        "data:", 
                        "https:",
                        "blob:"
                    ],
                    connectSrc: [
                        "'self'",
                        "ws:",
                        "wss:",
                        "https://*.tile.openstreetmap.org"
                    ]
                }
            },
            hsts: {
                maxAge: 31536000,
                includeSubDomains: true,
                preload: true
            }
        });
    }

    /**
     * Rate limiting cho API endpoints
     */
    static getApiRateLimit() {
        return rateLimit({
            windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
            max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // limit each IP to 100 requests per windowMs
            message: {
                error: 'Too many requests from this IP, please try again later.',
                retryAfter: Math.ceil((parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000) / 1000)
            },
            standardHeaders: true,
            legacyHeaders: false,
            trustProxy: true // Trust proxy headers in Docker environment
        });
    }

    /**
     * Rate limiting cho login endpoints
     */
    static getLoginRateLimit() {
        return rateLimit({
            windowMs: 15 * 60 * 1000, // 15 minutes
            max: 5, // limit each IP to 5 login attempts per windowMs
            skipSuccessfulRequests: true,
            message: {
                error: 'Too many login attempts from this IP, please try again after 15 minutes.',
                retryAfter: 900
            },
            standardHeaders: true,
            legacyHeaders: false,
            trustProxy: true
        });
    }

    /**
     * Middleware để sanitize input
     */
    static sanitizeInput() {
        return (req, res, next) => {
            // Remove any potentially dangerous characters
            const sanitize = (obj) => {
                for (let key in obj) {
                    if (typeof obj[key] === 'string') {
                        obj[key] = obj[key]
                            .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
                            .replace(/javascript:/gi, '')
                            .replace(/vbscript:/gi, '')
                            .replace(/onload/gi, '')
                            .replace(/onerror/gi, '');
                    } else if (typeof obj[key] === 'object' && obj[key] !== null) {
                        sanitize(obj[key]);
                    }
                }
            };

            if (req.body) sanitize(req.body);
            if (req.query) sanitize(req.query);
            if (req.params) sanitize(req.params);

            next();
        };
    }

    /**
     * Middleware để log security events
     */
    static securityLogger() {
        return (req, res, next) => {
            // Log potential security issues
            const suspiciousPatterns = [
                /(\.\.\/)|(\.\.\\)/g, // Path traversal
                /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, // Script injection
                /union.*select/gi, // SQL injection
                /javascript:/gi, // JavaScript protocol
                /vbscript:/gi // VBScript protocol
            ];

            const checkSuspicious = (value) => {
                if (typeof value === 'string') {
                    return suspiciousPatterns.some(pattern => pattern.test(value));
                }
                return false;
            };

            // Check all input sources
            const allInputs = { ...req.body, ...req.query, ...req.params };
            const hasSuspiciousContent = Object.values(allInputs).some(checkSuspicious);

            if (hasSuspiciousContent) {
                console.warn(`🚨 Suspicious request detected from IP: ${req.ip}`);
                console.warn(`   URL: ${req.originalUrl}`);
                console.warn(`   User-Agent: ${req.get('User-Agent')}`);
                console.warn(`   Inputs:`, allInputs);
            }

            next();
        };
    }

    /**
     * Middleware để set security headers
     */
    static securityHeaders() {
        return (req, res, next) => {
            // Remove server information
            res.removeHeader('X-Powered-By');
            
            // Add custom security headers
            res.setHeader('X-Request-ID', req.id || 'unknown');
            res.setHeader('X-Response-Time', Date.now());
            
            next();
        };
    }
}

module.exports = SecurityMiddleware;
