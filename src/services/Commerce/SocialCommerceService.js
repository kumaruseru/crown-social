/**
 * Social Commerce Service - Phase 2 Shopping Integration
 * Crown Social Network - 9-Language Polyglot System
 * 
 * Features:
 * - In-app marketplace & shopping
 * - Social shopping experiences
 * - Influencer marketplace
 * - Payment processing integration
 * - Product discovery với AI
 * - Social proof & recommendations
 */

const axios = require('axios');

class SocialCommerceService {
    constructor() {
        this.services = {
            java: {
                url: process.env.JAVA_COMMERCE_URL || 'http://localhost:8090',
                enabled: process.env.JAVA_COMMERCE_ENABLED !== 'false'
            },
            csharp: {
                url: process.env.CSHARP_COMMERCE_URL || 'http://localhost:5050',
                enabled: process.env.CSHARP_COMMERCE_ENABLED !== 'false'
            },
            python: {
                url: process.env.PYTHON_COMMERCE_URL || 'http://localhost:5000',
                enabled: process.env.PYTHON_COMMERCE_ENABLED !== 'false'
            },
            swift: {
                url: process.env.SWIFT_COMMERCE_URL || 'http://localhost:8888',
                enabled: process.env.SWIFT_COMMERCE_ENABLED !== 'false'
            }
        };

        this.marketplace = {
            products: new Map(),
            sellers: new Map(),
            orders: new Map(),
            reviews: new Map(),
            recommendations: new Map()
        };

        this.socialFeatures = {
            wishLists: new Map(),
            shoppingLists: new Map(),
            influencerPosts: new Map(),
            socialProof: new Map()
        };

        this.config = {
            commissionRate: 0.05, // 5%
            maxProductsPerSeller: 10000,
            maxOrderValue: 50000, // $50,000
            paymentTimeout: 30 * 60 * 1000, // 30 minutes
            reviewCooldown: 24 * 60 * 60 * 1000, // 24 hours
        };

        this.initialized = false;
        this.init();
    }

    async init() {
        try {
            console.log('🛍️ Initializing Social Commerce Service...');
            console.log('💰 Phase 2 - Shopping & Marketplace Platform');
            
            // Test commerce services
            await this.testCommerceServices();
            
            // Initialize payment processing
            await this.initializePaymentProcessing();
            
            // Setup recommendation engine
            await this.setupRecommendationEngine();
            
            // Initialize social shopping features
            await this.initializeSocialFeatures();
            
            this.initialized = true;
            console.log('✅ Social Commerce Service initialized successfully');
            
        } catch (error) {
            console.error('❌ Social Commerce initialization error:', error);
        }
    }

    async testCommerceServices() {
        const testPromises = Object.entries(this.services)
            .filter(([, config]) => config.enabled)
            .map(([service, config]) => this.testService(service, config.url));

        await Promise.allSettled(testPromises);
    }

    async testService(service, url) {
        try {
            const response = await axios.get(`${url}/commerce/health`, { timeout: 5000 });
            if (response.status === 200) {
                console.log(`✅ ${service.toUpperCase()} commerce service connected`);
                return true;
            }
        } catch (error) {
            console.log(`⚠️ ${service.toUpperCase()} commerce service unavailable`);
            this.services[service].enabled = false;
            return false;
        }
    }

    /**
     * Product Management
     */
    async createProduct(sellerId, productData) {
        try {
            const {
                name,
                description,
                price,
                currency = 'USD',
                category,
                images = [],
                specifications = {},
                inventory = 0,
                shippingInfo = {},
                tags = []
            } = productData;

            const productId = this.generateProductId();
            
            const product = {
                productId,
                sellerId,
                name,
                description,
                price: parseFloat(price),
                currency,
                category,
                images,
                specifications,
                inventory: parseInt(inventory),
                shippingInfo,
                tags,
                status: 'pending_review',
                createdAt: new Date(),
                updatedAt: new Date(),
                analytics: {
                    views: 0,
                    likes: 0,
                    shares: 0,
                    purchases: 0,
                    revenue: 0
                },
                socialMetrics: {
                    influencerPosts: 0,
                    userGeneratedContent: 0,
                    socialShares: 0,
                    reviewCount: 0,
                    averageRating: 0
                }
            };

            // AI-powered product analysis với Python
            if (this.services.python.enabled) {
                try {
                    const response = await axios.post(
                        `${this.services.python.url}/commerce/analyze-product`,
                        { name, description, category, images },
                        { timeout: 15000 }
                    );

                    product.aiAnalysis = {
                        suggestedTags: response.data.suggestedTags || [],
                        categoryConfidence: response.data.categoryConfidence || 0,
                        pricingInsights: response.data.pricingInsights || {},
                        qualityScore: response.data.qualityScore || 0
                    };
                } catch (aiError) {
                    console.warn('AI product analysis failed:', aiError.message);
                }
            }

            // Store in Java service for enterprise features
            if (this.services.java.enabled) {
                await axios.post(
                    `${this.services.java.url}/commerce/products`,
                    product,
                    { timeout: 10000 }
                );
            }

            this.marketplace.products.set(productId, product);
            
            // Update seller stats
            const seller = this.marketplace.sellers.get(sellerId) || { productCount: 0, totalRevenue: 0 };
            seller.productCount++;
            this.marketplace.sellers.set(sellerId, seller);

            console.log(`📦 Product created: ${productId} by seller ${sellerId}`);

            return {
                success: true,
                productId,
                status: product.status,
                aiInsights: product.aiAnalysis
            };

        } catch (error) {
            console.error('Product creation error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    async updateProduct(productId, sellerId, updates) {
        try {
            const product = this.marketplace.products.get(productId);
            if (!product) {
                throw new Error('Product not found');
            }

            if (product.sellerId !== sellerId) {
                throw new Error('Unauthorized');
            }

            // Update product
            Object.assign(product, updates);
            product.updatedAt = new Date();

            // Re-analyze với AI if content changed
            if (updates.name || updates.description || updates.images) {
                if (this.services.python.enabled) {
                    try {
                        const response = await axios.post(
                            `${this.services.python.url}/commerce/analyze-product`,
                            { 
                                name: product.name, 
                                description: product.description, 
                                category: product.category,
                                images: product.images 
                            },
                            { timeout: 15000 }
                        );

                        product.aiAnalysis = {
                            ...product.aiAnalysis,
                            ...response.data,
                            lastAnalyzed: new Date()
                        };
                    } catch (aiError) {
                        console.warn('AI re-analysis failed:', aiError.message);
                    }
                }
            }

            this.marketplace.products.set(productId, product);

            return {
                success: true,
                product: {
                    productId,
                    updatedAt: product.updatedAt,
                    status: product.status
                }
            };

        } catch (error) {
            console.error('Product update error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Shopping Cart & Orders
     */
    async addToCart(userId, productId, quantity = 1, options = {}) {
        try {
            const product = this.marketplace.products.get(productId);
            if (!product) {
                throw new Error('Product not found');
            }

            if (product.status !== 'active') {
                throw new Error('Product not available');
            }

            if (product.inventory < quantity) {
                throw new Error('Insufficient inventory');
            }

            // Get or create user cart
            const cartKey = `cart_${userId}`;
            let cart = await this.getCart(userId);

            const cartItem = {
                productId,
                quantity,
                price: product.price,
                currency: product.currency,
                options,
                addedAt: new Date(),
                subtotal: product.price * quantity
            };

            // Check if product already in cart
            const existingIndex = cart.items.findIndex(item => item.productId === productId);
            if (existingIndex >= 0) {
                cart.items[existingIndex].quantity += quantity;
                cart.items[existingIndex].subtotal = cart.items[existingIndex].price * cart.items[existingIndex].quantity;
            } else {
                cart.items.push(cartItem);
            }

            // Update cart totals
            cart.itemCount = cart.items.reduce((sum, item) => sum + item.quantity, 0);
            cart.subtotal = cart.items.reduce((sum, item) => sum + item.subtotal, 0);
            cart.updatedAt = new Date();

            // Store cart (implement proper storage)
            await this.saveCart(userId, cart);

            // Track analytics
            product.analytics.views++;
            this.marketplace.products.set(productId, product);

            return {
                success: true,
                cart: {
                    itemCount: cart.itemCount,
                    subtotal: cart.subtotal,
                    currency: product.currency
                }
            };

        } catch (error) {
            console.error('Add to cart error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    async createOrder(userId, orderData) {
        try {
            const {
                items, // [{ productId, quantity, options }]
                shippingAddress,
                billingAddress,
                paymentMethod,
                couponCode = null
            } = orderData;

            const orderId = this.generateOrderId();
            
            // Validate products and calculate totals
            let subtotal = 0;
            const orderItems = [];

            for (const item of items) {
                const product = this.marketplace.products.get(item.productId);
                if (!product) {
                    throw new Error(`Product ${item.productId} not found`);
                }

                if (product.inventory < item.quantity) {
                    throw new Error(`Insufficient inventory for ${product.name}`);
                }

                const orderItem = {
                    productId: item.productId,
                    productName: product.name,
                    sellerId: product.sellerId,
                    quantity: item.quantity,
                    price: product.price,
                    subtotal: product.price * item.quantity,
                    options: item.options
                };

                orderItems.push(orderItem);
                subtotal += orderItem.subtotal;
            }

            // Calculate fees and discounts
            const commission = subtotal * this.config.commissionRate;
            const shipping = await this.calculateShipping(orderItems, shippingAddress);
            const discount = couponCode ? await this.applyCoupon(couponCode, subtotal) : 0;
            const tax = await this.calculateTax(subtotal - discount, shippingAddress);
            const total = subtotal + shipping + tax - discount;

            const order = {
                orderId,
                userId,
                items: orderItems,
                pricing: {
                    subtotal,
                    shipping,
                    tax,
                    discount,
                    commission,
                    total
                },
                addresses: {
                    shipping: shippingAddress,
                    billing: billingAddress
                },
                payment: {
                    method: paymentMethod,
                    status: 'pending'
                },
                status: 'pending_payment',
                createdAt: new Date(),
                updatedAt: new Date()
            };

            // Process payment với C# service
            if (this.services.csharp.enabled) {
                try {
                    const response = await axios.post(
                        `${this.services.csharp.url}/commerce/payments/process`,
                        {
                            orderId,
                            amount: total,
                            currency: 'USD',
                            paymentMethod,
                            billingAddress
                        },
                        { timeout: 30000 }
                    );

                    order.payment.status = response.data.status;
                    order.payment.transactionId = response.data.transactionId;
                    
                    if (response.data.status === 'completed') {
                        order.status = 'confirmed';
                        await this.fulfillOrder(orderId);
                    }
                } catch (paymentError) {
                    order.status = 'payment_failed';
                    order.payment.error = paymentError.message;
                }
            }

            this.marketplace.orders.set(orderId, order);

            console.log(`🛒 Order created: ${orderId} - $${total.toFixed(2)}`);

            return {
                success: true,
                orderId,
                total,
                status: order.status,
                paymentStatus: order.payment.status
            };

        } catch (error) {
            console.error('Order creation error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Social Shopping Features
     */
    async createWishList(userId, name, isPublic = true) {
        try {
            const wishListId = this.generateWishListId();
            
            const wishList = {
                wishListId,
                userId,
                name,
                isPublic,
                products: [],
                followers: new Set(),
                createdAt: new Date(),
                updatedAt: new Date()
            };

            this.socialFeatures.wishLists.set(wishListId, wishList);

            return {
                success: true,
                wishListId,
                wishList: {
                    name: wishList.name,
                    isPublic: wishList.isPublic,
                    productCount: 0
                }
            };

        } catch (error) {
            console.error('Wishlist creation error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    async addToWishList(userId, wishListId, productId) {
        try {
            const wishList = this.socialFeatures.wishLists.get(wishListId);
            if (!wishList || wishList.userId !== userId) {
                throw new Error('Wishlist not found or unauthorized');
            }

            const product = this.marketplace.products.get(productId);
            if (!product) {
                throw new Error('Product not found');
            }

            // Check if already in wishlist
            if (!wishList.products.find(p => p.productId === productId)) {
                wishList.products.push({
                    productId,
                    addedAt: new Date()
                });
                
                wishList.updatedAt = new Date();
                
                // Track social metric
                product.socialMetrics = product.socialMetrics || {};
                product.socialMetrics.wishListAdds = (product.socialMetrics.wishListAdds || 0) + 1;
                this.marketplace.products.set(productId, product);
            }

            return {
                success: true,
                productCount: wishList.products.length
            };

        } catch (error) {
            console.error('Add to wishlist error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    async shareProduct(userId, productId, platform, message = '') {
        try {
            const product = this.marketplace.products.get(productId);
            if (!product) {
                throw new Error('Product not found');
            }

            const shareData = {
                userId,
                productId,
                platform,
                message,
                sharedAt: new Date()
            };

            // Track social sharing
            product.socialMetrics.socialShares = (product.socialMetrics.socialShares || 0) + 1;
            product.analytics.shares++;
            this.marketplace.products.set(productId, product);

            // Swift service for mobile sharing
            if (this.services.swift.enabled && (platform === 'ios' || platform === 'mobile')) {
                await axios.post(
                    `${this.services.swift.url}/commerce/share`,
                    shareData,
                    { timeout: 5000 }
                );
            }

            console.log(`📤 Product shared: ${productId} to ${platform}`);

            return {
                success: true,
                shareId: this.generateShareId(),
                socialMetrics: product.socialMetrics
            };

        } catch (error) {
            console.error('Product share error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Influencer Marketplace
     */
    async createInfluencerPost(influencerId, postData) {
        try {
            const {
                productIds,
                content,
                mediaUrls = [],
                tags = [],
                commissionRate = this.config.commissionRate
            } = postData;

            const postId = this.generateInfluencerPostId();
            
            const influencerPost = {
                postId,
                influencerId,
                productIds,
                content,
                mediaUrls,
                tags,
                commissionRate,
                status: 'active',
                analytics: {
                    views: 0,
                    likes: 0,
                    comments: 0,
                    clicks: 0,
                    conversions: 0,
                    revenue: 0
                },
                createdAt: new Date()
            };

            this.socialFeatures.influencerPosts.set(postId, influencerPost);

            // Update product metrics
            for (const productId of productIds) {
                const product = this.marketplace.products.get(productId);
                if (product) {
                    product.socialMetrics.influencerPosts++;
                    this.marketplace.products.set(productId, product);
                }
            }

            return {
                success: true,
                postId,
                trackingUrl: this.generateTrackingUrl(postId, influencerId)
            };

        } catch (error) {
            console.error('Influencer post creation error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Recommendation Engine
     */
    async setupRecommendationEngine() {
        if (this.services.java.enabled) {
            try {
                await axios.post(
                    `${this.services.java.url}/commerce/recommendations/setup`,
                    {
                        algorithms: ['collaborative_filtering', 'content_based', 'social_proof'],
                        updateInterval: 3600000 // 1 hour
                    },
                    { timeout: 10000 }
                );
                
                console.log('✅ Recommendation engine initialized');
            } catch (error) {
                console.error('Recommendation engine setup error:', error);
            }
        }
    }

    async getPersonalizedRecommendations(userId, options = {}) {
        try {
            const {
                category = null,
                priceRange = null,
                limit = 20
            } = options;

            let recommendations = [];

            // Java recommendation service
            if (this.services.java.enabled) {
                const response = await axios.post(
                    `${this.services.java.url}/commerce/recommendations/personal`,
                    { userId, category, priceRange, limit },
                    { timeout: 10000 }
                );

                recommendations = response.data.recommendations || [];
            } else {
                // Fallback recommendations
                recommendations = await this.getFallbackRecommendations(userId, options);
            }

            return {
                success: true,
                recommendations,
                algorithm: 'personalized',
                generatedAt: new Date()
            };

        } catch (error) {
            console.error('Personalized recommendations error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Analytics & Insights
     */
    async getProductAnalytics(productId, sellerId) {
        try {
            const product = this.marketplace.products.get(productId);
            if (!product || product.sellerId !== sellerId) {
                throw new Error('Product not found or unauthorized');
            }

            // C# analytics service
            let detailedAnalytics = {};
            if (this.services.csharp.enabled) {
                try {
                    const response = await axios.get(
                        `${this.services.csharp.url}/commerce/analytics/product/${productId}`,
                        { timeout: 10000 }
                    );
                    
                    detailedAnalytics = response.data.analytics;
                } catch (analyticsError) {
                    console.warn('Detailed analytics unavailable:', analyticsError.message);
                }
            }

            return {
                success: true,
                analytics: {
                    basic: product.analytics,
                    social: product.socialMetrics,
                    detailed: detailedAnalytics,
                    lastUpdated: new Date()
                }
            };

        } catch (error) {
            console.error('Product analytics error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Utility Methods
     */
    generateProductId() {
        return `prod_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    generateOrderId() {
        return `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    generateWishListId() {
        return `wish_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    generateInfluencerPostId() {
        return `inf_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    generateShareId() {
        return `share_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    generateTrackingUrl(postId, influencerId) {
        return `https://crown.social/track/${postId}?inf=${influencerId}`;
    }

    // Placeholder methods for integration
    async getCart(userId) {
        return {
            userId,
            items: [],
            itemCount: 0,
            subtotal: 0,
            currency: 'USD',
            createdAt: new Date(),
            updatedAt: new Date()
        };
    }

    async saveCart(userId, cart) {
        // Implement cart persistence
        return true;
    }

    async calculateShipping(items, address) {
        return 9.99; // Flat rate shipping
    }

    async calculateTax(amount, address) {
        return amount * 0.08; // 8% tax rate
    }

    async applyCoupon(couponCode, amount) {
        return amount * 0.1; // 10% discount
    }

    async fulfillOrder(orderId) {
        const order = this.marketplace.orders.get(orderId);
        if (order) {
            // Update inventory, notify sellers, etc.
            for (const item of order.items) {
                const product = this.marketplace.products.get(item.productId);
                if (product) {
                    product.inventory -= item.quantity;
                    product.analytics.purchases += item.quantity;
                    product.analytics.revenue += item.subtotal;
                    this.marketplace.products.set(item.productId, product);
                }
            }
        }
    }

    async getFallbackRecommendations(userId, options) {
        // Simple fallback recommendations based on popular products
        const products = Array.from(this.marketplace.products.values())
            .filter(p => p.status === 'active')
            .sort((a, b) => b.analytics.purchases - a.analytics.purchases)
            .slice(0, options.limit || 20);

        return products.map(p => ({
            productId: p.productId,
            name: p.name,
            price: p.price,
            image: p.images[0] || null,
            score: p.analytics.purchases / 100
        }));
    }

    async initializePaymentProcessing() {
        console.log('💳 Payment processing integration ready');
    }

    async initializeSocialFeatures() {
        console.log('👥 Social shopping features initialized');
    }
}

module.exports = new SocialCommerceService();
