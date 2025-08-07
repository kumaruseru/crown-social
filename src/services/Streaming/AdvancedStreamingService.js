/**
 * Advanced Streaming Service - Phase 2 Live Content Platform
 * Crown Social Network - 9-Language Polyglot System
 * 
 * Features:
 * - Live video/audio streaming
 * - Interactive streaming features
 * - Multi-platform broadcasting
 * - Stream analytics & insights
 * - Content delivery optimization
 * - Real-time engagement tools
 */

const axios = require('axios');
const EventEmitter = require('events');

class AdvancedStreamingService extends EventEmitter {
    constructor() {
        super();
        
        this.services = {
            cpp: {
                url: process.env.CPP_STREAMING_URL || 'http://localhost:8080',
                enabled: process.env.CPP_STREAMING_ENABLED !== 'false'
            },
            go: {
                url: process.env.GO_STREAMING_URL || 'http://localhost:8000',
                enabled: process.env.GO_STREAMING_ENABLED !== 'false'
            },
            elixir: {
                url: process.env.ELIXIR_STREAMING_URL || 'http://localhost:4000',
                enabled: process.env.ELIXIR_STREAMING_ENABLED !== 'false'
            },
            swift: {
                url: process.env.SWIFT_STREAMING_URL || 'http://localhost:8888',
                enabled: process.env.SWIFT_STREAMING_ENABLED !== 'false'
            }
        };

        this.activeStreams = new Map();
        this.streamViewers = new Map();
        this.streamAnalytics = new Map();
        this.interactionBuffer = new Map();

        this.config = {
            maxConcurrentStreams: 1000,
            maxViewersPerStream: 10000,
            streamTimeout: 4 * 60 * 60 * 1000, // 4 hours
            analyticsInterval: 10000, // 10 seconds
            interactionBufferSize: 500,
            qualityLevels: ['240p', '480p', '720p', '1080p', '4K']
        };

        this.initialized = false;
        this.init();
    }

    async init() {
        try {
            console.log('🎥 Initializing Advanced Streaming Service...');
            console.log('📺 Phase 2 - Live Content Platform');
            
            // Test streaming services connectivity
            await this.testStreamingServices();
            
            // Initialize stream management
            this.initializeStreamManagement();
            
            // Start analytics collection
            this.startAnalyticsCollection();
            
            // Initialize CDN integration
            await this.initializeCDN();
            
            this.initialized = true;
            console.log('✅ Advanced Streaming Service initialized successfully');
            
        } catch (error) {
            console.error('❌ Streaming Service initialization error:', error);
        }
    }

    async testStreamingServices() {
        const testPromises = Object.entries(this.services)
            .filter(([, config]) => config.enabled)
            .map(([service, config]) => this.testService(service, config.url));

        await Promise.allSettled(testPromises);
    }

    async testService(service, url) {
        try {
            const response = await axios.get(`${url}/streaming/health`, { timeout: 5000 });
            if (response.status === 200) {
                console.log(`✅ ${service.toUpperCase()} streaming service connected`);
                return true;
            }
        } catch (error) {
            console.log(`⚠️ ${service.toUpperCase()} streaming service unavailable`);
            this.services[service].enabled = false;
            return false;
        }
    }

    /**
     * Stream Creation & Management
     */
    async createStream(streamInfo) {
        try {
            const {
                streamerId,
                title,
                description = '',
                category,
                isPrivate = false,
                maxViewers = 1000,
                quality = '720p',
                features = [] // polls, chat, donations, etc.
            } = streamInfo;

            const streamId = this.generateStreamId();
            
            const stream = {
                streamId,
                streamerId,
                title,
                description,
                category,
                isPrivate,
                maxViewers,
                quality,
                features,
                status: 'initializing',
                createdAt: new Date(),
                startedAt: null,
                endedAt: null,
                viewers: new Set(),
                analytics: {
                    totalViews: 0,
                    peakViewers: 0,
                    totalDuration: 0,
                    interactions: 0
                }
            };

            // Initialize streaming infrastructure
            if (this.services.cpp.enabled) {
                // C++ service for high-performance video processing
                const response = await axios.post(
                    `${this.services.cpp.url}/streaming/create`,
                    {
                        streamId,
                        quality,
                        maxViewers,
                        processingOptions: {
                            transcoding: true,
                            multiQuality: true,
                            lowLatency: true
                        }
                    },
                    { timeout: 10000 }
                );

                stream.cppServiceData = response.data;
                stream.streamUrl = response.data.streamUrl;
                stream.playbackUrl = response.data.playbackUrl;
            }

            // Initialize real-time communication với Elixir
            if (this.services.elixir.enabled) {
                await axios.post(
                    `${this.services.elixir.url}/streaming/setup-realtime`,
                    {
                        streamId,
                        features,
                        maxViewers
                    },
                    { timeout: 5000 }
                );
            }

            this.activeStreams.set(streamId, stream);
            this.streamViewers.set(streamId, new Set());
            this.streamAnalytics.set(streamId, {
                startTime: Date.now(),
                events: [],
                metrics: {}
            });

            console.log(`🎥 Stream created: ${streamId} by ${streamerId}`);
            
            return {
                success: true,
                streamId,
                streamUrl: stream.streamUrl,
                playbackUrl: stream.playbackUrl,
                features: stream.features
            };

        } catch (error) {
            console.error('Stream creation error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    async startStream(streamId, streamerId) {
        try {
            const stream = this.activeStreams.get(streamId);
            if (!stream) {
                throw new Error('Stream not found');
            }

            if (stream.streamerId !== streamerId) {
                throw new Error('Unauthorized');
            }

            // Start streaming với C++ service
            if (this.services.cpp.enabled && stream.cppServiceData) {
                await axios.post(
                    `${this.services.cpp.url}/streaming/start`,
                    { streamId, serviceData: stream.cppServiceData },
                    { timeout: 10000 }
                );
            }

            stream.status = 'live';
            stream.startedAt = new Date();

            // Notify Elixir service for real-time updates
            if (this.services.elixir.enabled) {
                await axios.post(
                    `${this.services.elixir.url}/streaming/start`,
                    { streamId, streamerId },
                    { timeout: 5000 }
                );
            }

            // Start analytics collection
            this.startStreamAnalytics(streamId);

            console.log(`🔴 Stream started: ${streamId}`);
            
            this.emit('streamStarted', { streamId, streamerId, stream });

            return {
                success: true,
                status: 'live',
                startedAt: stream.startedAt
            };

        } catch (error) {
            console.error('Stream start error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    async stopStream(streamId, streamerId) {
        try {
            const stream = this.activeStreams.get(streamId);
            if (!stream) {
                throw new Error('Stream not found');
            }

            if (stream.streamerId !== streamerId) {
                throw new Error('Unauthorized');
            }

            // Stop C++ streaming service
            if (this.services.cpp.enabled && stream.cppServiceData) {
                await axios.post(
                    `${this.services.cpp.url}/streaming/stop`,
                    { streamId },
                    { timeout: 10000 }
                );
            }

            stream.status = 'ended';
            stream.endedAt = new Date();
            stream.analytics.totalDuration = stream.endedAt - stream.startedAt;

            // Cleanup viewers
            const viewers = this.streamViewers.get(streamId);
            if (viewers) {
                viewers.clear();
            }

            console.log(`⏹️ Stream stopped: ${streamId}`);
            
            this.emit('streamEnded', { streamId, streamerId, stream });

            return {
                success: true,
                status: 'ended',
                analytics: stream.analytics
            };

        } catch (error) {
            console.error('Stream stop error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Viewer Management
     */
    async joinStream(streamId, viewerId, viewerInfo = {}) {
        try {
            const stream = this.activeStreams.get(streamId);
            if (!stream) {
                throw new Error('Stream not found');
            }

            if (stream.status !== 'live') {
                throw new Error('Stream is not live');
            }

            const viewers = this.streamViewers.get(streamId);
            if (viewers.size >= stream.maxViewers) {
                throw new Error('Stream at maximum capacity');
            }

            viewers.add(viewerId);
            stream.analytics.totalViews++;
            
            if (viewers.size > stream.analytics.peakViewers) {
                stream.analytics.peakViewers = viewers.size;
            }

            // Notify Elixir service
            if (this.services.elixir.enabled) {
                await axios.post(
                    `${this.services.elixir.url}/streaming/viewer-join`,
                    { streamId, viewerId, viewerInfo },
                    { timeout: 5000 }
                );
            }

            // Track analytics
            this.trackStreamEvent(streamId, 'viewer_joined', { viewerId, timestamp: Date.now() });

            return {
                success: true,
                playbackUrl: stream.playbackUrl,
                currentViewers: viewers.size,
                streamInfo: {
                    title: stream.title,
                    streamer: stream.streamerId,
                    category: stream.category,
                    startedAt: stream.startedAt
                }
            };

        } catch (error) {
            console.error('Join stream error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    async leaveStream(streamId, viewerId) {
        try {
            const viewers = this.streamViewers.get(streamId);
            if (viewers) {
                viewers.delete(viewerId);
            }

            // Notify Elixir service
            if (this.services.elixir.enabled) {
                await axios.post(
                    `${this.services.elixir.url}/streaming/viewer-leave`,
                    { streamId, viewerId },
                    { timeout: 5000 }
                );
            }

            // Track analytics
            this.trackStreamEvent(streamId, 'viewer_left', { viewerId, timestamp: Date.now() });

            return {
                success: true,
                currentViewers: viewers ? viewers.size : 0
            };

        } catch (error) {
            console.error('Leave stream error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Interactive Features
     */
    async sendChatMessage(streamId, userId, message) {
        try {
            const stream = this.activeStreams.get(streamId);
            if (!stream || stream.status !== 'live') {
                throw new Error('Stream not available');
            }

            if (!stream.features.includes('chat')) {
                throw new Error('Chat not enabled for this stream');
            }

            const chatMessage = {
                id: this.generateMessageId(),
                streamId,
                userId,
                message: message.content,
                timestamp: new Date(),
                type: message.type || 'text'
            };

            // Send via Elixir real-time service
            if (this.services.elixir.enabled) {
                await axios.post(
                    `${this.services.elixir.url}/streaming/chat`,
                    chatMessage,
                    { timeout: 5000 }
                );
            }

            // Track interaction
            stream.analytics.interactions++;
            this.trackStreamEvent(streamId, 'chat_message', { userId, messageLength: message.content.length });

            return {
                success: true,
                messageId: chatMessage.id
            };

        } catch (error) {
            console.error('Chat message error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    async createPoll(streamId, streamerId, pollData) {
        try {
            const stream = this.activeStreams.get(streamId);
            if (!stream || stream.streamerId !== streamerId) {
                throw new Error('Unauthorized or stream not found');
            }

            if (!stream.features.includes('polls')) {
                throw new Error('Polls not enabled for this stream');
            }

            const poll = {
                id: this.generatePollId(),
                streamId,
                question: pollData.question,
                options: pollData.options,
                createdAt: new Date(),
                endsAt: new Date(Date.now() + (pollData.duration || 60000)), // 1 minute default
                votes: new Map(),
                isActive: true
            };

            // Send via Elixir service
            if (this.services.elixir.enabled) {
                await axios.post(
                    `${this.services.elixir.url}/streaming/poll-create`,
                    poll,
                    { timeout: 5000 }
                );
            }

            return {
                success: true,
                pollId: poll.id,
                poll: {
                    question: poll.question,
                    options: poll.options,
                    endsAt: poll.endsAt
                }
            };

        } catch (error) {
            console.error('Create poll error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Analytics & Insights
     */
    startStreamAnalytics(streamId) {
        const interval = setInterval(() => {
            this.collectStreamMetrics(streamId);
        }, this.config.analyticsInterval);

        const analytics = this.streamAnalytics.get(streamId);
        if (analytics) {
            analytics.interval = interval;
        }
    }

    async collectStreamMetrics(streamId) {
        try {
            const stream = this.activeStreams.get(streamId);
            const viewers = this.streamViewers.get(streamId);
            const analytics = this.streamAnalytics.get(streamId);

            if (!stream || !analytics) return;

            const metrics = {
                timestamp: Date.now(),
                currentViewers: viewers ? viewers.size : 0,
                totalViews: stream.analytics.totalViews,
                peakViewers: stream.analytics.peakViewers,
                interactions: stream.analytics.interactions,
                duration: Date.now() - stream.startedAt.getTime(),
                bitrate: 0,
                quality: stream.quality
            };

            // Get technical metrics from C++ service
            if (this.services.cpp.enabled) {
                try {
                    const response = await axios.get(
                        `${this.services.cpp.url}/streaming/metrics/${streamId}`,
                        { timeout: 5000 }
                    );
                    
                    metrics.bitrate = response.data.bitrate;
                    metrics.fps = response.data.fps;
                    metrics.droppedFrames = response.data.droppedFrames;
                } catch (error) {
                    // Metrics collection failed, continue with basic metrics
                }
            }

            analytics.events.push(metrics);

            // Keep only recent metrics (last hour)
            const cutoff = Date.now() - 60 * 60 * 1000;
            analytics.events = analytics.events.filter(event => event.timestamp > cutoff);

        } catch (error) {
            console.error('Metrics collection error:', error);
        }
    }

    trackStreamEvent(streamId, eventType, eventData) {
        const analytics = this.streamAnalytics.get(streamId);
        if (analytics) {
            analytics.events.push({
                type: eventType,
                data: eventData,
                timestamp: Date.now()
            });
        }
    }

    async getStreamAnalytics(streamId, streamerId) {
        try {
            const stream = this.activeStreams.get(streamId);
            if (!stream) {
                throw new Error('Stream not found');
            }

            if (stream.streamerId !== streamerId) {
                throw new Error('Unauthorized');
            }

            const analytics = this.streamAnalytics.get(streamId);
            const viewers = this.streamViewers.get(streamId);

            return {
                success: true,
                analytics: {
                    basic: {
                        currentViewers: viewers ? viewers.size : 0,
                        totalViews: stream.analytics.totalViews,
                        peakViewers: stream.analytics.peakViewers,
                        totalDuration: stream.status === 'live' 
                            ? Date.now() - stream.startedAt.getTime()
                            : stream.analytics.totalDuration,
                        interactions: stream.analytics.interactions
                    },
                    timeline: analytics ? analytics.events : [],
                    engagement: await this.calculateEngagementMetrics(streamId)
                }
            };

        } catch (error) {
            console.error('Get analytics error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Content Delivery Optimization
     */
    async initializeCDN() {
        if (this.services.go.enabled) {
            try {
                await axios.post(
                    `${this.services.go.url}/cdn/streaming-setup`,
                    {
                        qualityLevels: this.config.qualityLevels,
                        regions: ['us-east', 'us-west', 'eu', 'asia']
                    },
                    { timeout: 10000 }
                );
                
                console.log('✅ CDN initialized for streaming');
            } catch (error) {
                console.error('CDN initialization error:', error);
            }
        }
    }

    async optimizeStreamDelivery(streamId, viewerLocation) {
        if (this.services.go.enabled) {
            try {
                const response = await axios.post(
                    `${this.services.go.url}/cdn/optimize-stream`,
                    { streamId, viewerLocation },
                    { timeout: 5000 }
                );

                return {
                    optimizedUrl: response.data.optimizedUrl,
                    edge: response.data.edge,
                    latency: response.data.estimatedLatency
                };
            } catch (error) {
                console.error('Stream optimization error:', error);
                return null;
            }
        }
        return null;
    }

    /**
     * Stream Management
     */
    initializeStreamManagement() {
        // Cleanup inactive streams
        setInterval(() => {
            this.cleanupInactiveStreams();
        }, 5 * 60 * 1000); // Every 5 minutes
    }

    cleanupInactiveStreams() {
        const now = Date.now();
        
        for (const [streamId, stream] of this.activeStreams.entries()) {
            const lastActivity = stream.startedAt || stream.createdAt;
            const inactiveTime = now - lastActivity.getTime();
            
            if (inactiveTime > this.config.streamTimeout) {
                console.log(`🧹 Cleaning up inactive stream: ${streamId}`);
                this.stopStream(streamId, stream.streamerId);
                this.activeStreams.delete(streamId);
                this.streamViewers.delete(streamId);
                
                const analytics = this.streamAnalytics.get(streamId);
                if (analytics && analytics.interval) {
                    clearInterval(analytics.interval);
                }
                this.streamAnalytics.delete(streamId);
            }
        }
    }

    /**
     * Utility Methods
     */
    generateStreamId() {
        return `stream_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    generateMessageId() {
        return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    generatePollId() {
        return `poll_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    async calculateEngagementMetrics(streamId) {
        // Calculate engagement rate, interaction patterns, etc.
        return {
            engagementRate: 0,
            chatActivity: 0,
            pollParticipation: 0
        };
    }

    // Public API methods
    async getActiveStreams() {
        const streams = [];
        
        for (const [streamId, stream] of this.activeStreams.entries()) {
            if (stream.status === 'live' && !stream.isPrivate) {
                const viewers = this.streamViewers.get(streamId);
                streams.push({
                    streamId,
                    title: stream.title,
                    category: stream.category,
                    streamerId: stream.streamerId,
                    currentViewers: viewers ? viewers.size : 0,
                    startedAt: stream.startedAt
                });
            }
        }

        return streams.sort((a, b) => b.currentViewers - a.currentViewers);
    }

    async getStreamInfo(streamId) {
        const stream = this.activeStreams.get(streamId);
        const viewers = this.streamViewers.get(streamId);
        
        if (!stream) return null;

        return {
            ...stream,
            currentViewers: viewers ? viewers.size : 0
        };
    }
}

module.exports = new AdvancedStreamingService();
