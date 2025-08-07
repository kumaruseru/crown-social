const mongoose = require('mongoose');
const AppConfig = require('../../config/app');

/**
 * Database Manager Class
 * Quản lý kết nối database MongoDB
 */
class DatabaseManager {
    constructor() {
        this.connection = null;
        this.config = AppConfig;
    }

    /**
     * Kết nối tới MongoDB
     * @returns {Promise<void>}
     */
    async connect() {
        try {
            console.log('🔌 Đang kết nối tới MongoDB...');

            if (this.connection && this.connection.readyState === 1) {
                console.log('✅ MongoDB đã được kết nối');
                return this.connection;
            }

            // Cấu hình mongoose
            mongoose.set('strictQuery', true);

            // Kết nối
            this.connection = await mongoose.connect(this.config.database.mongoUri, {
                ...this.config.database.options,
                serverSelectionTimeoutMS: 5000, // 5 giây timeout
                maxPoolSize: 10, // Maintain up to 10 socket connections
                socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
                bufferCommands: false // Disable mongoose buffering
            });

            console.log('✅ Kết nối MongoDB thành công');
            console.log(`   - Database: ${this.connection.connection.name}`);
            console.log(`   - Host: ${this.connection.connection.host}`);
            console.log(`   - Port: ${this.connection.connection.port}`);

            // Event listeners
            this.setupEventListeners();

            return this.connection;

        } catch (error) {
            console.error('❌ Lỗi kết nối MongoDB:', error.message);
            throw error;
        }
    }

    /**
     * Thiết lập event listeners
     */
    setupEventListeners() {
        // Connection events
        mongoose.connection.on('connected', () => {
            console.log('📡 Mongoose connected to MongoDB');
        });

        mongoose.connection.on('error', (error) => {
            console.error('❌ Mongoose connection error:', error);
        });

        mongoose.connection.on('disconnected', () => {
            console.log('📵 Mongoose disconnected from MongoDB');
        });

        // Application termination events
        process.on('SIGINT', async () => {
            await this.disconnect();
            process.exit(0);
        });
    }

    /**
     * Ngắt kết nối database
     * @returns {Promise<void>}
     */
    async disconnect() {
        try {
            if (this.connection) {
                await mongoose.connection.close();
                console.log('✅ Đã ngắt kết nối MongoDB');
                this.connection = null;
            }
        } catch (error) {
            console.error('❌ Lỗi ngắt kết nối MongoDB:', error);
            throw error;
        }
    }

    /**
     * Kiểm tra trạng thái kết nối
     * @returns {string}
     */
    getConnectionStatus() {
        const states = {
            0: 'disconnected',
            1: 'connected',
            2: 'connecting',
            3: 'disconnecting'
        };

        return states[mongoose.connection.readyState] || 'unknown';
    }

    /**
     * Lấy thông tin database
     * @returns {Object}
     */
    getDatabaseInfo() {
        if (!this.connection) {
            return { connected: false };
        }

        return {
            connected: mongoose.connection.readyState === 1,
            name: mongoose.connection.name,
            host: mongoose.connection.host,
            port: mongoose.connection.port,
            collections: Object.keys(mongoose.connection.collections),
            status: this.getConnectionStatus()
        };
    }

    /**
     * Health check
     * @returns {Promise<Object>}
     */
    async healthCheck() {
        try {
            if (!this.connection || mongoose.connection.readyState !== 1) {
                return {
                    status: 'unhealthy',
                    message: 'Database not connected'
                };
            }

            // Ping database
            await mongoose.connection.db.admin().ping();

            return {
                status: 'healthy',
                message: 'Database connection is working',
                info: this.getDatabaseInfo()
            };

        } catch (error) {
            return {
                status: 'unhealthy',
                message: `Database error: ${error.message}`
            };
        }
    }

    /**
     * Static method to check connection status
     * @returns {boolean}
     */
    static isConnected() {
        return mongoose.connection.readyState === 1;
    }
}

// Export singleton instance
module.exports = new DatabaseManager();
