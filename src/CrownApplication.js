const express = require('express');
const path = require('path');
const cors = require('cors');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const passport = require('passport');
const https = require('https');
const fs = require('fs');

const AppConfig = require('../config/app');
const MainRouter = require('./routes');
const PortManager = require('./utils/PortManager');
const RequestLogger = require('./middleware/RequestLogger');
const ErrorHandler = require('./middleware/ErrorHandler');
const SecurityMiddleware = require('./middleware/SecurityMiddleware');
const EnhancedAuthMiddleware = require('./middleware/EnhancedAuthMiddleware');
const WAFProtection = require('./middleware/WAFProtection');
const DatabaseManager = require('./models/DatabaseManager');
const PassportConfig = require('./config/passport');
const EnhancedOAuthConfig = require('./config/EnhancedOAuthConfig');
const GDPRComplianceManager = require('./services/GDPRComplianceManager');
const SIEMIntegration = require('./services/SIEMIntegration');

/**
 * Crown Application Class
 * Main application class theo mô hình OOP
 */
class CrownApplication {
    constructor() {
        this.app = express();
        this.config = AppConfig;
        this.server = null;
        this.httpsServer = null;
        this.gdprManager = null;
        this.siemIntegration = null;
        this.wafProtection = null;
        this.portManager = new PortManager();
        
        console.log('🏗️  Khởi tạo Crown Application...');
        this.initializeSecurityServices();
        this.initializePassport();
        this.initializeMiddlewares();
        this.initializeRoutes();
        this.initializeErrorHandling();
    }

    /**
     * Initialize Security Services
     */
    initializeSecurityServices() {
        console.log('🛡️  Khởi tạo Enhanced Security Services...');
        
        // Initialize WAF Protection
        this.wafProtection = new WAFProtection({
            enableAttackDetection: true,
            enableRateLimiting: true,
            enableGeoBlocking: true,
            enableThreatIntelligence: true
        });

        // Initialize GDPR Compliance Manager
        this.gdprManager = new GDPRComplianceManager({
            enableConsentTracking: true,
            enableDataSubjectRights: true,
            enableAuditTrail: true,
            enableBreachNotification: true
        });

        // Initialize SIEM Integration
        this.siemIntegration = new SIEMIntegration({
            providers: ['splunk', 'elasticsearch'],
            enableThreatIntelligence: true,
            enableAnomalyDetection: true
        });

        console.log('✅ Enhanced Security Services initialized');
    }

    /**
     * Khởi tạo Passport OAuth
     */
    initializePassport() {
        console.log('🔑 Thiết lập Enhanced Passport OAuth...');
        
        // Initialize Enhanced OAuth Configuration
        const enhancedOAuth = new EnhancedOAuthConfig();
        enhancedOAuth.initialize();
        
        // Keep existing passport config for backward compatibility
        new PassportConfig();
        
        console.log('✅ Enhanced OAuth Authentication configured');
    }

    /**
     * Khởi tạo middlewares
     */
    initializeMiddlewares() {
        console.log('🔧 Thiết lập Enhanced Middlewares...');

        // Trust proxy headers in Docker environment
        this.app.set('trust proxy', 1);

        // WAF Protection (first line of defense)
        this.app.use(this.wafProtection.protect());

        // Enhanced Security middleware
        this.app.use(SecurityMiddleware.getHelmetConfig());
        this.app.use(SecurityMiddleware.securityHeaders());

        // CORS (must be early in middleware chain)
        this.app.use(cors(this.config.cors));

        // Session configuration for Passport (must be before passport)
        this.app.use(session({
            secret: process.env.SESSION_SECRET || 'crown-session-secret-key-2024',
            resave: false,
            saveUninitialized: false,
            store: MongoStore.create({
                mongoUrl: this.config.database.mongoUri,
                touchAfter: 24 * 3600 // 24 hours
            }),
            cookie: {
                secure: false, // Set to true only with HTTPS in production
                httpOnly: true,
                maxAge: 24 * 60 * 60 * 1000 // 24 hours
            },
            name: 'crown.sess' // Custom session name
        }));

        // Passport middleware (must be after session)
        this.app.use(passport.initialize());
        this.app.use(passport.session());

        // Enhanced Authentication Middleware
        const enhancedAuth = new EnhancedAuthMiddleware();

        console.log('✅ Enhanced Security Middlewares configured');
        
        // GDPR Compliance Middleware
        this.app.use(this.gdprManager.middleware());
        
        // SIEM Integration (log all requests)
        this.app.use((req, res, next) => {
            this.siemIntegration.logSecurityEvent('REQUEST', {
                method: req.method,
                url: req.url,
                ip: req.ip,
                userAgent: req.get('User-Agent')
            });
            next();
        });
        
        // Original Security Middleware
        this.app.use(SecurityMiddleware.securityLogger());
        this.app.use(SecurityMiddleware.sanitizeInput());

        // Rate limiting
        this.app.use('/api/', SecurityMiddleware.getApiRateLimit());
        this.app.use('/login', SecurityMiddleware.getLoginRateLimit());
        this.app.use('/register', SecurityMiddleware.getLoginRateLimit());

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
        console.log('🛣️  Thiết lập Enhanced Routes...');

        // GDPR Compliance Routes
        this.app.use('/api/gdpr', this.gdprManager.getRouter());

        // Health check endpoint for Docker
        this.app.get('/health', (req, res) => {
            try {
                const packageInfo = require('../../package.json');
                const healthStatus = {
                    status: 'OK',
                    timestamp: new Date().toISOString(),
                    uptime: process.uptime(),
                    environment: process.env.NODE_ENV || 'development',
                    version: packageInfo.version || '1.0.0',
                    memory: process.memoryUsage(),
                    pid: process.pid
                };

                // Check database connection
                const mongoose = require('mongoose');
                if (mongoose.connection && mongoose.connection.readyState === 1) {
                    healthStatus.database = 'connected';
                } else {
                    healthStatus.database = 'disconnected';
                    healthStatus.status = 'DEGRADED';
                }

                // Security services status
                healthStatus.security = {
                    waf: this.wafProtection ? 'active' : 'inactive',
                    gdpr: this.gdprManager ? 'active' : 'inactive',
                    siem: this.siemIntegration ? 'active' : 'inactive'
                };

                const statusCode = healthStatus.status === 'OK' ? 200 : 503;
                res.status(statusCode).json(healthStatus);
            } catch (error) {
                console.error('Health check error:', error);
                res.status(500).json({
                    status: 'ERROR',
                    error: error.message,
                    timestamp: new Date().toISOString()
                });
            }
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
                // Check and clean up ports first
                console.log('🔍 Checking port availability...');
                await this.portManager.checkPortStatus([3000, 3443]);
                
                // Kill any processes on these ports
                await this.portManager.killProcessOnPorts([3000, 3443]);
                
                // Wait a moment for cleanup
                await new Promise(resolve => setTimeout(resolve, 1000));
                // Kết nối database trước
                console.log('🗄️  Kết nối database...');
                await DatabaseManager.connect();

                // Initialize Security Services
                console.log('🛡️  Khởi tạo Security Services...');
                await this.siemIntegration.initialize();
                
                // Initialize WAF Protection
                console.log('🛡️  Khởi tạo WAF Protection...');
                await this.wafProtection.initialize();
                
                // Initialize GDPR Compliance Manager
                console.log('🛡️  Khởi tạo GDPR Compliance...');
                await this.gdprManager.initialize();

                const { port, host } = this.config.server;

                // Start HTTP server
                this.server = this.app.listen(port, host, () => {
                    console.log('\n🎉 Crown Server (HTTP) đã khởi động thành công!');
                    this.config.printConfig();
                    console.log('\n📱 Truy cập ứng dụng tại:');
                    console.log(`   - Trang chủ: ${this.config.getServerUrl()}`);
                    console.log(`   - Đăng nhập: ${this.config.getServerUrl()}/login.html`);
                    console.log(`   - Đăng ký: ${this.config.getServerUrl()}/register.html`);
                    console.log(`   - API Health: ${this.config.getServerUrl()}/health`);
                    console.log(`   - GDPR API: ${this.config.getServerUrl()}/api/gdpr`);
                });

                // Start HTTPS server if certificates exist
                await this.startHTTPSServer();

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

                console.log('\n🚀 Crown Social Network - Enterprise Security Ready!\n');
                resolve(this.server);

            } catch (error) {
                console.error('❌ Không thể khởi động server:', error);
                reject(error);
            }
        });
    }

    /**
     * Start HTTPS Server with SSL certificates
     */
    async startHTTPSServer() {
        try {
            const httpsPort = process.env.HTTPS_PORT || 3443;
            const sslKeyPath = path.join(__dirname, '../docker/ssl/key.pem');
            const sslCertPath = path.join(__dirname, '../docker/ssl/cert.pem');

            // Check if SSL certificates exist
            if (fs.existsSync(sslKeyPath) && fs.existsSync(sslCertPath)) {
                const privateKey = fs.readFileSync(sslKeyPath, 'utf8');
                const certificate = fs.readFileSync(sslCertPath, 'utf8');
                const credentials = { key: privateKey, cert: certificate };

                this.httpsServer = https.createServer(credentials, this.app);
                
                this.httpsServer.listen(httpsPort, () => {
                    console.log(`\n🔒 HTTPS Server started on port ${httpsPort}`);
                    console.log(`   - Secure URL: https://localhost:${httpsPort}`);
                    console.log(`   - SSL/TLS: ✅ Enabled`);
                });

                this.httpsServer.on('error', (error) => {
                    console.error('❌ HTTPS Server error:', error.message);
                });
            } else {
                console.log('\n⚠️  SSL certificates not found. Running HTTP only.');
                console.log('   Run: npm run generate-ssl để tạo SSL certificates');
            }
        } catch (error) {
            console.error('❌ Failed to start HTTPS server:', error.message);
        }
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
