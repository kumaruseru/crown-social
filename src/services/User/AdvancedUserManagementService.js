/**
 * Advanced User Management Service - Comprehensive User Lifecycle Management
 * Crown Social Network - 9-Language Polyglot System
 * 
 * Features:
 * - Advanced user profile management
 * - Multi-tier account types & permissions
 * - Social graph management
 * - Activity tracking & behavioral analysis
 * - Account health & reputation system
 * - User lifecycle automation
 * - Advanced search & discovery
 * - Cross-platform user synchronization
 */

const crypto = require('crypto');
const axios = require('axios');

class AdvancedUserManagementService {
    constructor() {
        this.services = {
            go: {
                url: process.env.GO_USER_URL || 'http://localhost:8000',
                enabled: process.env.GO_USER_ENABLED !== 'false'
            },
            python: {
                url: process.env.PYTHON_USER_URL || 'http://localhost:5000',
                enabled: process.env.PYTHON_USER_ENABLED !== 'false'
            },
            csharp: {
                url: process.env.CSHARP_USER_URL || 'http://localhost:5050',
                enabled: process.env.CSHARP_USER_ENABLED !== 'false'
            },
            java: {
                url: process.env.JAVA_USER_URL || 'http://localhost:8080',
                enabled: process.env.JAVA_USER_ENABLED !== 'false'
            },
            elixir: {
                url: process.env.ELIXIR_USER_URL || 'http://localhost:4000',
                enabled: process.env.ELIXIR_USER_ENABLED !== 'false'
            }
        };

        this.config = {
            accounts: {
                types: ['BASIC', 'PREMIUM', 'CREATOR', 'BUSINESS', 'ADMIN'],
                defaultType: 'BASIC',
                premiumFeatures: [
                    'ADVANCED_ANALYTICS',
                    'PRIORITY_SUPPORT',
                    'ENHANCED_PRIVACY',
                    'CUSTOM_BRANDING',
                    'ADVANCED_MODERATION',
                    'API_ACCESS'
                ],
                limits: {
                    BASIC: {
                        posts: 100,
                        followers: 5000,
                        fileSize: 10 * 1024 * 1024, // 10MB
                        api_calls: 1000
                    },
                    PREMIUM: {
                        posts: 1000,
                        followers: 50000,
                        fileSize: 100 * 1024 * 1024, // 100MB
                        api_calls: 10000
                    },
                    CREATOR: {
                        posts: 10000,
                        followers: 1000000,
                        fileSize: 500 * 1024 * 1024, // 500MB
                        api_calls: 50000
                    },
                    BUSINESS: {
                        posts: -1, // unlimited
                        followers: -1, // unlimited
                        fileSize: 1024 * 1024 * 1024, // 1GB
                        api_calls: 100000
                    }
                }
            },
            profiles: {
                requiredFields: ['username', 'email'],
                optionalFields: [
                    'firstName', 'lastName', 'bio', 'location', 'website', 
                    'birthday', 'gender', 'interests', 'languages'
                ],
                maxBioLength: 500,
                maxInterests: 10,
                profilePictureSize: 5 * 1024 * 1024, // 5MB
                coverPhotoSize: 10 * 1024 * 1024 // 10MB
            },
            social: {
                maxFollowing: 7500,
                maxBlocked: 1000,
                maxMuted: 2000,
                suggestionAlgorithms: ['MUTUAL_FRIENDS', 'INTERESTS', 'LOCATION', 'ACTIVITY'],
                relationshipTypes: ['FOLLOW', 'FRIEND', 'BLOCK', 'MUTE', 'CLOSE_FRIEND']
            },
            reputation: {
                initialScore: 100,
                maxScore: 1000,
                minScore: 0,
                factors: {
                    POST_ENGAGEMENT: 1,
                    HELPFUL_COMMENTS: 2,
                    COMMUNITY_PARTICIPATION: 3,
                    CONTENT_QUALITY: 5,
                    VIOLATIONS: -10,
                    SPAM_REPORTS: -5
                }
            }
        };

        this.userProfiles = new Map();
        this.socialGraph = new Map();
        this.userSessions = new Map();
        this.reputationScores = new Map();
        this.userActivities = new Map();
        this.accountUpgrades = new Map();

        this.initialized = false;
        this.init();
    }

    async init() {
        try {
            console.log('👤 Initializing Advanced User Management Service...');
            console.log('🌐 Comprehensive User Lifecycle & Social Graph');
            
            // Test user management services
            await this.testUserServices();
            
            // Initialize user data structures
            await this.initializeUserData();
            
            // Start background processes
            this.startUserMonitoring();
            this.startReputationCalculation();
            
            this.initialized = true;
            console.log('✅ Advanced User Management Service initialized successfully');
            
        } catch (error) {
            console.error('❌ User Management initialization error:', error);
        }
    }

    async testUserServices() {
        const testPromises = Object.entries(this.services)
            .filter(([, config]) => config.enabled)
            .map(([service, config]) => this.testUserService(service, config.url));

        await Promise.allSettled(testPromises);
    }

    async testUserService(service, url) {
        try {
            const response = await axios.get(`${url}/user/health`, { timeout: 5000 });
            if (response.status === 200) {
                console.log(`✅ ${service.toUpperCase()} user service connected`);
                return true;
            }
        } catch (error) {
            console.log(`⚠️ ${service.toUpperCase()} user service unavailable`);
            this.services[service].enabled = false;
            return false;
        }
    }

    /**
     * Advanced Profile Management
     */
    async createUserProfile(userData) {
        try {
            const userId = crypto.randomBytes(16).toString('hex');
            
            // Validate required fields
            const validation = this.validateUserData(userData);
            if (!validation.valid) {
                return {
                    success: false,
                    errors: validation.errors
                };
            }

            // Check username uniqueness
            const usernameExists = await this.checkUsernameAvailability(userData.username);
            if (!usernameExists.available) {
                return {
                    success: false,
                    error: 'Username already taken',
                    suggestions: usernameExists.suggestions
                };
            }

            // Create comprehensive profile
            const profile = {
                id: userId,
                username: userData.username,
                email: userData.email,
                accountType: userData.accountType || this.config.accounts.defaultType,
                profile: {
                    firstName: userData.firstName || '',
                    lastName: userData.lastName || '',
                    displayName: userData.displayName || userData.username,
                    bio: userData.bio || '',
                    location: userData.location || '',
                    website: userData.website || '',
                    birthday: userData.birthday || null,
                    gender: userData.gender || '',
                    interests: userData.interests || [],
                    languages: userData.languages || ['en'],
                    profilePicture: userData.profilePicture || null,
                    coverPhoto: userData.coverPhoto || null,
                    visibility: userData.visibility || 'public'
                },
                stats: {
                    followers: 0,
                    following: 0,
                    posts: 0,
                    likes: 0,
                    comments: 0,
                    shares: 0
                },
                settings: {
                    privacy: {
                        profileVisibility: 'public',
                        allowFollows: true,
                        allowMessages: true,
                        allowTagging: true
                    },
                    notifications: {
                        email: true,
                        push: true,
                        inApp: true
                    },
                    language: 'en',
                    timezone: 'UTC'
                },
                metadata: {
                    createdAt: Date.now(),
                    updatedAt: Date.now(),
                    lastActive: Date.now(),
                    emailVerified: false,
                    phoneVerified: false,
                    twoFactorEnabled: false,
                    accountStatus: 'ACTIVE',
                    verificationLevel: 'UNVERIFIED'
                }
            };

            // Store profile with Go service for high-performance access
            if (this.services.go.enabled) {
                await axios.post(
                    `${this.services.go.url}/user/profile`,
                    profile,
                    { timeout: 10000 }
                );
            }

            // Cache locally
            this.userProfiles.set(userId, profile);

            // Initialize reputation score
            this.reputationScores.set(userId, this.config.reputation.initialScore);

            // Initialize social graph entry
            this.socialGraph.set(userId, {
                followers: new Set(),
                following: new Set(),
                blocked: new Set(),
                muted: new Set(),
                closeFriends: new Set()
            });

            return {
                success: true,
                userId,
                profile,
                message: 'User profile created successfully'
            };

        } catch (error) {
            console.error('Profile creation error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    async updateUserProfile(userId, updates) {
        try {
            const profile = this.userProfiles.get(userId);
            if (!profile) {
                return {
                    success: false,
                    error: 'User profile not found'
                };
            }

            // Validate updates
            const validation = this.validateUserData(updates, true);
            if (!validation.valid) {
                return {
                    success: false,
                    errors: validation.errors
                };
            }

            // Apply updates
            if (updates.profile) {
                Object.assign(profile.profile, updates.profile);
            }
            if (updates.settings) {
                Object.assign(profile.settings, updates.settings);
            }

            profile.metadata.updatedAt = Date.now();

            // Update in Go service
            if (this.services.go.enabled) {
                await axios.put(
                    `${this.services.go.url}/user/profile/${userId}`,
                    profile,
                    { timeout: 10000 }
                );
            }

            // Update cache
            this.userProfiles.set(userId, profile);

            return {
                success: true,
                profile,
                message: 'Profile updated successfully'
            };

        } catch (error) {
            console.error('Profile update error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Social Graph Management
     */
    async followUser(followerId, followeeId) {
        try {
            if (followerId === followeeId) {
                return {
                    success: false,
                    error: 'Cannot follow yourself'
                };
            }

            const followerGraph = this.socialGraph.get(followerId);
            const followeeGraph = this.socialGraph.get(followeeId);

            if (!followerGraph || !followeeGraph) {
                return {
                    success: false,
                    error: 'User not found'
                };
            }

            // Check if already following
            if (followerGraph.following.has(followeeId)) {
                return {
                    success: false,
                    error: 'Already following this user'
                };
            }

            // Check follow limits
            const followerProfile = this.userProfiles.get(followerId);
            const followLimit = this.config.accounts.limits[followerProfile.accountType]?.followers || 
                               this.config.social.maxFollowing;

            if (followerGraph.following.size >= followLimit) {
                return {
                    success: false,
                    error: 'Follow limit reached',
                    upgradeRequired: true
                };
            }

            // Check if target user is blocked
            if (followerGraph.blocked.has(followeeId) || followeeGraph.blocked.has(followerId)) {
                return {
                    success: false,
                    error: 'Cannot follow blocked user'
                };
            }

            // Create follow relationship
            followerGraph.following.add(followeeId);
            followeeGraph.followers.add(followerId);

            // Update stats
            const followerProfileData = this.userProfiles.get(followerId);
            const followeeProfileData = this.userProfiles.get(followeeId);

            followerProfileData.stats.following++;
            followeeProfileData.stats.followers++;

            // Sync with Elixir service for real-time notifications
            if (this.services.elixir.enabled) {
                await axios.post(
                    `${this.services.elixir.url}/user/follow`,
                    { followerId, followeeId },
                    { timeout: 5000 }
                );
            }

            // Update reputation scores
            await this.updateReputationScore(followeeId, 1, 'FOLLOWER_GAINED');

            return {
                success: true,
                relationship: 'FOLLOWING',
                message: 'Successfully followed user'
            };

        } catch (error) {
            console.error('Follow user error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    async unfollowUser(followerId, followeeId) {
        try {
            const followerGraph = this.socialGraph.get(followerId);
            const followeeGraph = this.socialGraph.get(followeeId);

            if (!followerGraph || !followeeGraph) {
                return {
                    success: false,
                    error: 'User not found'
                };
            }

            // Check if following
            if (!followerGraph.following.has(followeeId)) {
                return {
                    success: false,
                    error: 'Not following this user'
                };
            }

            // Remove follow relationship
            followerGraph.following.delete(followeeId);
            followeeGraph.followers.delete(followerId);

            // Update stats
            const followerProfile = this.userProfiles.get(followerId);
            const followeeProfile = this.userProfiles.get(followeeId);

            followerProfile.stats.following--;
            followeeProfile.stats.followers--;

            // Sync with Elixir service
            if (this.services.elixir.enabled) {
                await axios.post(
                    `${this.services.elixir.url}/user/unfollow`,
                    { followerId, followeeId },
                    { timeout: 5000 }
                );
            }

            return {
                success: true,
                relationship: 'NONE',
                message: 'Successfully unfollowed user'
            };

        } catch (error) {
            console.error('Unfollow user error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    async getUserRecommendations(userId, algorithm = 'MIXED', limit = 20) {
        try {
            // Use Python service for advanced recommendation algorithms
            if (this.services.python.enabled) {
                const response = await axios.post(
                    `${this.services.python.url}/user/recommendations`,
                    {
                        userId,
                        algorithm,
                        limit,
                        userProfile: this.userProfiles.get(userId),
                        socialGraph: Array.from(this.socialGraph.get(userId)?.following || [])
                    },
                    { timeout: 15000 }
                );

                const recommendations = response.data.recommendations;

                // Enhance recommendations with local data
                const enhancedRecommendations = recommendations.map(rec => {
                    const profile = this.userProfiles.get(rec.userId);
                    return {
                        ...rec,
                        profile: profile ? {
                            username: profile.username,
                            displayName: profile.profile.displayName,
                            profilePicture: profile.profile.profilePicture,
                            bio: profile.profile.bio,
                            followers: profile.stats.followers,
                            verificationLevel: profile.metadata.verificationLevel
                        } : null
                    };
                });

                return {
                    success: true,
                    recommendations: enhancedRecommendations,
                    algorithm,
                    total: enhancedRecommendations.length
                };
            }

            // Fallback recommendation logic
            const fallbackRecommendations = await this.generateFallbackRecommendations(userId, limit);

            return {
                success: true,
                recommendations: fallbackRecommendations,
                algorithm: 'FALLBACK',
                total: fallbackRecommendations.length
            };

        } catch (error) {
            console.error('User recommendations error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Account Management & Verification
     */
    async upgradeAccount(userId, targetType, paymentInfo) {
        try {
            const profile = this.userProfiles.get(userId);
            if (!profile) {
                return {
                    success: false,
                    error: 'User profile not found'
                };
            }

            if (!this.config.accounts.types.includes(targetType)) {
                return {
                    success: false,
                    error: 'Invalid account type'
                };
            }

            const currentType = profile.accountType;
            if (currentType === targetType) {
                return {
                    success: false,
                    error: 'Already at this account level'
                };
            }

            // Process payment with Java service
            if (this.services.java.enabled) {
                const paymentResponse = await axios.post(
                    `${this.services.java.url}/user/payment/upgrade`,
                    {
                        userId,
                        currentType,
                        targetType,
                        paymentInfo
                    },
                    { timeout: 30000 }
                );

                if (!paymentResponse.data.success) {
                    return {
                        success: false,
                        error: 'Payment processing failed',
                        details: paymentResponse.data.error
                    };
                }
            }

            // Update account type
            profile.accountType = targetType;
            profile.metadata.updatedAt = Date.now();

            // Record upgrade
            const upgradeRecord = {
                id: crypto.randomBytes(16).toString('hex'),
                userId,
                fromType: currentType,
                toType: targetType,
                timestamp: Date.now(),
                paymentId: paymentInfo.paymentId || null,
                features: this.getAccountFeatures(targetType)
            };

            this.accountUpgrades.set(upgradeRecord.id, upgradeRecord);

            // Update profile in storage
            this.userProfiles.set(userId, profile);

            return {
                success: true,
                accountType: targetType,
                features: upgradeRecord.features,
                upgradeId: upgradeRecord.id,
                message: `Account upgraded to ${targetType}`
            };

        } catch (error) {
            console.error('Account upgrade error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    async verifyUser(userId, verificationType, documentation) {
        try {
            const profile = this.userProfiles.get(userId);
            if (!profile) {
                return {
                    success: false,
                    error: 'User profile not found'
                };
            }

            // Process verification with C# service
            if (this.services.csharp.enabled) {
                const verificationResponse = await axios.post(
                    `${this.services.csharp.url}/user/verification`,
                    {
                        userId,
                        type: verificationType, // 'EMAIL', 'PHONE', 'IDENTITY', 'BLUE_CHECK'
                        documentation,
                        profile: profile.profile
                    },
                    { timeout: 60000 }
                );

                const verificationResult = verificationResponse.data;

                if (verificationResult.success) {
                    // Update verification status
                    switch (verificationType) {
                        case 'EMAIL':
                            profile.metadata.emailVerified = true;
                            break;
                        case 'PHONE':
                            profile.metadata.phoneVerified = true;
                            break;
                        case 'IDENTITY':
                            profile.metadata.verificationLevel = 'VERIFIED';
                            break;
                        case 'BLUE_CHECK':
                            profile.metadata.verificationLevel = 'BLUE_VERIFIED';
                            break;
                    }

                    profile.metadata.updatedAt = Date.now();
                    this.userProfiles.set(userId, profile);

                    // Update reputation score for verification
                    await this.updateReputationScore(userId, 50, 'VERIFICATION_COMPLETED');

                    return {
                        success: true,
                        verificationType,
                        verificationLevel: profile.metadata.verificationLevel,
                        message: 'Verification completed successfully'
                    };
                } else {
                    return {
                        success: false,
                        error: verificationResult.error || 'Verification failed'
                    };
                }
            }

            return {
                success: false,
                error: 'Verification service unavailable'
            };

        } catch (error) {
            console.error('User verification error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Activity Tracking & Analytics
     */
    async trackUserActivity(userId, activity) {
        try {
            const activityId = crypto.randomBytes(16).toString('hex');
            const activityRecord = {
                id: activityId,
                userId,
                type: activity.type, // 'POST', 'LIKE', 'COMMENT', 'SHARE', 'LOGIN', 'PROFILE_VIEW'
                timestamp: Date.now(),
                metadata: activity.metadata || {},
                ip: activity.ip,
                userAgent: activity.userAgent,
                location: activity.location
            };

            // Store activity
            let userActivities = this.userActivities.get(userId) || [];
            userActivities.push(activityRecord);
            
            // Keep only recent activities (last 1000)
            if (userActivities.length > 1000) {
                userActivities = userActivities.slice(-1000);
            }
            
            this.userActivities.set(userId, userActivities);

            // Update last active timestamp
            const profile = this.userProfiles.get(userId);
            if (profile) {
                profile.metadata.lastActive = Date.now();
                this.userProfiles.set(userId, profile);
            }

            // Send to Python service for behavioral analysis
            if (this.services.python.enabled) {
                axios.post(
                    `${this.services.python.url}/user/activity/analyze`,
                    {
                        userId,
                        activity: activityRecord,
                        recentActivities: userActivities.slice(-10) // Last 10 activities
                    },
                    { timeout: 5000 }
                ).catch(err => console.warn('Activity analysis failed:', err.message));
            }

            return {
                success: true,
                activityId,
                timestamp: activityRecord.timestamp
            };

        } catch (error) {
            console.error('Activity tracking error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    async getUserAnalytics(userId, timeframe = '7d') {
        try {
            const activities = this.userActivities.get(userId) || [];
            const now = Date.now();
            const timeframeDuration = this.parseTimeframe(timeframe);
            const startTime = now - timeframeDuration;

            const filteredActivities = activities.filter(
                activity => activity.timestamp >= startTime
            );

            const analytics = {
                userId,
                timeframe,
                period: { start: startTime, end: now },
                totalActivities: filteredActivities.length,
                activityBreakdown: {},
                dailyActivity: {},
                engagementScore: 0,
                topInteractions: []
            };

            // Calculate activity breakdown
            filteredActivities.forEach(activity => {
                analytics.activityBreakdown[activity.type] = 
                    (analytics.activityBreakdown[activity.type] || 0) + 1;
                
                // Daily activity
                const day = new Date(activity.timestamp).toISOString().split('T')[0];
                analytics.dailyActivity[day] = (analytics.dailyActivity[day] || 0) + 1;
            });

            // Calculate engagement score
            const weights = { POST: 5, COMMENT: 3, LIKE: 1, SHARE: 2, LOGIN: 0.5 };
            analytics.engagementScore = Object.entries(analytics.activityBreakdown)
                .reduce((score, [type, count]) => score + (count * (weights[type] || 1)), 0);

            return {
                success: true,
                analytics
            };

        } catch (error) {
            console.error('User analytics error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Reputation System
     */
    async updateReputationScore(userId, change, reason) {
        try {
            const currentScore = this.reputationScores.get(userId) || this.config.reputation.initialScore;
            const newScore = Math.max(
                this.config.reputation.minScore,
                Math.min(this.config.reputation.maxScore, currentScore + change)
            );

            this.reputationScores.set(userId, newScore);

            // Log reputation change
            console.log(`👤 User ${userId} reputation: ${currentScore} → ${newScore} (${reason})`);

            return {
                success: true,
                previousScore: currentScore,
                newScore,
                change,
                reason
            };

        } catch (error) {
            console.error('Reputation update error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    async calculateReputationScore(userId) {
        try {
            const activities = this.userActivities.get(userId) || [];
            const profile = this.userProfiles.get(userId);
            
            if (!profile) {
                return {
                    success: false,
                    error: 'User not found'
                };
            }

            let score = this.config.reputation.initialScore;

            // Calculate based on various factors
            const factors = this.config.reputation.factors;
            
            // Activity-based reputation
            const recentActivities = activities.filter(
                a => a.timestamp > (Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
            );

            recentActivities.forEach(activity => {
                switch (activity.type) {
                    case 'POST':
                        score += factors.POST_ENGAGEMENT;
                        break;
                    case 'COMMENT':
                        score += factors.HELPFUL_COMMENTS;
                        break;
                    case 'LIKE':
                    case 'SHARE':
                        score += factors.COMMUNITY_PARTICIPATION;
                        break;
                }
            });

            // Profile completeness bonus
            const completeness = this.calculateProfileCompleteness(profile);
            score += completeness * 10; // Up to 10 points for complete profile

            // Verification bonus
            if (profile.metadata.emailVerified) score += 10;
            if (profile.metadata.phoneVerified) score += 15;
            if (profile.metadata.verificationLevel === 'VERIFIED') score += 25;
            if (profile.metadata.verificationLevel === 'BLUE_VERIFIED') score += 50;

            // Follower ratio (quality over quantity)
            const followerRatio = profile.stats.followers / Math.max(profile.stats.following, 1);
            if (followerRatio > 2) score += 20;
            else if (followerRatio > 1) score += 10;

            // Ensure score is within bounds
            score = Math.max(
                this.config.reputation.minScore,
                Math.min(this.config.reputation.maxScore, score)
            );

            this.reputationScores.set(userId, score);

            return {
                success: true,
                score,
                factors: {
                    base: this.config.reputation.initialScore,
                    activities: recentActivities.length,
                    profileCompleteness: completeness,
                    verification: profile.metadata.verificationLevel,
                    followerRatio
                }
            };

        } catch (error) {
            console.error('Reputation calculation error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Background Processing
     */
    startUserMonitoring() {
        setInterval(async () => {
            await this.cleanupInactiveSessions();
        }, 60 * 60 * 1000); // Every hour

        setInterval(async () => {
            await this.updateUserStats();
        }, 5 * 60 * 1000); // Every 5 minutes
    }

    startReputationCalculation() {
        setInterval(async () => {
            await this.recalculateAllReputations();
        }, 24 * 60 * 60 * 1000); // Daily
    }

    async recalculateAllReputations() {
        try {
            console.log('🔄 Recalculating user reputation scores...');
            
            const userIds = Array.from(this.userProfiles.keys());
            let processed = 0;

            for (const userId of userIds) {
                await this.calculateReputationScore(userId);
                processed++;
                
                if (processed % 100 === 0) {
                    console.log(`📊 Processed ${processed}/${userIds.length} reputation scores`);
                }
            }

            console.log('✅ Reputation recalculation completed');

        } catch (error) {
            console.error('Reputation recalculation error:', error);
        }
    }

    /**
     * Utility Methods
     */
    validateUserData(userData, isUpdate = false) {
        const errors = [];

        if (!isUpdate) {
            // Required fields for new users
            if (!userData.username) errors.push('Username is required');
            if (!userData.email) errors.push('Email is required');
        }

        // Validate username format
        if (userData.username && !/^[a-zA-Z0-9_]{3,30}$/.test(userData.username)) {
            errors.push('Username must be 3-30 characters, alphanumeric and underscores only');
        }

        // Validate email format
        if (userData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(userData.email)) {
            errors.push('Invalid email format');
        }

        // Validate bio length
        if (userData.bio && userData.bio.length > this.config.profiles.maxBioLength) {
            errors.push(`Bio cannot exceed ${this.config.profiles.maxBioLength} characters`);
        }

        // Validate interests
        if (userData.interests && userData.interests.length > this.config.profiles.maxInterests) {
            errors.push(`Cannot have more than ${this.config.profiles.maxInterests} interests`);
        }

        return {
            valid: errors.length === 0,
            errors
        };
    }

    async checkUsernameAvailability(username) {
        try {
            // Check local cache first
            const existing = Array.from(this.userProfiles.values())
                .find(profile => profile.username.toLowerCase() === username.toLowerCase());

            if (existing) {
                // Generate suggestions
                const suggestions = [];
                for (let i = 1; i <= 5; i++) {
                    suggestions.push(`${username}${i}`);
                    suggestions.push(`${username}_${i}`);
                }

                return {
                    available: false,
                    suggestions: suggestions.slice(0, 3)
                };
            }

            // Check with Go service for distributed availability
            if (this.services.go.enabled) {
                const response = await axios.get(
                    `${this.services.go.url}/user/username/check/${encodeURIComponent(username)}`,
                    { timeout: 5000 }
                );

                return response.data;
            }

            return { available: true };

        } catch (error) {
            console.error('Username availability check error:', error);
            return { available: false, error: error.message };
        }
    }

    getAccountFeatures(accountType) {
        const limits = this.config.accounts.limits[accountType] || {};
        const features = [];

        if (accountType !== 'BASIC') {
            features.push(...this.config.accounts.premiumFeatures.slice(0, 
                accountType === 'PREMIUM' ? 2 : 
                accountType === 'CREATOR' ? 4 : 
                this.config.accounts.premiumFeatures.length
            ));
        }

        return {
            type: accountType,
            limits,
            features
        };
    }

    calculateProfileCompleteness(profile) {
        const requiredFields = this.config.profiles.requiredFields;
        const optionalFields = this.config.profiles.optionalFields;
        
        let completedRequired = 0;
        let completedOptional = 0;

        requiredFields.forEach(field => {
            if (profile[field] || profile.profile?.[field]) completedRequired++;
        });

        optionalFields.forEach(field => {
            if (profile.profile?.[field]) completedOptional++;
        });

        const requiredScore = (completedRequired / requiredFields.length) * 0.7; // 70% weight
        const optionalScore = (completedOptional / optionalFields.length) * 0.3; // 30% weight

        return Math.round((requiredScore + optionalScore) * 100) / 100; // 0-1 score
    }

    async generateFallbackRecommendations(userId, limit) {
        // Simple fallback recommendation logic
        const recommendations = [];
        const userProfile = this.userProfiles.get(userId);
        
        if (!userProfile) return recommendations;

        const userInterests = userProfile.profile.interests || [];
        
        // Find users with similar interests
        for (const [otherUserId, otherProfile] of this.userProfiles.entries()) {
            if (otherUserId === userId || recommendations.length >= limit) continue;

            const otherInterests = otherProfile.profile.interests || [];
            const commonInterests = userInterests.filter(interest => 
                otherInterests.includes(interest)
            );

            if (commonInterests.length > 0) {
                recommendations.push({
                    userId: otherUserId,
                    reason: 'SHARED_INTERESTS',
                    score: commonInterests.length / userInterests.length,
                    commonInterests,
                    profile: {
                        username: otherProfile.username,
                        displayName: otherProfile.profile.displayName,
                        profilePicture: otherProfile.profile.profilePicture,
                        followers: otherProfile.stats.followers
                    }
                });
            }
        }

        return recommendations.sort((a, b) => b.score - a.score).slice(0, limit);
    }

    parseTimeframe(timeframe) {
        const unit = timeframe.slice(-1);
        const value = parseInt(timeframe.slice(0, -1));
        
        switch (unit) {
            case 'h': return value * 60 * 60 * 1000;
            case 'd': return value * 24 * 60 * 60 * 1000;
            case 'w': return value * 7 * 24 * 60 * 60 * 1000;
            default: return 7 * 24 * 60 * 60 * 1000; // Default to 7 days
        }
    }

    // Placeholder methods for integration
    async initializeUserData() { /* Initialize user data structures */ }
    async cleanupInactiveSessions() { /* Cleanup inactive sessions */ }
    async updateUserStats() { /* Update user statistics */ }
}

module.exports = new AdvancedUserManagementService();
