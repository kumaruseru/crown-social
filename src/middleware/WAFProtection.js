const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const { body, validationResult } = require('express-validator');

/**
 * WAF (Web Application Firewall) Protection Middleware
 * Cung cấp bảo vệ toàn diện chống lại các cuộc tấn công web
 */
class WAFProtection {
    constructor(options = {}) {
        this.options = {
            enabled: process.env.WAF_ENABLED === 'true' || true,
            blockSuspiciousIPs: process.env.WAF_BLOCK_SUSPICIOUS_IPS === 'true' || true,
            sqlInjectionProtection: process.env.WAF_SQL_INJECTION_PROTECTION === 'true' || true,
            xssProtection: process.env.WAF_XSS_PROTECTION === 'true' || true,
            rateLimiting: process.env.WAF_RATE_LIMITING === 'true' || true,
            ...options
        };

        this.suspiciousIPs = new Set();
        this.attackPatterns = {
            sqlInjection: [
                /(\s*(union|select|insert|delete|update|drop|create|alter|exec|execute)\s+)/i,
                /(\s*(or|and)\s+1\s*=\s*1)/i,
                /(\s*'\s*(or|and)\s*'[^']*'\s*=\s*')/i,
                /(script[\s\S]*?>)/i
            ],
            xss: [
                /<script[\s\S]*?>[\s\S]*?<\/script>/gi,
                /javascript:/gi,
                /on\w+\s*=/gi,
                /<iframe[\s\S]*?>/gi,
                /<object[\s\S]*?>/gi,
                /<embed[\s\S]*?>/gi
            ],
            pathTraversal: [
                /\.\.\//g,
                /\.\.\\/g,
                /%2e%2e%2f/gi,
                /%2e%2e%5c/gi
            ]
        };

        console.log('🛡️  WAF Protection initialized with security rules');
    }

    /**
     * Initialize WAF Protection
     */
    async initialize() {
        console.log('🛡️  WAF Protection services started');
        return Promise.resolve();
    }

    /**
     * Main WAF middleware
     */
    protect() {
        return (req, res, next) => {
            if (!this.options.enabled) {
                return next();
            }

            try {
                // Skip WAF for health checks and static files
                const skipPaths = ['/health', '/favicon.ico', '/robots.txt', '/', '/login.html', '/register.html'];
                if (skipPaths.includes(req.path) || req.path.startsWith('/css/') || req.path.startsWith('/js/') || req.path.startsWith('/images/')) {
                    return next();
                }

                // Check IP reputation
                if (this.options.blockSuspiciousIPs && this.isIPSuspicious(req.ip)) {
                    this.logSecurityEvent('BLOCKED_SUSPICIOUS_IP', req);
                    return res.status(403).json({
                        error: 'Access denied - suspicious activity detected',
                        code: 'WAF_IP_BLOCKED'
                    });
                }

                // Check for attack patterns (only for API endpoints)
                if (req.path.startsWith('/api/')) {
                    const attackDetected = this.detectAttacks(req);
                    if (attackDetected) {
                        this.blockIP(req.ip);
                        this.logSecurityEvent('ATTACK_DETECTED', req, attackDetected);
                        return res.status(400).json({
                            error: 'Malicious request detected',
                            code: 'WAF_ATTACK_BLOCKED',
                            type: attackDetected.type
                        });
                    }
                }

                // Add security headers
                this.addSecurityHeaders(req, res);

                next();

            } catch (error) {
                console.error('❌ WAF Protection error:', error);
                next();
            }
        };
    }

    /**
     * Rate limiting middleware
     */
    getRateLimiter() {
        if (!this.options.rateLimiting) {
            return (req, res, next) => next();
        }

        return rateLimit({
            windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
            max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
            message: {
                error: 'Too many requests from this IP',
                code: 'WAF_RATE_LIMITED',
                resetTime: new Date(Date.now() + 15 * 60 * 1000)
            },
            standardHeaders: true,
            legacyHeaders: false,
            handler: (req, res) => {
                this.logSecurityEvent('RATE_LIMITED', req);
                res.status(429).json({
                    error: 'Rate limit exceeded',
                    code: 'WAF_RATE_LIMITED'
                });
            }
        });
    }

    /**
     * Enhanced Helmet configuration
     */
    getHelmetConfig() {
        return helmet({
            contentSecurityPolicy: {
                directives: {
                    defaultSrc: ["'self'"],
                    styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
                    fontSrc: ["'self'", "https://fonts.gstatic.com"],
                    scriptSrc: ["'self'", "'unsafe-inline'"],
                    imgSrc: ["'self'", "data:", "https:"],
                    connectSrc: ["'self'"],
                    frameSrc: ["'none'"],
                    objectSrc: ["'none'"]
                }
            },
            hsts: {
                maxAge: parseInt(process.env.HSTS_MAX_AGE) || 31536000,
                includeSubDomains: true,
                preload: true
            },
            noSniff: true,
            xssFilter: true,
            referrerPolicy: { policy: 'same-origin' }
        });
    }

    /**
     * Detect attack patterns in request
     */
    detectAttacks(req) {
        const testData = [
            req.url,
            JSON.stringify(req.query),
            JSON.stringify(req.body),
            req.get('User-Agent') || '',
            req.get('Referer') || ''
        ].join(' ');

        // SQL Injection Detection
        if (this.options.sqlInjectionProtection) {
            for (const pattern of this.attackPatterns.sqlInjection) {
                if (pattern.test(testData)) {
                    return { type: 'SQL_INJECTION', pattern: pattern.source };
                }
            }
        }

        // XSS Detection
        if (this.options.xssProtection) {
            for (const pattern of this.attackPatterns.xss) {
                if (pattern.test(testData)) {
                    return { type: 'XSS', pattern: pattern.source };
                }
            }
        }

        // Path Traversal Detection
        for (const pattern of this.attackPatterns.pathTraversal) {
            if (pattern.test(testData)) {
                return { type: 'PATH_TRAVERSAL', pattern: pattern.source };
            }
        }

        return null;
    }

    /**
     * Check if IP is suspicious
     */
    isIPSuspicious(ip) {
        return this.suspiciousIPs.has(ip);
    }

    /**
     * Block an IP address
     */
    blockIP(ip) {
        this.suspiciousIPs.add(ip);
        console.log(`🚫 WAF: Blocked suspicious IP ${ip}`);
        
        // Auto-unblock after 1 hour
        setTimeout(() => {
            this.suspiciousIPs.delete(ip);
            console.log(`✅ WAF: Unblocked IP ${ip}`);
        }, 60 * 60 * 1000);
    }

    /**
     * Add security headers
     */
    addSecurityHeaders(req, res) {
        res.setHeader('X-WAF-Protected', 'Crown-Security-Suite');
        res.setHeader('X-Request-ID', req.id || 'unknown');
    }

    /**
     * Log security events
     */
    logSecurityEvent(eventType, req, details = {}) {
        const event = {
            timestamp: new Date().toISOString(),
            type: eventType,
            ip: req.ip,
            userAgent: req.get('User-Agent'),
            url: req.url,
            method: req.method,
            details
        };

        console.log(`🛡️  WAF Security Event: ${JSON.stringify(event)}`);
        
        // In production, send to SIEM
        if (process.env.NODE_ENV === 'production' && global.siemIntegration) {
            global.siemIntegration.logSecurityEvent('WAF_EVENT', event);
        }
    }

    /**
     * Get WAF statistics
     */
    getStats() {
        return {
            enabled: this.options.enabled,
            blockedIPs: this.suspiciousIPs.size,
            configuration: this.options
        };
    }
}

module.exports = WAFProtection;
