const CrownApplication = require('./src/CrownApplication');

/**
 * Main Server Entry Point
 * Khởi tạo và chạy Crown Application
 */

// Create and start the application
const crownApp = new CrownApplication();

// Start server
crownApp.start()
    .then((server) => {
        // Handle graceful shutdown
        const gracefulShutdown = async (signal) => {
            console.log(`\n📡 Nhận tín hiệu ${signal}, đang dừng server...`);
            
            try {
                await crownApp.stop();
                console.log('✅ Server đã dừng thành công');
                process.exit(0);
            } catch (error) {
                console.error('❌ Lỗi khi dừng server:', error);
                process.exit(1);
            }
        };

        // Listen for termination signals
        process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
        process.on('SIGINT', () => gracefulShutdown('SIGINT'));

        // Handle uncaught exceptions
        process.on('uncaughtException', (error) => {
            console.error('❌ Uncaught Exception:', error);
            gracefulShutdown('uncaughtException');
        });

        // Handle unhandled rejections
        process.on('unhandledRejection', (reason, promise) => {
            console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
            gracefulShutdown('unhandledRejection');
        });
    })
    .catch((error) => {
        console.error('❌ Không thể khởi động ứng dụng:', error);
        process.exit(1);
    });

// Export for testing
module.exports = crownApp;
