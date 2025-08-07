/**
 * AuthMiddleware - Middleware xác thực cho API routes
 */

/**
 * Kiểm tra xem user đã đăng nhập chưa
 */
const requireAuth = (req, res, next) => {
    if (!req.isAuthenticated || !req.isAuthenticated()) {
        return res.status(401).json({
            success: false,
            message: 'Vui lòng đăng nhập để truy cập tính năng này',
            timestamp: new Date().toISOString()
        });
    }
    
    if (!req.user) {
        return res.status(401).json({
            success: false,
            message: 'Phiên đăng nhập không hợp lệ',
            timestamp: new Date().toISOString()
        });
    }
    
    next();
};

/**
 * Kiểm tra quyền admin
 */
const requireAdmin = (req, res, next) => {
    requireAuth(req, res, () => {
        if (req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Không có quyền truy cập',
                timestamp: new Date().toISOString()
            });
        }
        next();
    });
};

/**
 * Middleware kiểm tra rate limiting (tránh spam)
 */
const rateLimiter = (maxRequests = 100, windowMs = 15 * 60 * 1000) => {
    const requestCounts = new Map();
    
    return (req, res, next) => {
        const clientId = req.user?.id || req.ip;
        const now = Date.now();
        const windowStart = now - windowMs;
        
        // Lấy danh sách request của client
        if (!requestCounts.has(clientId)) {
            requestCounts.set(clientId, []);
        }
        
        const requests = requestCounts.get(clientId);
        
        // Xóa các request cũ ngoài window
        while (requests.length > 0 && requests[0] < windowStart) {
            requests.shift();
        }
        
        // Kiểm tra số lượng request
        if (requests.length >= maxRequests) {
            return res.status(429).json({
                success: false,
                message: 'Quá nhiều request, vui lòng thử lại sau',
                timestamp: new Date().toISOString(),
                retryAfter: Math.ceil(windowMs / 1000)
            });
        }
        
        // Thêm request hiện tại
        requests.push(now);
        requestCounts.set(clientId, requests);
        
        next();
    };
};

module.exports = {
    requireAuth,
    requireAdmin,
    rateLimiter,
    authenticate: requireAuth  // Alias cho requireAuth
};
