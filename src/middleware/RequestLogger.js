/**
 * Request Logger Middleware
 * Ghi log tất cả requests
 */
class RequestLogger {
    /**
     * Log middleware
     * @param {Object} req 
     * @param {Object} res 
     * @param {Function} next 
     */
    static log(req, res, next) {
        const timestamp = new Date().toISOString();
        const method = req.method;
        const url = req.url;
        const ip = req.ip || req.connection.remoteAddress;
        const userAgent = req.get('User-Agent') || 'Unknown';

        console.log(`[${timestamp}] ${method} ${url} - IP: ${ip}`);
        
        // Log request body cho POST requests (không log password)
        if (method === 'POST' && req.body) {
            const sanitizedBody = { ...req.body };
            if (sanitizedBody.password) sanitizedBody.password = '***';
            if (sanitizedBody.password_confirm) sanitizedBody.password_confirm = '***';
            console.log(`[${timestamp}] Request Body:`, sanitizedBody);
        }

        // Log response time
        const startTime = Date.now();
        res.on('finish', () => {
            const duration = Date.now() - startTime;
            console.log(`[${timestamp}] ${method} ${url} - ${res.statusCode} - ${duration}ms`);
        });

        next();
    }
}

module.exports = RequestLogger;
