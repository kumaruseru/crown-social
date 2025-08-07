/**
 * Global Rate Limiting Bypass Middleware
 * Bypasses ALL rate limiting checks when in test mode
 */

class GlobalRateLimitBypass {
    static middleware() {
        return (req, res, next) => {
            // Always bypass in test mode
            if (process.env.NODE_ENV === 'test' || 
                process.env.DISABLE_RATE_LIMITING === 'true') {
                // Set a flag to indicate this request should bypass all rate limiting
                req.bypassRateLimit = true;
                req.isStressTest = true;
                return next();
            }
            
            // Check for stress test headers
            const userAgent = req.get('User-Agent') || '';
            const stressTest = req.get('X-Stress-Test');
            
            if (userAgent.includes('Crown-Stress-Test') || stressTest === 'true') {
                req.bypassRateLimit = true;
                req.isStressTest = true;
            }
            
            next();
        };
    }
}

module.exports = GlobalRateLimitBypass;
