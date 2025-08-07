/**
 * Error Handler Middleware
 * Xử lý lỗi toàn cục
 */
class ErrorHandler {
    /**
     * Handle 404 errors
     * @param {Object} req 
     * @param {Object} res 
     * @param {Function} next 
     */
    static handle404(req, res, next) {
        const error = new Error(`Không tìm thấy trang: ${req.originalUrl}`);
        error.status = 404;
        next(error);
    }

    /**
     * Global error handler
     * @param {Error} err 
     * @param {Object} req 
     * @param {Object} res 
     * @param {Function} next 
     */
    static handleError(err, req, res, next) {
        const timestamp = new Date().toISOString();
        const status = err.status || 500;
        const message = err.message || 'Có lỗi xảy ra';

        // Log error
        console.error(`[${timestamp}] ERROR ${status}: ${message}`);
        if (status === 500) {
            console.error('Stack trace:', err.stack);
        }

        // Trả về JSON response cho API requests
        if (req.originalUrl.startsWith('/api/')) {
            return res.status(status).json({
                success: false,
                message: status === 500 ? 'Lỗi server nội bộ' : message,
                timestamp
            });
        }

        // Trả về HTML cho web requests
        if (status === 404) {
            return res.status(404).send(`
                <!DOCTYPE html>
                <html lang="vi">
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>404 - Crown</title>
                    <script src="https://cdn.tailwindcss.com"></script>
                </head>
                <body class="bg-gray-900 text-white flex items-center justify-center min-h-screen">
                    <div class="text-center">
                        <h1 class="text-6xl font-bold text-yellow-400 mb-4">404</h1>
                        <p class="text-xl mb-6">Trang bạn tìm kiếm không tồn tại</p>
                        <a href="/" class="bg-yellow-400 text-gray-900 px-6 py-3 rounded-lg font-semibold hover:bg-yellow-300 transition-colors">
                            Về trang chủ
                        </a>
                    </div>
                </body>
                </html>
            `);
        }

        // Generic error page
        res.status(status).send(`
            <!DOCTYPE html>
            <html lang="vi">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Lỗi - Crown</title>
                <script src="https://cdn.tailwindcss.com"></script>
            </head>
            <body class="bg-gray-900 text-white flex items-center justify-center min-h-screen">
                <div class="text-center">
                    <h1 class="text-4xl font-bold text-red-400 mb-4">Oops!</h1>
                    <p class="text-xl mb-6">${message}</p>
                    <a href="/" class="bg-yellow-400 text-gray-900 px-6 py-3 rounded-lg font-semibold hover:bg-yellow-300 transition-colors">
                        Về trang chủ
                    </a>
                </div>
            </body>
            </html>
        `);
    }
}

module.exports = ErrorHandler;
