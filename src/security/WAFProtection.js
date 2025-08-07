const rateLimit = require('express-rate-limit');
const slowDown = require('express-slow-down');
const { RateLimiterMemory, RateLimiterRedis } = require('rate-limiter-flexible');

/**
 * Web Application Firewall (WAF) Protection
 * Advanced protection against various web attacks
 */
class WAFProtection {
    constructor() {
        this.suspiciousIPs = new Set();
        this.blockedIPs = new Set();
        this.attackPatterns = this.loadAttackPatterns();
        this.initializeRateLimiters();
        this.initializeGeoBlocking();
    }

    /**
     * Load attack patterns for detection
     */
    loadAttackPatterns() {
        return {
            // SQL Injection patterns
            sqlInjection: [
                /(\bunion\b.*\bselect\b)/i,
                /(\bselect\b.*\bfrom\b)/i,
                /((\%27)|(\'))\s*(\bunion|\bor|\band)/i,
                /(\bdrop\b|\bdelete\b|\btruncate\b)\s+\btable\b/i,
                /(\binsert\b|\bupdate\b)\s+.*((\%27)|(\'))/i
            ],

            // XSS patterns
            xssAttack: [
                /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
                /javascript\s*:/i,
                /vbscript\s*:/i,
                /on\w+\s*=/i,
                /<iframe\b/i,
                /<object\b/i,
                /<embed\b/i
            ],

            // Command Injection
            commandInjection: [
                /(\;|\|)\s*(ls|cat|ps|wget|curl|nc|netcat)/i,
                /(\$\(|\`)(.*?)(\)|\`)/,
                /(&&|\|\|)\s*(rm|mv|cp|chmod)/i
            ],

            // Path Traversal
            pathTraversal: [
                /\.\.\//,
                /\.\.\\/,
                /%2e%2e%2f/i,
                /%2e%2e%5c/i
            ],

            // LDAP Injection
            ldapInjection: [
                /(\(\|)|(\)\()/,
                /(\*\)|\(\*))/,
                /(\)\&\(|\&\(\))/
            ],

            // NoSQL Injection
            nosqlInjection: [
                /\$where.*function/i,
                /\$ne\s*:\s*1/i,
                /\$gt.*\$lt/i,
                /\$regex.*\$options/i
            ]
        };
    }

    /**
     * Initialize rate limiters
     */
    initializeRateLimiters() {
        // Different rate limiters for different endpoints
        this.rateLimiters = {
            // General API rate limiter
            api: new RateLimiterMemory({
                points: 100, // Number of requests
                duration: 900, // Per 15 minutes
                blockDuration: 900 // Block for 15 minutes
            }),

            // Login attempt rate limiter
            login: new RateLimiterMemory({
                points: 5, // 5 attempts
                duration: 900, // Per 15 minutes
                blockDuration: 3600 // Block for 1 hour
            }),

            // Admin access rate limiter
            admin: new RateLimiterMemory({
                points: 20, // 20 requests
                duration: 900, // Per 15 minutes
                blockDuration: 1800 // Block for 30 minutes
            }),

            // File upload rate limiter
            upload: new RateLimiterMemory({
                points: 10, // 10 uploads
                duration: 3600, // Per 1 hour
                blockDuration: 3600 // Block for 1 hour
            })
        };
    }

    /**
     * Initialize geo-blocking
     */
    initializeGeoBlocking() {
        // Countries to block (example: known high-risk countries)
        this.blockedCountries = new Set(
            (process.env.BLOCKED_COUNTRIES || '').split(',').filter(c => c.trim())
        );

        // Allowed countries (if specified, only these are allowed)
        this.allowedCountries = new Set(
            (process.env.ALLOWED_COUNTRIES || '').split(',').filter(c => c.trim())
        );
    }

    /**
     * Main WAF middleware
     */
    getWAFMiddleware() {
        return async (req, res, next) => {
            try {
                const clientIP = this.getClientIP(req);
                
                // 1. IP-based blocking
                if (this.blockedIPs.has(clientIP)) {
                    return this.blockRequest(req, res, 'IP_BLOCKED', 'IP address is blocked');
                }

                // 2. Geo-blocking
                const geoCheckResult = await this.checkGeoBlocking(req, clientIP);
                if (!geoCheckResult.allowed) {
                    return this.blockRequest(req, res, 'GEO_BLOCKED', geoCheckResult.reason);
                }

                // 3. Rate limiting
                const rateLimitResult = await this.checkRateLimit(req, clientIP);
                if (!rateLimitResult.allowed) {
                    return this.blockRequest(req, res, 'RATE_LIMITED', rateLimitResult.reason);
                }

                // 4. Attack pattern detection
                const attackDetection = this.detectAttacks(req);
                if (attackDetection.detected) {
                    await this.handleSuspiciousActivity(clientIP, attackDetection);
                    return this.blockRequest(req, res, 'ATTACK_DETECTED', attackDetection.type);
                }

                // 5. Request size validation
                if (!this.validateRequestSize(req)) {
                    return this.blockRequest(req, res, 'REQUEST_TOO_LARGE', 'Request size exceeds limit');
                }

                // 6. Header validation
                if (!this.validateHeaders(req)) {
                    return this.blockRequest(req, res, 'INVALID_HEADERS', 'Invalid request headers');
                }

                // Request passed all checks
                next();

            } catch (error) {
                console.error('WAF Error:', error);
                next(); // Let request through on WAF error to avoid breaking the app
            }
        };
    }

    /**
     * Get client IP address
     */
    getClientIP(req) {
        return req.headers['x-forwarded-for']?.split(',')[0] ||
               req.headers['x-real-ip'] ||
               req.connection.remoteAddress ||
               req.socket.remoteAddress ||
               req.ip;
    }

    /**
     * Check geo-blocking
     */
    async checkGeoBlocking(req, clientIP) {
        // Skip localhost and private IPs
        if (this.isPrivateIP(clientIP)) {
            return { allowed: true };
        }

        try {
            // Use a geo-IP service (example with geoip-lite)
            const geoip = require('geoip-lite');
            const geo = geoip.lookup(clientIP);
            
            if (!geo) {
                return { allowed: true }; // Allow if geo data unavailable
            }

            const country = geo.country;

            // Check blocked countries
            if (this.blockedCountries.size > 0 && this.blockedCountries.has(country)) {
                return { 
                    allowed: false, 
                    reason: `Country ${country} is blocked` 
                };
            }

            // Check allowed countries (whitelist mode)
            if (this.allowedCountries.size > 0 && !this.allowedCountries.has(country)) {
                return { 
                    allowed: false, 
                    reason: `Country ${country} is not in allowed list` 
                };
            }

            return { allowed: true, country: country };

        } catch (error) {
            console.error('Geo-blocking error:', error);
            return { allowed: true }; // Allow on error
        }
    }

    /**
     * Check if IP is private/local
     */
    isPrivateIP(ip) {
        const privateRanges = [
            /^127\./, // 127.0.0.0/8
            /^192\.168\./, // 192.168.0.0/16
            /^10\./, // 10.0.0.0/8
            /^172\.(1[6-9]|2\d|3[01])\./, // 172.16.0.0/12
            /^::1$/, // IPv6 localhost
            /^fc00:/, // IPv6 unique local
            /^localhost$/i
        ];

        return privateRanges.some(range => range.test(ip));
    }

    /**
     * Check rate limiting
     */
    async checkRateLimit(req, clientIP) {
        try {
            let limiterKey = 'api';
            
            // Choose appropriate rate limiter based on endpoint
            if (req.path.includes('/login') || req.path.includes('/register')) {
                limiterKey = 'login';
            } else if (req.path.includes('/admin')) {
                limiterKey = 'admin';
            } else if (req.path.includes('/upload')) {
                limiterKey = 'upload';
            }

            const rateLimiter = this.rateLimiters[limiterKey];
            await rateLimiter.consume(clientIP);
            
            return { allowed: true };

        } catch (rateLimiterRes) {
            return { 
                allowed: false, 
                reason: `Rate limit exceeded. Try again in ${Math.round(rateLimiterRes.msBeforeNext / 1000)} seconds`,
                retryAfter: Math.round(rateLimiterRes.msBeforeNext / 1000)
            };
        }
    }

    /**
     * Detect various attack patterns
     */
    detectAttacks(req) {
        const inputSources = [
            req.url,
            req.query ? JSON.stringify(req.query) : '',
            req.body ? JSON.stringify(req.body) : '',
            req.headers['user-agent'] || '',
            req.headers['referer'] || ''
        ].join(' ');

        // Check each attack pattern type
        for (const [attackType, patterns] of Object.entries(this.attackPatterns)) {
            for (const pattern of patterns) {
                if (pattern.test(inputSources)) {
                    return {
                        detected: true,
                        type: attackType,
                        pattern: pattern.toString(),
                        input: inputSources.substring(0, 200) // Log first 200 chars
                    };
                }
            }
        }

        return { detected: false };
    }

    /**
     * Handle suspicious activity
     */
    async handleSuspiciousActivity(clientIP, attackInfo) {
        this.suspiciousIPs.add(clientIP);
        
        // Log security event
        console.warn(`🚨 WAF: Attack detected from ${clientIP}`, {
            type: attackInfo.type,
            pattern: attackInfo.pattern,
            timestamp: new Date().toISOString(),
            input: attackInfo.input
        });

        // Auto-block after multiple attacks
        const suspiciousCount = await this.getSuspiciousCount(clientIP);
        if (suspiciousCount >= 3) {
            this.blockedIPs.add(clientIP);
            console.warn(`🚫 WAF: Auto-blocked IP ${clientIP} after ${suspiciousCount} attacks`);
        }

        // Send alert to security team
        this.sendSecurityAlert(clientIP, attackInfo);
    }

    /**
     * Get suspicious activity count for IP
     */
    async getSuspiciousCount(clientIP) {
        // In production, this should use Redis or database
        // For now, use simple in-memory counter
        if (!this.suspiciousCounters) {
            this.suspiciousCounters = new Map();
        }
        
        const count = this.suspiciousCounters.get(clientIP) || 0;
        this.suspiciousCounters.set(clientIP, count + 1);
        
        return count + 1;
    }

    /**
     * Send security alert
     */
    sendSecurityAlert(clientIP, attackInfo) {
        // In production, integrate with alerting system (Slack, email, SMS)
        const alert = {
            severity: 'HIGH',
            type: 'WAF_ATTACK_DETECTED',
            clientIP: clientIP,
            attackType: attackInfo.type,
            timestamp: new Date().toISOString(),
            details: attackInfo
        };

        // Log to console for now
        console.error('🚨 SECURITY ALERT:', JSON.stringify(alert, null, 2));

        // TODO: Send to external alerting system
        // await this.sendToSlack(alert);
        // await this.sendEmail(alert);
    }

    /**
     * Validate request size
     */
    validateRequestSize(req) {
        const maxSize = parseInt(process.env.MAX_REQUEST_SIZE) || 10 * 1024 * 1024; // 10MB default
        const contentLength = req.headers['content-length'];
        
        if (contentLength && parseInt(contentLength) > maxSize) {
            return false;
        }
        
        return true;
    }

    /**
     * Validate request headers
     */
    validateHeaders(req) {
        // Check for suspicious headers
        const suspiciousHeaders = [
            'x-cluster-client-ip',
            'x-forwarded-host',
            'x-remote-ip'
        ];

        for (const header of suspiciousHeaders) {
            if (req.headers[header]) {
                // Additional validation can be added here
                console.warn(`⚠️ Suspicious header detected: ${header}`);
            }
        }

        // Validate User-Agent
        const userAgent = req.headers['user-agent'];
        if (!userAgent || userAgent.length < 10) {
            console.warn(`⚠️ Missing or suspicious User-Agent: ${userAgent}`);
            // Don't block, just warn for now
        }

        return true;
    }

    /**
     * Block request with appropriate response
     */
    blockRequest(req, res, code, message) {
        const clientIP = this.getClientIP(req);
        
        console.warn(`🚫 WAF: Blocked request from ${clientIP}`, {
            code: code,
            message: message,
            url: req.url,
            method: req.method,
            timestamp: new Date().toISOString()
        });

        // Return generic error to avoid information disclosure
        return res.status(403).json({
            error: 'Access Denied',
            message: 'Your request has been blocked by our security system',
            code: 'WAF_BLOCKED',
            requestId: req.headers['x-request-id'] || 'unknown'
        });
    }

    /**
     * Whitelist IP address
     */
    whitelistIP(ip) {
        this.blockedIPs.delete(ip);
        this.suspiciousIPs.delete(ip);
        console.log(`✅ IP whitelisted: ${ip}`);
    }

    /**
     * Block IP address manually
     */
    blockIP(ip, reason = 'Manual block') {
        this.blockedIPs.add(ip);
        console.log(`🚫 IP blocked manually: ${ip} - ${reason}`);
    }

    /**
     * Get WAF statistics
     */
    getStatistics() {
        return {
            blockedIPs: this.blockedIPs.size,
            suspiciousIPs: this.suspiciousIPs.size,
            blockedCountries: Array.from(this.blockedCountries),
            allowedCountries: Array.from(this.allowedCountries),
            rateLimiters: Object.keys(this.rateLimiters)
        };
    }

    /**
     * Health check for WAF
     */
    healthCheck() {
        return {
            status: 'healthy',
            wafEnabled: true,
            components: {
                rateLimiting: true,
                geoBlocking: this.blockedCountries.size > 0 || this.allowedCountries.size > 0,
                attackDetection: Object.keys(this.attackPatterns).length > 0,
                ipBlocking: true
            },
            statistics: this.getStatistics(),
            lastCheck: new Date().toISOString()
        };
    }
}

module.exports = WAFProtection;
