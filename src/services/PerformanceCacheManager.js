const redis = require('redis');

/**
 * Performance Cache Manager
 * Redis-based caching for improved performance
 */
class PerformanceCacheManager {
    constructor(options = {}) {
        this.options = {
            enabled: process.env.CACHE_ENABLED === 'true' || true,
            redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',
            defaultTTL: parseInt(process.env.CACHE_DEFAULT_TTL) || 300, // 5 minutes
            keyPrefix: process.env.CACHE_KEY_PREFIX || 'crown:',
            compression: process.env.CACHE_COMPRESSION === 'true' || true,
            ...options
        };

        this.client = null;
        this.connected = false;
        this.stats = {
            hits: 0,
            misses: 0,
            sets: 0,
            errors: 0
        };

        console.log('⚡ Performance Cache Manager initialized');
    }

    /**
     * Initialize Redis connection
     */
    async initialize() {
        if (!this.options.enabled) {
            console.log('⚠️  Cache disabled, running without Redis');
            return;
        }

        try {
            this.client = redis.createClient({
                url: this.options.redisUrl,
                retry_strategy: (options) => {
                    if (options.error && options.error.code === 'ECONNREFUSED') {
                        console.error('❌ Redis connection refused');
                        return new Error('Redis connection refused');
                    }
                    if (options.total_retry_time > 1000 * 60 * 60) {
                        return new Error('Redis retry time exhausted');
                    }
                    if (options.attempt > 10) {
                        return undefined;
                    }
                    return Math.min(options.attempt * 100, 3000);
                }
            });

            this.client.on('error', (err) => {
                console.error('❌ Redis error:', err);
                this.stats.errors++;
                this.connected = false;
            });

            this.client.on('connect', () => {
                console.log('✅ Redis connected successfully');
                this.connected = true;
            });

            this.client.on('reconnecting', () => {
                console.log('🔄 Redis reconnecting...');
            });

            await this.client.connect();
            console.log('⚡ Performance Cache Manager started');

        } catch (error) {
            console.error('❌ Failed to initialize Redis cache:', error.message);
            console.log('⚠️  Running without cache');
            this.options.enabled = false;
        }
    }

    /**
     * Get cached value
     */
    async get(key) {
        if (!this.isAvailable()) {
            this.stats.misses++;
            return null;
        }

        try {
            const fullKey = this.getFullKey(key);
            const value = await this.client.get(fullKey);
            
            if (value) {
                this.stats.hits++;
                return this.deserialize(value);
            } else {
                this.stats.misses++;
                return null;
            }

        } catch (error) {
            console.error('❌ Cache get error:', error);
            this.stats.errors++;
            return null;
        }
    }

    /**
     * Set cached value
     */
    async set(key, value, ttl = null) {
        if (!this.isAvailable()) {
            return false;
        }

        try {
            const fullKey = this.getFullKey(key);
            const serializedValue = this.serialize(value);
            const expiration = ttl || this.options.defaultTTL;

            await this.client.setEx(fullKey, expiration, serializedValue);
            this.stats.sets++;
            return true;

        } catch (error) {
            console.error('❌ Cache set error:', error);
            this.stats.errors++;
            return false;
        }
    }

    /**
     * Delete cached value
     */
    async del(key) {
        if (!this.isAvailable()) {
            return false;
        }

        try {
            const fullKey = this.getFullKey(key);
            const result = await this.client.del(fullKey);
            return result > 0;

        } catch (error) {
            console.error('❌ Cache delete error:', error);
            this.stats.errors++;
            return false;
        }
    }

    /**
     * Cache middleware for Express routes
     */
    middleware(ttl = null) {
        return async (req, res, next) => {
            if (!this.isAvailable() || req.method !== 'GET') {
                return next();
            }

            try {
                const cacheKey = this.generateCacheKey(req);
                const cached = await this.get(cacheKey);

                if (cached) {
                    // Add cache headers
                    res.set('X-Cache', 'HIT');
                    res.set('X-Cache-Key', cacheKey);
                    
                    // Return cached response
                    return res.json(cached);
                }

                // Store original res.json
                const originalJson = res.json;
                
                // Override res.json to cache response
                res.json = (data) => {
                    // Cache the response
                    this.set(cacheKey, data, ttl);
                    
                    // Add cache headers
                    res.set('X-Cache', 'MISS');
                    res.set('X-Cache-Key', cacheKey);
                    
                    // Call original json method
                    return originalJson.call(res, data);
                };

                next();

            } catch (error) {
                console.error('❌ Cache middleware error:', error);
                next();
            }
        };
    }

    /**
     * Database query caching wrapper
     */
    async cacheQuery(key, queryFunction, ttl = null) {
        const cached = await this.get(key);
        if (cached) {
            return cached;
        }

        try {
            const result = await queryFunction();
            await this.set(key, result, ttl);
            return result;

        } catch (error) {
            console.error('❌ Cache query error:', error);
            throw error;
        }
    }

    /**
     * Invalidate cache by pattern
     */
    async invalidatePattern(pattern) {
        if (!this.isAvailable()) {
            return false;
        }

        try {
            const fullPattern = this.getFullKey(pattern);
            const keys = await this.client.keys(fullPattern);
            
            if (keys.length > 0) {
                await this.client.del(keys);
                console.log(`🗑️  Invalidated ${keys.length} cache keys matching pattern: ${pattern}`);
            }
            
            return true;

        } catch (error) {
            console.error('❌ Cache invalidation error:', error);
            this.stats.errors++;
            return false;
        }
    }

    /**
     * User-specific cache operations
     */
    async getUserCache(userId, key) {
        const userKey = `user:${userId}:${key}`;
        return this.get(userKey);
    }

    async setUserCache(userId, key, value, ttl = null) {
        const userKey = `user:${userId}:${key}`;
        return this.set(userKey, value, ttl);
    }

    async invalidateUserCache(userId) {
        return this.invalidatePattern(`user:${userId}:*`);
    }

    /**
     * News feed caching
     */
    async getNewsFeed(page = 1, limit = 20) {
        const key = `news:feed:${page}:${limit}`;
        return this.get(key);
    }

    async setNewsFeed(page, limit, data, ttl = 600) { // 10 minutes
        const key = `news:feed:${page}:${limit}`;
        return this.set(key, data, ttl);
    }

    /**
     * Posts caching
     */
    async getPost(postId) {
        const key = `post:${postId}`;
        return this.get(key);
    }

    async setPost(postId, data, ttl = 1800) { // 30 minutes
        const key = `post:${postId}`;
        return this.set(key, data, ttl);
    }

    async invalidatePost(postId) {
        await this.del(`post:${postId}`);
        // Also invalidate related caches
        await this.invalidatePattern(`user:*:posts`);
        await this.invalidatePattern(`news:feed:*`);
    }

    /**
     * Generate cache key from request
     */
    generateCacheKey(req) {
        const url = req.originalUrl || req.url;
        const query = JSON.stringify(req.query || {});
        const userId = req.user?.id || 'anonymous';
        
        return `route:${userId}:${url}:${this.hashString(query)}`;
    }

    /**
     * Get full cache key with prefix
     */
    getFullKey(key) {
        return `${this.options.keyPrefix}${key}`;
    }

    /**
     * Serialize value for storage
     */
    serialize(value) {
        try {
            let serialized = JSON.stringify(value);
            
            if (this.options.compression && serialized.length > 1000) {
                // Simple compression could be added here
                serialized = this.compress(serialized);
            }
            
            return serialized;

        } catch (error) {
            console.error('❌ Serialization error:', error);
            return JSON.stringify({ error: 'Serialization failed' });
        }
    }

    /**
     * Deserialize value from storage
     */
    deserialize(value) {
        try {
            if (this.options.compression && this.isCompressed(value)) {
                value = this.decompress(value);
            }
            
            return JSON.parse(value);

        } catch (error) {
            console.error('❌ Deserialization error:', error);
            return null;
        }
    }

    /**
     * Simple compression (placeholder)
     */
    compress(data) {
        // In production, use actual compression library like zlib
        return `COMPRESSED:${data}`;
    }

    /**
     * Simple decompression (placeholder)
     */
    decompress(data) {
        // In production, use actual decompression
        return data.replace('COMPRESSED:', '');
    }

    /**
     * Check if data is compressed
     */
    isCompressed(data) {
        return data.startsWith('COMPRESSED:');
    }

    /**
     * Simple hash function
     */
    hashString(str) {
        let hash = 0;
        if (str.length === 0) return hash;
        
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32bit integer
        }
        
        return Math.abs(hash).toString(36);
    }

    /**
     * Check if cache is available
     */
    isAvailable() {
        return this.options.enabled && this.connected && this.client;
    }

    /**
     * Get cache statistics
     */
    getStats() {
        const hitRate = this.stats.hits + this.stats.misses > 0 
            ? ((this.stats.hits / (this.stats.hits + this.stats.misses)) * 100).toFixed(2)
            : '0.00';

        return {
            enabled: this.options.enabled,
            connected: this.connected,
            hits: this.stats.hits,
            misses: this.stats.misses,
            sets: this.stats.sets,
            errors: this.stats.errors,
            hitRate: `${hitRate}%`,
            configuration: {
                defaultTTL: this.options.defaultTTL,
                keyPrefix: this.options.keyPrefix,
                compression: this.options.compression
            }
        };
    }

    /**
     * Health check
     */
    async healthCheck() {
        if (!this.isAvailable()) {
            return { status: 'disabled' };
        }

        try {
            const testKey = 'health:check';
            const testValue = { timestamp: Date.now() };
            
            await this.set(testKey, testValue, 10);
            const retrieved = await this.get(testKey);
            await this.del(testKey);
            
            const isWorking = retrieved && retrieved.timestamp === testValue.timestamp;
            
            return {
                status: isWorking ? 'healthy' : 'unhealthy',
                connected: this.connected,
                stats: this.getStats()
            };

        } catch (error) {
            return {
                status: 'error',
                error: error.message,
                connected: this.connected
            };
        }
    }

    /**
     * Cleanup and close connection
     */
    async close() {
        if (this.client) {
            try {
                await this.client.quit();
                console.log('✅ Redis connection closed');
            } catch (error) {
                console.error('❌ Error closing Redis connection:', error);
            }
        }
    }
}

module.exports = PerformanceCacheManager;
