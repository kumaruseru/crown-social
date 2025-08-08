// Load environment variables
require('dotenv').config();

/**
 * Application Configuration
 * Cấu hình chung cho ứng dụng
 */
class AppConfig {
    constructor() {
        // Server configuration
        this.server = {
            port: process.env.PORT || 3000,
            host: process.env.HOST || '0.0.0.0',
            env: process.env.NODE_ENV || 'development'
        };

        // Database configuration - MongoDB
        this.database = {
            mongoUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/crown_db',
            options: {
                useNewUrlParser: true,
                useUnifiedTopology: true
            }
        };

        // Redis configuration
        this.redis = {
            url: process.env.REDIS_URL,
            host: process.env.REDIS_HOST || 'localhost',
            port: parseInt(process.env.REDIS_PORT) || 6379,
            password: process.env.REDIS_PASSWORD || '',
            db: parseInt(process.env.REDIS_DB) || 0,
            tls: process.env.REDIS_TLS === 'true'
        };

        // Security configuration
        this.security = {
            saltRounds: 12,
            jwtSecret: process.env.JWT_SECRET || 'crown_jwt_secret_key_2025',
            jwtRefreshSecret: process.env.JWT_REFRESH_SECRET || 'crown_jwt_refresh_secret_2025',
            jwtExpiry: process.env.JWT_EXPIRY || '15m',
            jwtRefreshExpiry: process.env.JWT_REFRESH_EXPIRY || '7d',
            sessionSecret: process.env.SESSION_SECRET || 'crown_session_secret',
            sessionExpiry: 24 * 60 * 60 * 1000 // 24 hours
        };

        // OAuth configuration
        this.oauth = {
            google: {
                clientId: process.env.GOOGLE_CLIENT_ID,
                clientSecret: process.env.GOOGLE_CLIENT_SECRET,
                callbackURL: process.env.GOOGLE_CALLBACK_URL || '/auth/google/callback'
            },
            facebook: {
                appId: process.env.FACEBOOK_APP_ID,
                appSecret: process.env.FACEBOOK_APP_SECRET,
                callbackURL: process.env.FACEBOOK_CALLBACK_URL || '/auth/facebook/callback'
            }
        };

        // Email configuration
        this.email = {
            service: process.env.EMAIL_SERVICE || 'development',
            from: process.env.EMAIL_FROM || 'noreply@crown.com',
            fromName: process.env.EMAIL_FROM_NAME || 'Crown Social Network',
            // Development settings
            smtp: {
                host: process.env.SMTP_HOST || 'localhost',
                port: parseInt(process.env.SMTP_PORT) || 587,
                secure: process.env.SMTP_SECURE === 'true',
                auth: {
                    user: process.env.SMTP_USER || '',
                    pass: process.env.SMTP_PASS || ''
                }
            },
            // Production settings
            production: {
                host: process.env.PROD_SMTP_HOST || process.env.SMTP_HOST,
                port: parseInt(process.env.PROD_SMTP_PORT) || parseInt(process.env.SMTP_PORT) || 587,
                secure: process.env.PROD_SMTP_SECURE === 'true',
                auth: {
                    user: process.env.PROD_SMTP_USER || process.env.SMTP_USER,
                    pass: process.env.PROD_SMTP_PASS || process.env.SMTP_PASS
                }
            }
        };

        // File upload configuration
        this.upload = {
            maxFileSize: parseInt(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024, // 5MB
            allowedTypes: process.env.ALLOWED_FILE_TYPES ? 
                process.env.ALLOWED_FILE_TYPES.split(',') : 
                ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
            uploadDir: process.env.UPLOAD_DIR || './uploads'
        };

        // CORS configuration
        this.cors = {
            origin: process.env.CORS_ORIGIN || ['http://localhost:3000', 'https://cown.name.vn'],
            methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
            allowedHeaders: ['Content-Type', 'Authorization', 'x-csrf-token'],
            credentials: true
        };

        // Rate limiting
        this.rateLimit = {
            windowMs: 15 * 60 * 1000, // 15 minutes
            max: 100, // limit each IP to 100 requests per windowMs
            message: 'Quá nhiều request từ IP này, vui lòng thử lại sau.',
            skipSuccessfulRequests: false
        };
    }

    /**
     * Kiểm tra môi trường development
     * @returns {boolean}
     */
    isDevelopment() {
        return this.server.env === 'development';
    }

    /**
     * Kiểm tra môi trường production
     * @returns {boolean}
     */
    isProduction() {
        return this.server.env === 'production';
    }

    /**
     * Lấy URL server
     * @returns {string}
     */
    getServerUrl() {
        return `http://${this.server.host}:${this.server.port}`;
    }

    /**
     * Lấy cấu hình email dựa trên environment
     * @returns {Object}
     */
    getEmailConfig() {
        return this.email.service === 'production' ? 
            this.email.production : 
            this.email.smtp;
    }

    /**
     * Kiểm tra xem có Redis không
     * @returns {boolean}
     */
    hasRedis() {
        return !!(this.redis.url || this.redis.host);
    }

    /**
     * Kiểm tra OAuth configuration
     * @returns {Object}
     */
    getOAuthStatus() {
        return {
            google: !!(this.oauth.google.clientId && this.oauth.google.clientSecret),
            facebook: !!(this.oauth.facebook.appId && this.oauth.facebook.appSecret)
        };
    }

    /**
     * In thông tin cấu hình (ẩn thông tin nhạy cảm)
     */
    printConfig() {
        const oauthStatus = this.getOAuthStatus();
        
        console.log('🔧 Cấu hình ứng dụng Crown:');
        console.log(`   - Server: ${this.getServerUrl()}`);
        console.log(`   - Environment: ${this.server.env}`);
        console.log(`   - Database: MongoDB ${this.database.mongoUri ? '✅' : '❌'}`);
        console.log(`   - Redis: ${this.hasRedis() ? '✅' : '❌'}`);
        console.log(`   - Email Service: ${this.email.service}`);
        console.log(`   - Upload Dir: ${this.upload.uploadDir}`);
        console.log(`   - Max File Size: ${this.upload.maxFileSize / 1024 / 1024}MB`);
        console.log(`   - Google OAuth: ${oauthStatus.google ? '✅' : '❌'}`);
        console.log(`   - Facebook OAuth: ${oauthStatus.facebook ? '✅' : '❌'}`);
    }
}

// Export singleton instance
module.exports = new AppConfig();
