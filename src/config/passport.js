const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const FacebookStrategy = require('passport-facebook').Strategy;
const User = require('../models/User');

/**
 * Passport Configuration - OAuth strategies
 */
class PassportConfig {
    constructor() {
        this.configure();
    }

    configure() {
        // Serialize user for session
        passport.serializeUser((user, done) => {
            console.log('🔧 Serializing user:', user._id);
            done(null, user._id);
        });

        // Deserialize user from session
        passport.deserializeUser(async (id, done) => {
            try {
                console.log('🔧 Deserializing user ID:', id);
                const user = await User.findById(id);
                console.log('🔧 Found user:', user ? user.email : 'null');
                done(null, user);
            } catch (error) {
                console.error('❌ Deserialize error:', error);
                done(error, null);
            }
        });

        // Google OAuth Strategy
        passport.use(new GoogleStrategy({
            clientID: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            callbackURL: "/api/auth/google/callback"
        }, async (accessToken, refreshToken, profile, done) => {
            try {
                // Check if user already exists with this Google ID
                let existingUser = await User.findOne({ googleId: profile.id });
                
                if (existingUser) {
                    // Update last login
                    existingUser.lastLogin = new Date();
                    await existingUser.save();
                    return done(null, existingUser);
                }

                // Check if user exists with same email
                existingUser = await User.findOne({ email: profile.emails[0].value });
                
                if (existingUser) {
                    // Link Google account to existing user
                    existingUser.googleId = profile.id;
                    existingUser.avatar = profile.photos[0].value;
                    existingUser.lastLogin = new Date();
                    await existingUser.save();
                    return done(null, existingUser);
                }

                // Create new user
                const { firstName, lastName } = this.parseFullName(profile.displayName);
                const newUser = new User({
                    googleId: profile.id,
                    username: await this.generateValidUsername(profile.displayName || profile.emails[0].value.split('@')[0]),
                    email: profile.emails[0].value,
                    firstName: firstName,
                    lastName: lastName,
                    fullName: profile.displayName,
                    avatar: profile.photos[0].value,
                    isVerified: true, // Google accounts are pre-verified
                    provider: 'google',
                    lastLogin: new Date()
                });

                await newUser.save();
                done(null, newUser);
            } catch (error) {
                console.error('Google OAuth error:', error);
                done(error, null);
            }
        }));

        // Facebook OAuth Strategy
        passport.use(new FacebookStrategy({
            clientID: process.env.FACEBOOK_APP_ID,
            clientSecret: process.env.FACEBOOK_APP_SECRET,
            callbackURL: "/api/auth/facebook/callback",
            profileFields: ['id', 'displayName', 'photos', 'email', 'name']
        }, async (accessToken, refreshToken, profile, done) => {
            try {
                // Check if user already exists with this Facebook ID
                let existingUser = await User.findOne({ facebookId: profile.id });
                
                if (existingUser) {
                    // Update last login
                    existingUser.lastLogin = new Date();
                    await existingUser.save();
                    return done(null, existingUser);
                }

                // Check if user exists with same email
                const email = profile.emails ? profile.emails[0].value : null;
                if (email) {
                    existingUser = await User.findOne({ email: email });
                    
                    if (existingUser) {
                        // Link Facebook account to existing user
                        existingUser.facebookId = profile.id;
                        existingUser.avatar = profile.photos[0].value;
                        existingUser.lastLogin = new Date();
                        await existingUser.save();
                        return done(null, existingUser);
                    }
                }

                // Create new user
                const { firstName, lastName } = this.parseFullName(profile.displayName);
                const newUser = new User({
                    facebookId: profile.id,
                    username: await this.generateValidUsername(profile.displayName || `fb_${profile.id}`),
                    email: email,
                    firstName: firstName,
                    lastName: lastName,
                    fullName: profile.displayName,
                    avatar: profile.photos[0].value,
                    isVerified: true, // Facebook accounts are pre-verified
                    provider: 'facebook',
                    lastLogin: new Date()
                });

                await newUser.save();
                done(null, newUser);
            } catch (error) {
                console.error('Facebook OAuth error:', error);
                done(error, null);
            }
        }));

        console.log('✅ Passport OAuth strategies configured');
    }

    /**
     * Tạo username hợp lệ từ tên hiển thị
     * @param {string} displayName 
     * @returns {Promise<string>}
     */
    async generateValidUsername(displayName) {
        if (!displayName) {
            return `user_${Date.now()}`;
        }

        // Loại bỏ dấu tiếng Việt
        let baseUsername = displayName
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '') // Loại bỏ dấu
            .replace(/[đĐ]/g, 'd') // Chuyển đ thành d
            .toLowerCase()
            .replace(/[^a-z0-9]/g, '_') // Thay thế ký tự không hợp lệ bằng _
            .replace(/_+/g, '_') // Loại bỏ _ liên tiếp
            .replace(/^_|_$/g, ''); // Loại bỏ _ ở đầu và cuối

        // Đảm bảo username có ít nhất 3 ký tự
        if (baseUsername.length < 3) {
            baseUsername = `user_${Date.now()}`;
        }

        // Giới hạn độ dài username
        if (baseUsername.length > 15) {
            baseUsername = baseUsername.substring(0, 15);
        }

        // Kiểm tra username có bị trùng không
        let username = baseUsername;
        let counter = 1;
        
        while (await User.findOne({ username: username })) {
            username = `${baseUsername}_${counter}`;
            counter++;
            // Giới hạn độ dài nếu quá dài
            if (username.length > 20) {
                username = `${baseUsername.substring(0, 15)}_${counter}`;
            }
        }

        return username;
    }

    /**
     * Tách fullName thành firstName và lastName
     * @param {string} fullName 
     * @returns {Object}
     */
    parseFullName(fullName) {
        if (!fullName) {
            return { firstName: 'User', lastName: 'Unknown' };
        }

        const nameParts = fullName.trim().split(' ');
        
        if (nameParts.length === 1) {
            return { firstName: nameParts[0], lastName: 'User' };
        } else if (nameParts.length === 2) {
            return { firstName: nameParts[0], lastName: nameParts[1] };
        } else {
            // Trường hợp có nhiều từ, lấy từ đầu làm firstName, phần còn lại làm lastName
            return { 
                firstName: nameParts[0], 
                lastName: nameParts.slice(1).join(' ') 
            };
        }
    }
}

module.exports = PassportConfig;
