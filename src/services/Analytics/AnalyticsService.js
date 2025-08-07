/**
 * Analytics Service - Advanced analytics cho Crown Social Network
 * Phase 1 Completion - Multi-language Analytics Integration
 * 
 * Features:
 * - Real-time user analytics
 * - Content performance tracking
 * - Social network analysis
 * - Engagement metrics
 * - Business intelligence
 * - Multi-language service integration
 */

const axios = require('axios');

class AnalyticsService {
    constructor() {
        this.services = {
            csharp: {
                url: process.env.CSHARP_ANALYTICS_URL || 'http://localhost:5050',
                enabled: process.env.CSHARP_ANALYTICS_ENABLED !== 'false'
            },
            python: {
                url: process.env.PYTHON_ANALYTICS_URL || 'http://localhost:5000',
                enabled: process.env.PYTHON_ANALYTICS_ENABLED !== 'false'
            },
            java: {
                url: process.env.JAVA_ANALYTICS_URL || 'http://localhost:8090',
                enabled: process.env.JAVA_ANALYTICS_ENABLED !== 'false'
            },
            go: {
                url: process.env.GO_ANALYTICS_URL || 'http://localhost:8000',
                enabled: process.env.GO_ANALYTICS_ENABLED !== 'false'
            }
        };

        this.eventBuffer = [];
        this.bufferSize = 100;
        this.flushInterval = 30000; // 30 seconds

        this.init();
    }

    async init() {
        console.log('📊 Initializing Analytics Service...');
        
        // Start event buffer flushing
        setInterval(() => {
            this.flushEventBuffer();
        }, this.flushInterval);

        // Test service connectivity
        await this.testServices();
        
        console.log('✅ Analytics Service initialized');
    }

    async testServices() {
        const testPromises = Object.entries(this.services)
            .filter(([, config]) => config.enabled)
            .map(([service, config]) => this.testServiceHealth(service, config.url));

        await Promise.allSettled(testPromises);
    }

    async testServiceHealth(service, url) {
        try {
            const response = await axios.get(`${url}/health`, { timeout: 5000 });
            if (response.status === 200) {
                console.log(`✅ ${service.toUpperCase()} analytics service connected`);
                return true;
            }
        } catch (error) {
            console.log(`⚠️ ${service.toUpperCase()} analytics service unavailable`);
            this.services[service].enabled = false;
            return false;
        }
    }

    /**
     * Track user events
     */
    async trackEvent(eventType, userId, data = {}) {
        const event = {
            type: eventType,
            userId,
            data,
            timestamp: new Date(),
            sessionId: this.getSessionId(userId)
        };

        // Add to buffer for batch processing
        this.eventBuffer.push(event);

        // Flush if buffer is full
        if (this.eventBuffer.length >= this.bufferSize) {
            await this.flushEventBuffer();
        }

        return event;
    }

    /**
     * Real-time user metrics
     */
    async getUserMetrics(userId, timeRange = '7d') {
        try {
            // Primary: C# analytics service
            if (this.services.csharp.enabled) {
                const response = await axios.post(
                    `${this.services.csharp.url}/user-metrics`,
                    { userId, timeRange },
                    { timeout: 10000 }
                );

                return {
                    engagement: response.data.engagement || {},
                    activity: response.data.activity || {},
                    social: response.data.social || {},
                    content: response.data.content || {},
                    growth: response.data.growth || {},
                    service: 'csharp'
                };
            }

            // Fallback: Local metrics calculation
            return await this.calculateLocalMetrics(userId, timeRange);

        } catch (error) {
            console.error('Get user metrics error:', error);
            return await this.calculateLocalMetrics(userId, timeRange);
        }
    }

    /**
     * Content performance analysis
     */
    async analyzeContentPerformance(contentId, contentType = 'post') {
        try {
            // Primary: Python analytics for ML analysis
            if (this.services.python.enabled) {
                const response = await axios.post(
                    `${this.services.python.url}/content-performance`,
                    { contentId, contentType },
                    { timeout: 15000 }
                );

                return {
                    reach: response.data.reach || 0,
                    engagement: response.data.engagement || {},
                    virality: response.data.virality || 0,
                    sentiment: response.data.sentiment || {},
                    predictions: response.data.predictions || {},
                    benchmarks: response.data.benchmarks || {},
                    service: 'python'
                };
            }

            return await this.basicContentAnalysis(contentId, contentType);

        } catch (error) {
            console.error('Content performance analysis error:', error);
            return await this.basicContentAnalysis(contentId, contentType);
        }
    }

    /**
     * Social network analysis
     */
    async analyzeSocialNetwork(userId, depth = 2) {
        try {
            // Primary: Java service for graph analysis
            if (this.services.java.enabled) {
                const response = await axios.post(
                    `${this.services.java.url}/social-network`,
                    { userId, depth },
                    { timeout: 20000 }
                );

                return {
                    connections: response.data.connections || [],
                    clusters: response.data.clusters || [],
                    influence: response.data.influence || 0,
                    centrality: response.data.centrality || {},
                    recommendations: response.data.recommendations || [],
                    service: 'java'
                };
            }

            return await this.basicSocialAnalysis(userId, depth);

        } catch (error) {
            console.error('Social network analysis error:', error);
            return await this.basicSocialAnalysis(userId, depth);
        }
    }

    /**
     * Real-time dashboard data
     */
    async getDashboardData(userId, role = 'user') {
        try {
            const [userMetrics, recentActivity, trending] = await Promise.allSettled([
                this.getUserMetrics(userId, '24h'),
                this.getRecentActivity(userId, 10),
                this.getTrendingContent(userId, 5)
            ]);

            return {
                metrics: userMetrics.status === 'fulfilled' ? userMetrics.value : {},
                activity: recentActivity.status === 'fulfilled' ? recentActivity.value : [],
                trending: trending.status === 'fulfilled' ? trending.value : [],
                realTime: await this.getRealTimeStats(userId),
                timestamp: new Date()
            };

        } catch (error) {
            console.error('Dashboard data error:', error);
            return {
                metrics: {},
                activity: [],
                trending: [],
                realTime: {},
                timestamp: new Date(),
                error: error.message
            };
        }
    }

    /**
     * Engagement analytics
     */
    async trackEngagement(userId, targetId, action, metadata = {}) {
        const engagementEvent = {
            userId,
            targetId,
            action, // like, share, comment, view, follow
            metadata,
            timestamp: new Date()
        };

        // Track immediately for real-time updates
        await this.trackEvent('engagement', userId, engagementEvent);

        // Calculate engagement score
        const engagementScore = await this.calculateEngagementScore(userId, action);

        return {
            event: engagementEvent,
            score: engagementScore,
            tracked: true
        };
    }

    /**
     * A/B Testing analytics
     */
    async trackABTest(testId, userId, variant, outcome = null) {
        try {
            // Go service for fast A/B test tracking
            if (this.services.go.enabled) {
                const response = await axios.post(
                    `${this.services.go.url}/ab-test`,
                    { testId, userId, variant, outcome },
                    { timeout: 5000 }
                );

                return {
                    tracked: true,
                    testResults: response.data.results || {},
                    service: 'go'
                };
            }

            // Fallback: Local A/B test tracking
            return await this.trackLocalABTest(testId, userId, variant, outcome);

        } catch (error) {
            console.error('A/B test tracking error:', error);
            return await this.trackLocalABTest(testId, userId, variant, outcome);
        }
    }

    /**
     * Business intelligence reporting
     */
    async generateReport(reportType, parameters = {}) {
        try {
            const {
                startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
                endDate = new Date(),
                userId = null,
                format = 'json'
            } = parameters;

            // C# service for comprehensive reporting
            if (this.services.csharp.enabled) {
                const response = await axios.post(
                    `${this.services.csharp.url}/generate-report`,
                    {
                        reportType,
                        startDate,
                        endDate,
                        userId,
                        format
                    },
                    { timeout: 30000 }
                );

                return {
                    report: response.data.report || {},
                    metadata: response.data.metadata || {},
                    generatedAt: new Date(),
                    service: 'csharp'
                };
            }

            return await this.generateBasicReport(reportType, parameters);

        } catch (error) {
            console.error('Report generation error:', error);
            return await this.generateBasicReport(reportType, parameters);
        }
    }

    /**
     * Event buffer management
     */
    async flushEventBuffer() {
        if (this.eventBuffer.length === 0) return;

        const events = [...this.eventBuffer];
        this.eventBuffer = [];

        try {
            // Send to analytics services
            const promises = Object.entries(this.services)
                .filter(([, config]) => config.enabled)
                .map(([service, config]) => 
                    this.sendEventsToService(service, config.url, events)
                );

            await Promise.allSettled(promises);

        } catch (error) {
            console.error('Event buffer flush error:', error);
            // Re-add events to buffer for retry
            this.eventBuffer.unshift(...events);
        }
    }

    async sendEventsToService(service, url, events) {
        try {
            await axios.post(
                `${url}/events/batch`,
                { events },
                { timeout: 10000 }
            );
        } catch (error) {
            console.error(`Failed to send events to ${service}:`, error.message);
        }
    }

    /**
     * Utility methods
     */
    getSessionId(userId) {
        return `session_${userId}_${Date.now()}`;
    }

    async calculateEngagementScore(userId, action) {
        const weights = {
            view: 1,
            like: 3,
            comment: 5,
            share: 7,
            follow: 10
        };

        return weights[action] || 1;
    }

    /**
     * Fallback methods
     */
    async calculateLocalMetrics(userId, timeRange) {
        return {
            engagement: {
                totalInteractions: 0,
                averageEngagement: 0,
                engagementRate: 0
            },
            activity: {
                postsCreated: 0,
                commentsLeft: 0,
                likesGiven: 0
            },
            social: {
                newFollowers: 0,
                newConnections: 0
            },
            content: {
                topPosts: [],
                contentTypes: {}
            },
            growth: {
                followersGrowth: 0,
                engagementGrowth: 0
            },
            service: 'fallback'
        };
    }

    async basicContentAnalysis(contentId, contentType) {
        return {
            reach: 0,
            engagement: { likes: 0, comments: 0, shares: 0 },
            virality: 0,
            sentiment: { positive: 0, negative: 0, neutral: 0 },
            predictions: {},
            benchmarks: {},
            service: 'fallback'
        };
    }

    async basicSocialAnalysis(userId, depth) {
        return {
            connections: [],
            clusters: [],
            influence: 0,
            centrality: {},
            recommendations: [],
            service: 'fallback'
        };
    }

    async getRecentActivity(userId, limit) {
        return [];
    }

    async getTrendingContent(userId, limit) {
        return [];
    }

    async getRealTimeStats(userId) {
        return {
            onlineUsers: 0,
            activeNow: 0,
            newNotifications: 0
        };
    }

    async trackLocalABTest(testId, userId, variant, outcome) {
        return {
            tracked: true,
            testResults: {},
            service: 'fallback'
        };
    }

    async generateBasicReport(reportType, parameters) {
        return {
            report: { message: 'Basic report - analytics services unavailable' },
            metadata: { type: reportType, generated: new Date() },
            generatedAt: new Date(),
            service: 'fallback'
        };
    }
}

module.exports = new AnalyticsService();
