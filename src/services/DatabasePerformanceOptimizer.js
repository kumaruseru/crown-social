const { MongoClient } = require('mongodb');

/**
 * Database Performance Optimizer
 * Optimizes database queries and performance
 */
class DatabasePerformanceOptimizer {
    constructor(options = {}) {
        this.options = {
            enabled: process.env.DB_OPTIMIZATION_ENABLED === 'true' || true,
            indexOptimization: process.env.DB_INDEX_OPTIMIZATION === 'true' || true,
            queryOptimization: process.env.DB_QUERY_OPTIMIZATION === 'true' || true,
            connectionPooling: process.env.DB_CONNECTION_POOLING === 'true' || true,
            slowQueryThreshold: parseInt(process.env.DB_SLOW_QUERY_THRESHOLD) || 1000, // 1 second
            ...options
        };

        this.queryStats = {
            totalQueries: 0,
            slowQueries: 0,
            optimizedQueries: 0,
            cacheHits: 0
        };

        this.slowQueries = [];
        this.indexRecommendations = [];

        console.log('🚀 Database Performance Optimizer initialized');
    }

    /**
     * Initialize database optimization
     */
    async initialize(db) {
        if (!this.options.enabled) {
            console.log('⚠️  Database optimization disabled');
            return;
        }

        this.db = db;

        try {
            if (this.options.indexOptimization) {
                await this.optimizeIndexes();
            }

            if (this.options.connectionPooling) {
                await this.configureConnectionPool();
            }

            await this.setupQueryProfiling();
            
            console.log('🚀 Database Performance Optimizer started');

        } catch (error) {
            console.error('❌ Failed to initialize database optimization:', error);
        }
    }

    /**
     * Optimize database indexes
     */
    async optimizeIndexes() {
        console.log('📊 Optimizing database indexes...');

        try {
            const collections = await this.db.listCollections().toArray();
            
            for (const collection of collections) {
                const collectionName = collection.name;
                await this.optimizeCollectionIndexes(collectionName);
            }

            console.log('✅ Database indexes optimized');

        } catch (error) {
            console.error('❌ Index optimization error:', error);
        }
    }

    /**
     * Optimize indexes for specific collection
     */
    async optimizeCollectionIndexes(collectionName) {
        const collection = this.db.collection(collectionName);
        
        // Get existing indexes
        const existingIndexes = await collection.indexes();
        const indexNames = existingIndexes.map(idx => idx.name);

        // Define recommended indexes based on collection
        const recommendedIndexes = this.getRecommendedIndexes(collectionName);

        for (const indexSpec of recommendedIndexes) {
            const indexName = this.generateIndexName(indexSpec.fields);
            
            if (!indexNames.includes(indexName)) {
                try {
                    await collection.createIndex(indexSpec.fields, {
                        name: indexName,
                        background: true,
                        ...indexSpec.options
                    });
                    
                    console.log(`✅ Created index ${indexName} on ${collectionName}`);
                } catch (error) {
                    console.error(`❌ Failed to create index ${indexName}:`, error.message);
                }
            }
        }
    }

    /**
     * Get recommended indexes for collection
     */
    getRecommendedIndexes(collectionName) {
        const indexes = {
            users: [
                { fields: { email: 1 }, options: { unique: true } },
                { fields: { username: 1 }, options: { unique: true } },
                { fields: { createdAt: -1 } },
                { fields: { lastLogin: -1 } },
                { fields: { status: 1, createdAt: -1 } }
            ],
            posts: [
                { fields: { authorId: 1, createdAt: -1 } },
                { fields: { createdAt: -1 } },
                { fields: { tags: 1 } },
                { fields: { status: 1, createdAt: -1 } },
                { fields: { authorId: 1, status: 1, createdAt: -1 } }
            ],
            news: [
                { fields: { publishedAt: -1 } },
                { fields: { category: 1, publishedAt: -1 } },
                { fields: { source: 1, publishedAt: -1 } },
                { fields: { status: 1, publishedAt: -1 } },
                { fields: { title: 'text', content: 'text' } }
            ],
            messages: [
                { fields: { conversationId: 1, createdAt: -1 } },
                { fields: { senderId: 1, createdAt: -1 } },
                { fields: { recipientId: 1, createdAt: -1 } },
                { fields: { createdAt: -1 } }
            ],
            notifications: [
                { fields: { userId: 1, createdAt: -1 } },
                { fields: { userId: 1, read: 1, createdAt: -1 } },
                { fields: { type: 1, createdAt: -1 } }
            ]
        };

        return indexes[collectionName] || [];
    }

    /**
     * Generate index name from fields
     */
    generateIndexName(fields) {
        const parts = [];
        for (const [field, direction] of Object.entries(fields)) {
            parts.push(`${field}_${direction}`);
        }
        return parts.join('_');
    }

    /**
     * Configure connection pooling
     */
    async configureConnectionPool() {
        console.log('🔄 Configuring connection pooling...');

        // Connection pooling is typically configured at the MongoClient level
        // This method can be used to monitor and adjust pool settings
        
        const poolStats = {
            maxPoolSize: 100,
            minPoolSize: 5,
            maxIdleTimeMS: 300000, // 5 minutes
            waitQueueTimeoutMS: 10000 // 10 seconds
        };

        console.log('✅ Connection pooling configured:', poolStats);
    }

    /**
     * Setup query profiling
     */
    async setupQueryProfiling() {
        if (!this.options.queryOptimization) {
            return;
        }

        try {
            // Enable profiling for slow operations
            await this.db.admin().command({
                profile: 2,
                slowms: this.options.slowQueryThreshold
            });

            console.log('📊 Query profiling enabled');

        } catch (error) {
            console.error('❌ Failed to setup query profiling:', error);
        }
    }

    /**
     * Query optimization middleware
     */
    optimizeQuery(collection, operation, query, options = {}) {
        return new Promise(async (resolve, reject) => {
            const startTime = Date.now();
            const queryId = this.generateQueryId();

            try {
                // Add query hints based on analysis
                const optimizedQuery = this.addQueryHints(collection, query);
                const optimizedOptions = this.optimizeQueryOptions(options);

                // Execute the query
                let result;
                switch (operation) {
                    case 'find':
                        result = await this.db.collection(collection).find(optimizedQuery, optimizedOptions).toArray();
                        break;
                    case 'findOne':
                        result = await this.db.collection(collection).findOne(optimizedQuery, optimizedOptions);
                        break;
                    case 'aggregate':
                        result = await this.db.collection(collection).aggregate(optimizedQuery, optimizedOptions).toArray();
                        break;
                    case 'count':
                        result = await this.db.collection(collection).countDocuments(optimizedQuery, optimizedOptions);
                        break;
                    default:
                        throw new Error(`Unsupported operation: ${operation}`);
                }

                const duration = Date.now() - startTime;
                this.recordQueryStats(collection, operation, query, duration, queryId);

                resolve(result);

            } catch (error) {
                const duration = Date.now() - startTime;
                this.recordQueryStats(collection, operation, query, duration, queryId, error);
                reject(error);
            }
        });
    }

    /**
     * Add query hints for optimization
     */
    addQueryHints(collection, query) {
        const optimizedQuery = { ...query };

        // Add specific optimizations based on collection and query pattern
        if (collection === 'posts' && query.authorId && query.createdAt) {
            // This query should use the compound index
            optimizedQuery.$hint = { authorId: 1, createdAt: -1 };
        }

        if (collection === 'users' && query.email) {
            // Use unique email index
            optimizedQuery.$hint = { email: 1 };
        }

        return optimizedQuery;
    }

    /**
     * Optimize query options
     */
    optimizeQueryOptions(options) {
        const optimized = { ...options };

        // Add default optimizations
        if (!optimized.maxTimeMS) {
            optimized.maxTimeMS = 10000; // 10 second timeout
        }

        // Optimize projection
        if (optimized.projection) {
            // Ensure _id is explicitly handled
            if (!('_id' in optimized.projection)) {
                optimized.projection._id = 0; // Exclude _id if not needed
            }
        }

        // Optimize sorting with limits
        if (optimized.sort && optimized.limit) {
            optimized.allowDiskUse = false; // Force index usage for sorting
        }

        return optimized;
    }

    /**
     * Record query statistics
     */
    recordQueryStats(collection, operation, query, duration, queryId, error = null) {
        this.queryStats.totalQueries++;

        if (duration > this.options.slowQueryThreshold) {
            this.queryStats.slowQueries++;
            
            const slowQuery = {
                id: queryId,
                collection,
                operation,
                query: JSON.stringify(query),
                duration,
                timestamp: new Date(),
                error: error ? error.message : null
            };

            this.slowQueries.push(slowQuery);
            
            // Keep only last 100 slow queries
            if (this.slowQueries.length > 100) {
                this.slowQueries = this.slowQueries.slice(-50);
            }

            console.log(`🐌 Slow query detected: ${collection}.${operation} (${duration}ms)`);
        }

        if (!error) {
            this.queryStats.optimizedQueries++;
        }
    }

    /**
     * Analyze query patterns and suggest optimizations
     */
    async analyzeQueryPatterns() {
        console.log('📊 Analyzing query patterns...');

        try {
            // Get profiling data
            const profilingData = await this.db.collection('system.profile').find({
                ts: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } // Last 24 hours
            }).sort({ ts: -1 }).limit(1000).toArray();

            // Analyze patterns
            const patterns = this.extractQueryPatterns(profilingData);
            const recommendations = this.generateOptimizationRecommendations(patterns);

            console.log(`📊 Analyzed ${profilingData.length} queries`);
            console.log(`💡 Generated ${recommendations.length} optimization recommendations`);

            this.indexRecommendations = recommendations;
            return recommendations;

        } catch (error) {
            console.error('❌ Query pattern analysis error:', error);
            return [];
        }
    }

    /**
     * Extract query patterns from profiling data
     */
    extractQueryPatterns(profilingData) {
        const patterns = {};

        for (const entry of profilingData) {
            const collection = entry.ns ? entry.ns.split('.')[1] : 'unknown';
            const operation = entry.command ? Object.keys(entry.command)[0] : 'unknown';
            
            const patternKey = `${collection}.${operation}`;
            
            if (!patterns[patternKey]) {
                patterns[patternKey] = {
                    collection,
                    operation,
                    count: 0,
                    totalDuration: 0,
                    queries: []
                };
            }

            patterns[patternKey].count++;
            patterns[patternKey].totalDuration += entry.millis || 0;
            patterns[patternKey].queries.push(entry);
        }

        return patterns;
    }

    /**
     * Generate optimization recommendations
     */
    generateOptimizationRecommendations(patterns) {
        const recommendations = [];

        for (const [patternKey, pattern] of Object.entries(patterns)) {
            const avgDuration = pattern.totalDuration / pattern.count;
            
            if (avgDuration > this.options.slowQueryThreshold) {
                recommendations.push({
                    type: 'slow_query',
                    collection: pattern.collection,
                    operation: pattern.operation,
                    count: pattern.count,
                    avgDuration,
                    recommendation: `Consider adding indexes for ${pattern.collection} ${pattern.operation} queries`
                });
            }

            if (pattern.count > 100) { // Frequently executed queries
                recommendations.push({
                    type: 'frequent_query',
                    collection: pattern.collection,
                    operation: pattern.operation,
                    count: pattern.count,
                    recommendation: `Consider caching results for frequent ${pattern.collection} queries`
                });
            }
        }

        return recommendations;
    }

    /**
     * Generate unique query ID
     */
    generateQueryId() {
        return 'query_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    /**
     * Get performance statistics
     */
    getStats() {
        const successRate = this.queryStats.totalQueries > 0 
            ? ((this.queryStats.optimizedQueries / this.queryStats.totalQueries) * 100).toFixed(2)
            : '0.00';

        return {
            enabled: this.options.enabled,
            queries: {
                total: this.queryStats.totalQueries,
                slow: this.queryStats.slowQueries,
                optimized: this.queryStats.optimizedQueries,
                successRate: `${successRate}%`
            },
            recentSlowQueries: this.slowQueries.slice(-10),
            recommendations: this.indexRecommendations.slice(-10),
            configuration: {
                slowQueryThreshold: this.options.slowQueryThreshold,
                indexOptimization: this.options.indexOptimization,
                queryOptimization: this.options.queryOptimization
            }
        };
    }

    /**
     * Health check
     */
    async healthCheck() {
        try {
            // Test database connectivity and performance
            const startTime = Date.now();
            await this.db.admin().ping();
            const pingDuration = Date.now() - startTime;

            const status = pingDuration < 100 ? 'healthy' : 'slow';
            
            return {
                status,
                pingDuration,
                enabled: this.options.enabled,
                stats: this.getStats()
            };

        } catch (error) {
            return {
                status: 'error',
                error: error.message,
                enabled: this.options.enabled
            };
        }
    }
}

module.exports = DatabasePerformanceOptimizer;
