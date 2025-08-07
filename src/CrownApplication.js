const express = require('express');
const path = require('path');
const cors = require('cors');
const session = require('express-session');
const passport = require('passport');

const AppConfig = require('../config/app');
const MainRouter = require('./routes');
const RequestLogger = require('./middleware/RequestLogger');
const ErrorHandler = require('./middleware/ErrorHandler');
const SecurityMiddleware = require('./middleware/SecurityMiddleware');
const DatabaseManager = require('./models/DatabaseManager');
const PassportConfig = require('./config/passport');

/**
 * Crown Application Class
 * Main application class theo mô hình OOP
 */
class CrownApplication {
    constructor() {
        this.app = express();
        this.config = AppConfig;
        this.server = null;
        
        console.log('🏗️  Khởi tạo Crown Application...');
        this.initializePassport();
        this.initializeMiddlewares();
        this.initializeRoutes();
        this.initializeErrorHandling();
    }

    /**
     * Khởi tạo Passport OAuth
     */
    initializePassport() {
        console.log('🔑 Thiết lập Passport OAuth...');
        new PassportConfig();
    }

    /**
     * Khởi tạo middlewares
     */
    initializeMiddlewares() {
        console.log('🔧 Thiết lập middlewares...');

        // Trust proxy headers in Docker environment
        this.app.set('trust proxy', 1);

        // Security middleware
        this.app.use(SecurityMiddleware.getHelmetConfig());
        this.app.use(SecurityMiddleware.securityHeaders());
        this.app.use(SecurityMiddleware.securityLogger());
        this.app.use(SecurityMiddleware.sanitizeInput());

        // Rate limiting
        this.app.use('/api/', SecurityMiddleware.getApiRateLimit());
        this.app.use('/login', SecurityMiddleware.getLoginRateLimit());
        this.app.use('/register', SecurityMiddleware.getLoginRateLimit());

        // CORS
        this.app.use(cors(this.config.cors));

        // Session configuration for Passport
        this.app.use(session({
            secret: process.env.SESSION_SECRET || 'crown-session-secret',
            resave: false,
            saveUninitialized: false,
            cookie: {
                secure: process.env.NODE_ENV === 'production',
                httpOnly: true,
                maxAge: 24 * 60 * 60 * 1000 // 24 hours
            }
        }));

        // Passport middleware
        this.app.use(passport.initialize());
        this.app.use(passport.session());

        // Body parsing
        this.app.use(express.json({ limit: '10mb' }));
        this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

        // Request logging
        this.app.use(RequestLogger.log);

        // Static files
        this.app.use('/public', express.static(path.join(__dirname, '../public')));
        this.app.use(express.static(path.join(__dirname, '../views')));
        
        // Serve navigation includes
        this.app.use('/includes', express.static(path.join(__dirname, '../views/includes'), {
            setHeaders: (res, path) => {
                res.setHeader('Content-Type', 'text/html; charset=utf-8');
            }
        }));

        // Security headers
        this.app.use((req, res, next) => {
            res.setHeader('X-Content-Type-Options', 'nosniff');
            res.setHeader('X-Frame-Options', 'DENY');
            res.setHeader('X-XSS-Protection', '1; mode=block');
            next();
        });

        console.log('✅ Middlewares đã được thiết lập');
    }

    /**
     * Khởi tạo routes
     */
    initializeRoutes() {
        console.log('🛣️  Thiết lập routes...');

        // Health check endpoint for Docker
        this.app.get('/health', (req, res) => {
            const healthStatus = {
                status: 'OK',
                timestamp: new Date().toISOString(),
                uptime: process.uptime(),
                environment: process.env.NODE_ENV || 'development',
                version: require('../package.json').version || '1.0.0',
                memory: process.memoryUsage(),
                pid: process.pid
            };

            // Check database connection
            if (DatabaseManager.isConnected()) {
                healthStatus.database = 'connected';
            } else {
                healthStatus.database = 'disconnected';
                healthStatus.status = 'DEGRADED';
            }

            const statusCode = healthStatus.status === 'OK' ? 200 : 503;
            res.status(statusCode).json(healthStatus);
        });

        // Metrics endpoint for Prometheus
        this.app.get('/metrics', (req, res) => {
            const metrics = {
                timestamp: Date.now(),
                uptime: process.uptime(),
                memory: process.memoryUsage(),
                cpu: process.cpuUsage(),
                version: require('../package.json').version || '1.0.0'
            };
            
            res.set('Content-Type', 'text/plain; version=0.0.4; charset=utf-8');
            res.send(`# HELP crown_uptime_seconds Application uptime in seconds
# TYPE crown_uptime_seconds gauge
crown_uptime_seconds ${metrics.uptime}

# HELP crown_memory_usage_bytes Memory usage in bytes
# TYPE crown_memory_usage_bytes gauge
crown_memory_usage_bytes{type="rss"} ${metrics.memory.rss}
crown_memory_usage_bytes{type="heapTotal"} ${metrics.memory.heapTotal}
crown_memory_usage_bytes{type="heapUsed"} ${metrics.memory.heapUsed}
crown_memory_usage_bytes{type="external"} ${metrics.memory.external}

# HELP crown_version_info Application version
# TYPE crown_version_info gauge
crown_version_info{version="${metrics.version}"} 1`);
        });

        // Root route - redirect to login
        this.app.get('/', (req, res) => {
            res.redirect('/login.html');
        });

        // Main routes
        const mainRouter = new MainRouter();
        this.app.use('/', mainRouter.getRouter());

        console.log('✅ Routes đã được thiết lập');
    }

    /**
     * Khởi tạo error handling
     */
    initializeErrorHandling() {
        console.log('🚨 Thiết lập error handling...');

        // 404 handler
        this.app.use(ErrorHandler.handle404);

        // Global error handler
        this.app.use(ErrorHandler.handleError);

        console.log('✅ Error handling đã được thiết lập');
    }

    /**
     * Khởi động server
     * @returns {Promise}
     */
    async start() {
        return new Promise(async (resolve, reject) => {
            try {
                // Kết nối database trước
                console.log('🗄️  Kết nối database...');
                await DatabaseManager.connect();

                const { port, host } = this.config.server;

                this.server = this.app.listen(port, host, () => {
                    console.log('\n🎉 Crown Server đã khởi động thành công!');
                    this.config.printConfig();
                    console.log('\n📱 Truy cập ứng dụng tại:');
                    console.log(`   - Trang chủ: ${this.config.getServerUrl()}`);
                    console.log(`   - Đăng nhập: ${this.config.getServerUrl()}/login.html`);
                    console.log(`   - Đăng ký: ${this.config.getServerUrl()}/register.html`);
                    console.log(`   - API Health: ${this.config.getServerUrl()}/health`);
                    console.log('\n🚀 Server đã sẵn sàng nhận requests!\n');
                    resolve(this.server);
                });

                // Handle server errors
                this.server.on('error', (error) => {
                    if (error.code === 'EADDRINUSE') {
                        console.error(`❌ Port ${port} đã được sử dụng`);
                        reject(error);
                    } else {
                        console.error('❌ Lỗi server:', error);
                        reject(error);
                    }
                });

            } catch (error) {
                console.error('❌ Không thể khởi động server:', error);
                reject(error);
            }
        });
    }

    /**
     * Dừng server
     * @returns {Promise}
     */
    async stop() {
        return new Promise(async (resolve) => {
            if (this.server) {
                console.log('🛑 Đang dừng Crown Server...');
                
                // Ngắt kết nối database
                try {
                    await DatabaseManager.disconnect();
                } catch (error) {
                    console.error('❌ Lỗi ngắt kết nối database:', error.message);
                }

                this.server.close(() => {
                    console.log('✅ Crown Server đã dừng');
                    resolve();
                });
            } else {
                resolve();
            }
        });
    }

    /**
     * Restart server
     * @returns {Promise}
     */
    async restart() {
        console.log('🔄 Đang khởi động lại server...');
        await this.stop();
        await this.start();
        console.log('✅ Server đã được khởi động lại');
    }

    /**
     * Lấy Express app instance
     * @returns {express.Application}
     */
    getApp() {
        return this.app;
    }

    /**
     * Lấy server instance
     * @returns {http.Server}
     */
    getServer() {
        return this.server;
    }

    /**
     * Lấy cấu hình
     * @returns {AppConfig}
     */
    getConfig() {
        return this.config;
    }
}

module.exports = CrownApplication;
