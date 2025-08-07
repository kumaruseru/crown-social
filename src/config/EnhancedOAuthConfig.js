const { Strategy: GoogleStrategy } = require('passport-google-oauth20');
const { Strategy: FacebookStrategy } = require('passport-facebook');
const { Strategy: JwtStrategy, ExtractJwt } = require('passport-jwt');
const passport = require('passport');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const SecurityUtils = require('../utils/SecurityUtils');

/**
 * Enhanced OAuth 2.0 + OpenID Connect Integration
 * OAuth nâng cao với OpenID Connect và Multi-provider support
 */
class EnhancedOAuthConfig {
    constructor() {
        console.log('🔑 Initializing Enhanced OAuth Config...');
    }

    /**
     * Initialize OAuth configuration
     */
    initialize() {
        this.initializeStrategies();
        this.setupJWTStrategy();
        this.setupOpenIDConnect();
        console.log('✅ Enhanced OAuth Config initialized');
    }

    /**
     * Initialize OAuth strategies with enhanced security
     */
    initializeStrategies() {
        // Enhanced Google OAuth 2.0 Strategy
        passport.use(new GoogleStrategy({
            clientID: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            callbackURL: process.env.GOOGLE_CALLBACK_URL,
            scope: ['profile', 'email', 'openid'],
            prompt: 'consent',
            accessType: 'offline'
        }, this.handleOAuthCallback.bind(this, 'google')));

        // Enhanced Facebook OAuth Strategy
        passport.use(new FacebookStrategy({
            clientID: process.env.FACEBOOK_APP_ID,
            clientSecret: process.env.FACEBOOK_APP_SECRET,
            callbackURL: process.env.FACEBOOK_CALLBACK_URL,
            profileFields: ['id', 'emails', 'name', 'picture.type(large)'],
            enableProof: true
        }, this.handleOAuthCallback.bind(this, 'facebook')));

        // Microsoft Azure AD Strategy (Enterprise SSO)
        if (process.env.AZURE_CLIENT_ID) {
            const { Strategy: AzureStrategy } = require('passport-azure-ad-oauth2');
            passport.use(new AzureStrategy({
                clientID: process.env.AZURE_CLIENT_ID,
                clientSecret: process.env.AZURE_CLIENT_SECRET,
                callbackURL: process.env.AZURE_CALLBACK_URL,
                tenant: process.env.AZURE_TENANT_ID || 'common'
            }, this.handleOAuthCallback.bind(this, 'azure')));
        }

        // GitHub OAuth Strategy (Developer access)
        if (process.env.GITHUB_CLIENT_ID) {
            const { Strategy: GitHubStrategy } = require('passport-github2');
            passport.use(new GitHubStrategy({
                clientID: process.env.GITHUB_CLIENT_ID,
                clientSecret: process.env.GITHUB_CLIENT_SECRET,
                callbackURL: process.env.GITHUB_CALLBACK_URL,
                scope: ['user:email']
            }, this.handleOAuthCallback.bind(this, 'github')));
        }
    }

    /**
     * Setup JWT Strategy for API authentication
     */
    setupJWTStrategy() {
        passport.use(new JwtStrategy({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            secretOrKey: process.env.JWT_SECRET,
            algorithms: ['HS256'],
            issuer: process.env.JWT_ISSUER || 'crown-social',
            audience: process.env.JWT_AUDIENCE || 'crown-users'
        }, async (payload, done) => {
            try {
                const user = await User.findById(payload.sub);
                if (user && user.isActive) {
                    return done(null, user);
                }
                return done(null, false);
            } catch (error) {
                return done(error, false);
            }
        }));
    }

    /**
     * Enhanced OAuth callback handler with security checks
     */
    async handleOAuthCallback(provider, accessToken, refreshToken, profile, done) {
        try {
            // Security: Validate provider and profile
            if (!this.validateOAuthProvider(provider, profile)) {
                return done(new Error('Invalid OAuth provider or profile'), null);
            }

            // Check for existing user
            let user = await this.findOrCreateOAuthUser(provider, profile, accessToken, refreshToken);
            
            // Security: Check user status
            if (!user.isActive) {
                return done(new Error('Account is disabled'), null);
            }

            // Update login information
            await user.updateLastLogin();
            
            // Log OAuth login
            console.log(`🔐 OAuth login: ${user.email} via ${provider} - IP: ${user.lastLoginIP || 'unknown'}`);
            
            return done(null, user);
            
        } catch (error) {
            console.error(`OAuth ${provider} error:`, error);
            return done(error, null);
        }
    }

    /**
     * Validate OAuth provider and profile
     */
    validateOAuthProvider(provider, profile) {
        const validProviders = ['google', 'facebook', 'azure', 'github'];
        
        if (!validProviders.includes(provider)) {
            return false;
        }

        if (!profile || !profile.id || !profile.emails || profile.emails.length === 0) {
            return false;
        }

        return true;
    }

    /**
     * Find or create OAuth user with enhanced security
     */
    async findOrCreateOAuthUser(provider, profile, accessToken, refreshToken) {
        const email = profile.emails[0].value.toLowerCase();
        const providerId = profile.id;
        
        // Try to find existing user by OAuth ID
        let user = await User.findOne({ 
            [`${provider}Id`]: providerId 
        });

        if (user) {
            // Update OAuth tokens if user exists
            await this.updateOAuthTokens(user, provider, accessToken, refreshToken);
            return user;
        }

        // Try to find by email (account linking)
        user = await User.findOne({ email: email });
        
        if (user) {
            // Link OAuth account to existing user
            await this.linkOAuthAccount(user, provider, providerId, accessToken, refreshToken);
            return user;
        }

        // Create new user
        return await this.createOAuthUser(provider, profile, accessToken, refreshToken);
    }

    /**
     * Create new OAuth user
     */
    async createOAuthUser(provider, profile, accessToken, refreshToken) {
        const email = profile.emails[0].value.toLowerCase();
        const userData = {
            email: email,
            firstName: profile.name?.givenName || profile.displayName?.split(' ')[0] || 'User',
            lastName: profile.name?.familyName || profile.displayName?.split(' ').slice(1).join(' ') || '',
            username: await this.generateUniqueUsername(profile.displayName || email),
            provider: provider,
            isEmailVerified: true, // OAuth emails are pre-verified
            [`${provider}Id`]: profile.id,
            avatar: profile.photos?.[0]?.value || null
        };

        // Store encrypted OAuth tokens
        if (accessToken) {
            userData[`${provider}AccessToken`] = SecurityUtils.encryptSensitiveData(accessToken);
        }
        
        if (refreshToken) {
            userData[`${provider}RefreshToken`] = SecurityUtils.encryptSensitiveData(refreshToken);
        }

        const user = new User(userData);
        return await user.save();
    }

    /**
     * Generate unique username from display name
     */
    async generateUniqueUsername(displayName) {
        let baseUsername = displayName
            .toLowerCase()
            .replace(/[^a-z0-9]/g, '')
            .substring(0, 15);

        if (baseUsername.length < 3) {
            baseUsername = 'user' + Math.random().toString(36).substring(2, 8);
        }

        let username = baseUsername;
        let counter = 1;

        while (await User.findOne({ username: username })) {
            username = baseUsername + counter;
            counter++;
        }

        return username;
    }

    /**
     * Setup OpenID Connect discovery
     */
    setupOpenIDConnect() {
        // OpenID Connect configuration
        this.oidcConfig = {
            issuer: process.env.BASE_URL || 'http://localhost:3000',
            authorization_endpoint: '/auth/authorize',
            token_endpoint: '/auth/token',
            userinfo_endpoint: '/auth/userinfo',
            jwks_uri: '/.well-known/jwks.json',
            scopes_supported: ['openid', 'profile', 'email'],
            response_types_supported: ['code', 'token', 'id_token'],
            grant_types_supported: ['authorization_code', 'refresh_token'],
            subject_types_supported: ['public'],
            id_token_signing_alg_values_supported: ['HS256', 'RS256']
        };
    }

    /**
     * Generate OpenID Connect ID token
     */
    generateIDToken(user, nonce = null) {
        const payload = {
            iss: this.oidcConfig.issuer,
            sub: user._id.toString(),
            aud: process.env.JWT_AUDIENCE || 'crown-users',
            exp: Math.floor(Date.now() / 1000) + (15 * 60), // 15 minutes
            iat: Math.floor(Date.now() / 1000),
            auth_time: Math.floor(user.lastLoginAt?.getTime() / 1000) || Math.floor(Date.now() / 1000),
            nonce: nonce,
            // Standard claims
            email: user.email,
            email_verified: user.isEmailVerified,
            name: `${user.firstName} ${user.lastName}`.trim(),
            given_name: user.firstName,
            family_name: user.lastName,
            picture: user.getAvatarUrl(),
            preferred_username: user.username
        };

        return jwt.sign(payload, process.env.JWT_SECRET, { algorithm: 'HS256' });
    }

    /**
     * Get OIDC configuration
     */
    getOIDCConfiguration() {
        return this.oidcConfig;
    }
}

module.exports = EnhancedOAuthConfig;
