/**
 * Enhanced AI Service - Tích hợp AI cho Crown Social Network
 * Phase 1 Completion - All Languages Integration
 * 
 * Features:
 * - Content moderation với AI
 * - Smart recommendations
 * - Image analysis và classification
 * - Natural language processing
 * - Real-time sentiment analysis
 * - Multi-language AI processing pipeline
 */

const axios = require('axios');
const FormData = require('form-data');

class EnhancedAIService {
    constructor() {
        this.services = {
            python: {
                url: process.env.PYTHON_AI_SERVICE_URL || 'http://localhost:5000',
                enabled: process.env.PYTHON_AI_ENABLED !== 'false'
            },
            cpp: {
                url: process.env.CPP_AI_SERVICE_URL || 'http://localhost:8080',
                enabled: process.env.CPP_AI_ENABLED !== 'false'
            },
            java: {
                url: process.env.JAVA_AI_SERVICE_URL || 'http://localhost:8090',
                enabled: process.env.JAVA_AI_ENABLED !== 'false'
            },
            csharp: {
                url: process.env.CSHARP_AI_SERVICE_URL || 'http://localhost:5050',
                enabled: process.env.CSHARP_AI_ENABLED !== 'false'
            }
        };

        this.initialized = false;
        this.init();
    }

    async init() {
        try {
            console.log('🤖 Initializing Enhanced AI Service...');
            
            // Test connectivity to AI services
            const testPromises = Object.entries(this.services)
                .filter(([, config]) => config.enabled)
                .map(([service, config]) => this.testServiceConnectivity(service, config.url));

            await Promise.allSettled(testPromises);
            
            this.initialized = true;
            console.log('✅ Enhanced AI Service initialized successfully');
        } catch (error) {
            console.error('❌ AI Service initialization error:', error);
        }
    }

    async testServiceConnectivity(service, url) {
        try {
            const response = await axios.get(`${url}/health`, { timeout: 5000 });
            if (response.status === 200) {
                console.log(`✅ ${service.toUpperCase()} AI service connected`);
                return true;
            }
        } catch (error) {
            console.log(`⚠️ ${service.toUpperCase()} AI service unavailable - will use fallback`);
            this.services[service].enabled = false;
            return false;
        }
    }

    /**
     * Content Moderation với AI
     */
    async moderateContent(content, contentType = 'text') {
        try {
            // Primary: Python AI service for NLP
            if (this.services.python.enabled) {
                const response = await axios.post(`${this.services.python.url}/moderate`, {
                    content,
                    type: contentType
                }, { timeout: 10000 });

                return {
                    isAppropriate: response.data.is_appropriate,
                    confidence: response.data.confidence,
                    categories: response.data.categories || [],
                    sentiment: response.data.sentiment,
                    language: response.data.language,
                    service: 'python'
                };
            }

            // Fallback: Local rule-based moderation
            return this.localModerationFallback(content);

        } catch (error) {
            console.error('AI moderation error:', error);
            return this.localModerationFallback(content);
        }
    }

    /**
     * Image Analysis và Classification
     */
    async analyzeImage(imagePath, analysisType = 'general') {
        try {
            const formData = new FormData();
            formData.append('image', require('fs').createReadStream(imagePath));
            formData.append('analysis_type', analysisType);

            // Primary: Python AI for image analysis
            if (this.services.python.enabled) {
                const response = await axios.post(
                    `${this.services.python.url}/analyze-image`,
                    formData,
                    {
                        headers: formData.getHeaders(),
                        timeout: 30000
                    }
                );

                return {
                    objects: response.data.objects || [],
                    faces: response.data.faces || [],
                    text: response.data.text || '',
                    inappropriate: response.data.inappropriate || false,
                    confidence: response.data.confidence || 0,
                    tags: response.data.tags || [],
                    colors: response.data.colors || [],
                    service: 'python'
                };
            }

            // Fallback: C++ service for basic analysis
            if (this.services.cpp.enabled) {
                const response = await axios.post(
                    `${this.services.cpp.url}/analyze-image`,
                    formData,
                    {
                        headers: formData.getHeaders(),
                        timeout: 30000
                    }
                );

                return {
                    objects: response.data.objects || [],
                    inappropriate: response.data.inappropriate || false,
                    service: 'cpp'
                };
            }

            return { objects: [], faces: [], inappropriate: false, service: 'fallback' };

        } catch (error) {
            console.error('Image analysis error:', error);
            return { objects: [], faces: [], inappropriate: false, service: 'fallback' };
        }
    }

    /**
     * Smart Content Recommendations
     */
    async getContentRecommendations(userId, options = {}) {
        try {
            const {
                type = 'posts',
                limit = 10,
                userInterests = [],
                context = {}
            } = options;

            // Primary: Java service for recommendation engine
            if (this.services.java.enabled) {
                const response = await axios.post(
                    `${this.services.java.url}/recommendations`,
                    {
                        userId,
                        type,
                        limit,
                        userInterests,
                        context
                    },
                    { timeout: 15000 }
                );

                return {
                    recommendations: response.data.recommendations || [],
                    confidence: response.data.confidence || 0,
                    algorithm: response.data.algorithm || 'collaborative_filtering',
                    service: 'java'
                };
            }

            // Fallback: Simple recommendation logic
            return this.fallbackRecommendations(userId, options);

        } catch (error) {
            console.error('Recommendations error:', error);
            return this.fallbackRecommendations(userId, options);
        }
    }

    /**
     * Sentiment Analysis
     */
    async analyzeSentiment(text) {
        try {
            // Primary: Python NLP service
            if (this.services.python.enabled) {
                const response = await axios.post(`${this.services.python.url}/sentiment`, {
                    text
                }, { timeout: 10000 });

                return {
                    sentiment: response.data.sentiment, // positive, negative, neutral
                    score: response.data.score, // -1 to 1
                    confidence: response.data.confidence,
                    emotions: response.data.emotions || {},
                    service: 'python'
                };
            }

            // Fallback: Basic sentiment analysis
            return this.basicSentimentAnalysis(text);

        } catch (error) {
            console.error('Sentiment analysis error:', error);
            return this.basicSentimentAnalysis(text);
        }
    }

    /**
     * Smart Hashtag Generation
     */
    async generateHashtags(content, options = {}) {
        try {
            const { maxTags = 5, language = 'en' } = options;

            // Primary: Python NLP service
            if (this.services.python.enabled) {
                const response = await axios.post(`${this.services.python.url}/generate-hashtags`, {
                    content,
                    maxTags,
                    language
                }, { timeout: 10000 });

                return {
                    hashtags: response.data.hashtags || [],
                    keywords: response.data.keywords || [],
                    confidence: response.data.confidence || 0,
                    service: 'python'
                };
            }

            // Fallback: Simple keyword extraction
            return this.extractKeywordsForHashtags(content, maxTags);

        } catch (error) {
            console.error('Hashtag generation error:', error);
            return this.extractKeywordsForHashtags(content, maxTags);
        }
    }

    /**
     * Real-time Chat Intelligence
     */
    async enhanceMessage(message, context = {}) {
        try {
            const enhancements = await Promise.allSettled([
                this.analyzeSentiment(message.content),
                this.moderateContent(message.content, 'message'),
                this.extractEntities(message.content)
            ]);

            const [sentiment, moderation, entities] = enhancements.map(result => 
                result.status === 'fulfilled' ? result.value : null
            );

            return {
                originalMessage: message,
                sentiment: sentiment || null,
                moderation: moderation || null,
                entities: entities || null,
                suggestions: await this.getMessageSuggestions(message, context),
                enhanced: true
            };

        } catch (error) {
            console.error('Message enhancement error:', error);
            return {
                originalMessage: message,
                enhanced: false,
                error: error.message
            };
        }
    }

    /**
     * User Behavior Analysis
     */
    async analyzeUserBehavior(userId, timeframe = '7d') {
        try {
            // C# service for analytics
            if (this.services.csharp.enabled) {
                const response = await axios.post(
                    `${this.services.csharp.url}/analyze-behavior`,
                    { userId, timeframe },
                    { timeout: 15000 }
                );

                return {
                    engagement: response.data.engagement || {},
                    patterns: response.data.patterns || [],
                    interests: response.data.interests || [],
                    socialGraph: response.data.socialGraph || {},
                    predictions: response.data.predictions || {},
                    service: 'csharp'
                };
            }

            return this.basicBehaviorAnalysis(userId);

        } catch (error) {
            console.error('Behavior analysis error:', error);
            return this.basicBehaviorAnalysis(userId);
        }
    }

    /**
     * Fallback Methods
     */
    localModerationFallback(content) {
        const inappropriateWords = ['spam', 'hate', 'violence', 'abuse'];
        const hasInappropriate = inappropriateWords.some(word => 
            content.toLowerCase().includes(word)
        );

        return {
            isAppropriate: !hasInappropriate,
            confidence: 0.7,
            categories: hasInappropriate ? ['potentially_harmful'] : [],
            sentiment: 'neutral',
            service: 'fallback'
        };
    }

    basicSentimentAnalysis(text) {
        const positiveWords = ['good', 'great', 'awesome', 'love', 'happy', 'excellent'];
        const negativeWords = ['bad', 'hate', 'terrible', 'awful', 'sad', 'angry'];

        const positiveCount = positiveWords.filter(word => 
            text.toLowerCase().includes(word)
        ).length;
        
        const negativeCount = negativeWords.filter(word => 
            text.toLowerCase().includes(word)
        ).length;

        let sentiment = 'neutral';
        let score = 0;

        if (positiveCount > negativeCount) {
            sentiment = 'positive';
            score = Math.min(0.8, positiveCount * 0.2);
        } else if (negativeCount > positiveCount) {
            sentiment = 'negative';
            score = Math.max(-0.8, -negativeCount * 0.2);
        }

        return {
            sentiment,
            score,
            confidence: 0.6,
            emotions: {},
            service: 'fallback'
        };
    }

    extractKeywordsForHashtags(content, maxTags) {
        const words = content.toLowerCase()
            .replace(/[^\w\s]/g, '')
            .split(/\s+/)
            .filter(word => word.length > 3)
            .slice(0, maxTags);

        return {
            hashtags: words.map(word => `#${word}`),
            keywords: words,
            confidence: 0.5,
            service: 'fallback'
        };
    }

    async extractEntities(text) {
        // Simple entity extraction fallback
        const mentions = text.match(/@\w+/g) || [];
        const hashtags = text.match(/#\w+/g) || [];
        const urls = text.match(/(https?:\/\/[^\s]+)/g) || [];

        return {
            mentions: mentions.map(m => m.substring(1)),
            hashtags: hashtags.map(h => h.substring(1)),
            urls,
            service: 'fallback'
        };
    }

    async getMessageSuggestions(message, context) {
        // Basic message suggestions
        return {
            autoComplete: [],
            emoji: ['😊', '👍', '❤️'],
            quickReplies: ['Thanks!', 'Got it!', 'Sure thing!']
        };
    }

    fallbackRecommendations(userId, options) {
        return {
            recommendations: [],
            confidence: 0,
            algorithm: 'fallback',
            service: 'fallback'
        };
    }

    basicBehaviorAnalysis(userId) {
        return {
            engagement: { daily: 0, weekly: 0 },
            patterns: [],
            interests: [],
            socialGraph: {},
            predictions: {},
            service: 'fallback'
        };
    }
}

module.exports = new EnhancedAIService();
