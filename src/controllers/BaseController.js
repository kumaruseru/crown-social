/**
 * Base Controller Class
 * Lớp cơ sở cho tất cả controllers
 */
class BaseController {
    /**
     * Trả về response success
     * @param {Object} res - Express response object
     * @param {Object} data - Dữ liệu trả về
     * @param {string} message - Thông báo
     * @param {number} statusCode - HTTP status code
     */
    sendSuccess(res, data = null, message = 'Success', statusCode = 200) {
        return res.status(statusCode).json({
            success: true,
            message,
            data,
            timestamp: new Date().toISOString()
        });
    }

    /**
     * Trả về response error
     * @param {Object} res - Express response object
     * @param {string} message - Thông báo lỗi
     * @param {Array} errors - Danh sách lỗi chi tiết
     * @param {number} statusCode - HTTP status code
     */
    sendError(res, message = 'Error', errors = [], statusCode = 400) {
        return res.status(statusCode).json({
            success: false,
            message,
            errors,
            timestamp: new Date().toISOString()
        });
    }

    /**
     * Validate required fields
     * @param {Object} data - Dữ liệu cần validate
     * @param {Array} requiredFields - Các field bắt buộc
     * @returns {Array} - Danh sách lỗi
     */
    validateRequiredFields(data, requiredFields) {
        const errors = [];
        requiredFields.forEach(field => {
            if (!data[field] || data[field].toString().trim() === '') {
                errors.push(`Trường ${field} là bắt buộc`);
            }
        });
        return errors;
    }

    /**
     * Log request info
     * @param {Object} req - Express request object
     * @param {string} action - Hành động
     */
    logRequest(req, action) {
        const timestamp = new Date().toISOString();
        const ip = req.ip || req.connection.remoteAddress;
        const userAgent = req.get('User-Agent');
        
        console.log(`[${timestamp}] ${action} - IP: ${ip} - User-Agent: ${userAgent}`);
    }
}

module.exports = BaseController;
