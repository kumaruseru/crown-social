const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const AvatarUtils = require('../utils/AvatarUtils');
const { Schema } = mongoose;

/**
 * User Schema - MongoDB Schema cho User
 */
const UserSchema = new Schema({
    firstName: {
        type: String,
        required: [true, 'Tên không được để trống'],
        trim: true,
        maxlength: [50, 'Tên không được vượt quá 50 ký tự']
    },
    lastName: {
        type: String,
        required: [true, 'Họ không được để trống'],
        trim: true,
        maxlength: [50, 'Họ không được vượt quá 50 ký tự']
    },
    email: {
        type: String,
        required: [true, 'Email không được để trống'],
        unique: true,
        lowercase: true,
        trim: true,
        match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Email không hợp lệ'],
        index: true
    },
    username: {
        type: String,
        required: [true, 'Tên người dùng không được để trống'],
        unique: true,
        lowercase: true,
        trim: true,
        minlength: [3, 'Tên người dùng phải có ít nhất 3 ký tự'],
        maxlength: [20, 'Tên người dùng không được vượt quá 20 ký tự'],
        match: [/^[a-zA-Z0-9_]+$/, 'Tên người dùng chỉ được chứa chữ cái, số và dấu gạch dưới'],
        index: true
    },
    password: {
        type: String,
        required: function() {
            // Password is only required if user doesn't use OAuth
            return !this.googleId && !this.facebookId;
        },
        minlength: [6, 'Mật khẩu phải có ít nhất 6 ký tự']
    },
    // OAuth fields
    googleId: {
        type: String,
        sparse: true,
        index: true
    },
    facebookId: {
        type: String,
        sparse: true,
        index: true
    },
    provider: {
        type: String,
        enum: ['local', 'google', 'facebook'],
        default: 'local'
    },
    avatar: {
        type: String,
        default: null
    },

    dateOfBirth: {
        type: Date,
        validate: {
            validator: function(date) {
                if (!date) return false;
                const today = new Date();
                const age = today.getFullYear() - date.getFullYear();
                return age >= 13 && age <= 120;
            },
            message: 'Tuổi phải từ 13 đến 120'
        }
    },
    gender: {
        type: String,
        enum: ['Nam', 'Nữ', 'Khác'],
        default: 'Khác'
    },
    avatar: {
        type: String,
        default: null
    },
    
    // Social Profile Fields
    bio: {
        type: String,
        maxlength: [500, 'Bio không được vượt quá 500 ký tự'],
        trim: true
    },
    location: {
        type: String,
        maxlength: [100, 'Địa điểm không được vượt quá 100 ký tự'],
        trim: true
    },
    website: {
        type: String,
        match: [/^https?:\/\/.+/, 'Website phải có định dạng URL hợp lệ']
    },
    phoneNumber: {
        type: String,
        match: [/^[\+]?[1-9][\d]{0,15}$/, 'Số điện thoại không hợp lệ']
    },
    
    // Privacy Settings
    profileVisibility: {
        type: String,
        enum: ['public', 'friends', 'private'],
        default: 'friends'
    },
    showEmail: {
        type: Boolean,
        default: false
    },
    showPhone: {
        type: Boolean,
        default: false
    },
    allowFriendRequests: {
        type: Boolean,
        default: true
    },
    
    // Activity Status
    isOnline: {
        type: Boolean,
        default: false
    },
    lastSeen: {
        type: Date,
        default: Date.now
    },
    
    // Statistics (denormalized for performance)
    friendsCount: {
        type: Number,
        default: 0,
        min: 0
    },
    postsCount: {
        type: Number,
        default: 0,
        min: 0
    },
    followersCount: {
        type: Number,
        default: 0,
        min: 0
    },
    
    isActive: {
        type: Boolean,
        default: true
    },
    isEmailVerified: {
        type: Boolean,
        default: false
    },
    role: {
        type: String,
        enum: ['user', 'admin', 'moderator'],
        default: 'user'
    },
    lastLoginAt: {
        type: Date,
        default: null
    },
    loginCount: {
        type: Number,
        default: 0
    },
    // OAuth fields
    googleId: {
        type: String,
        sparse: true,
        index: true
    },
    facebookId: {
        type: String,
        sparse: true,
        index: true
    },
    // Email verification
    emailVerificationToken: {
        type: String,
        default: null
    },
    emailVerificationExpires: {
        type: Date,
        default: null
    },
    // Password reset
    passwordResetToken: {
        type: String,
        default: null
    },
    passwordResetExpires: {
        type: Date,
        default: null
    },
    
    // Encryption keys for end-to-end encryption
    publicKey: {
        type: String,
        default: null // RSA public key in PEM format
    },
    privateKey: {
        type: String,
        default: null // RSA private key in PEM format (encrypted with user's password)
    },
    keyFingerprint: {
        type: String,
        default: null // SHA-256 fingerprint of public key for verification
    },
    keyGeneratedAt: {
        type: Date,
        default: null
    },
    keyVersion: {
        type: Number,
        default: 1 // For key rotation in the future
    }
}, {
    timestamps: true, // Tự động thêm createdAt và updatedAt
    collection: 'users'
});

// Không cần thêm indexes thủ công nữa vì đã khai báo trong schema

/**
 * Pre-save middleware - Hash password
 */
UserSchema.pre('save', async function(next) {
    // Chỉ hash password nếu password được thay đổi
    if (!this.isModified('password')) return next();

    try {
        const saltRounds = 12;
        this.password = await bcrypt.hash(this.password, saltRounds);
        next();
    } catch (error) {
        next(error);
    }
});

/**
 * Pre-save middleware - Convert username to lowercase
 */
UserSchema.pre('save', function(next) {
    if (this.username) {
        this.username = this.username.toLowerCase();
    }
    if (this.email) {
        this.email = this.email.toLowerCase();
    }
    next();
});

/**
 * Virtual property - Default Avatar URL
 */
UserSchema.virtual('defaultAvatar').get(function() {
    return this.getAvatarUrl();
});

/**
 * Virtual property - Avatar with multiple sizes
 */
UserSchema.virtual('avatarSizes').get(function() {
    const userData = {
        firstName: this.firstName,
        lastName: this.lastName,
        username: this.username,
        email: this.email
    };
    
    const initials = AvatarUtils.generateInitials(this.firstName, this.lastName) || 
                    AvatarUtils.generateInitialsFromUsername(this.username);
    const colors = AvatarUtils.getColorFromSeed(this.email || this.username);
    
    return AvatarUtils.generateAvatarSizes(initials, colors);
});

/**
 * Virtual property - Full Name
 */
// Temporarily commenting out to fix server crash
// UserSchema.virtual('fullName').get(function() {
//     return `${this.firstName || ''} ${this.lastName || ''}`.trim();
// });

/**
 * Instance Methods
 */

/**
 * Kiểm tra mật khẩu
 * @param {string} plainPassword 
 * @returns {Promise<boolean>}
 */
UserSchema.methods.comparePassword = async function(plainPassword) {
    return await bcrypt.compare(plainPassword, this.password);
};

/**
 * Cập nhật thời gian đăng nhập cuối
 */
UserSchema.methods.updateLastLogin = function() {
    this.lastLoginAt = new Date();
    this.loginCount += 1;
    return this.save();
};

/**
 * Lấy avatar URL (với fallback đến avatar mặc định)
 * @param {number} size - Kích thước avatar (default: 120)
 * @returns {string} URL của avatar
 */
UserSchema.methods.getAvatarUrl = function(size = 120) {
    // Nếu có avatar từ OAuth hoặc upload
    if (this.avatar && !AvatarUtils.isDefaultAvatar(this.avatar)) {
        return this.avatar;
    }
    
    // Tạo avatar mặc định
    return AvatarUtils.generateDefaultAvatar({
        firstName: this.firstName,
        lastName: this.lastName,
        username: this.username,
        email: this.email
    }, size);
};

/**
 * Tạo token xác thực email
 */
UserSchema.methods.createEmailVerificationToken = function() {
    const crypto = require('crypto');
    const token = crypto.randomBytes(32).toString('hex');
    
    this.emailVerificationToken = crypto.createHash('sha256').update(token).digest('hex');
    this.emailVerificationExpires = Date.now() + 24 * 60 * 60 * 1000; // 24 hours
    
    return token;
};

/**
 * Tạo token reset password
 */
UserSchema.methods.createPasswordResetToken = function() {
    const crypto = require('crypto');
    const token = crypto.randomBytes(32).toString('hex');
    
    this.passwordResetToken = crypto.createHash('sha256').update(token).digest('hex');
    this.passwordResetExpires = Date.now() + 10 * 60 * 1000; // 10 minutes
    
    return token;
};

/**
 * Chuyển sang JSON (không bao gồm sensitive data)
 */
UserSchema.methods.toJSON = function() {
    const userObject = this.toObject();
    
    // Xóa các field nhạy cảm
    delete userObject.password;
    delete userObject.emailVerificationToken;
    delete userObject.emailVerificationExpires;
    delete userObject.passwordResetToken;
    delete userObject.passwordResetExpires;
    delete userObject.__v;
    
    // Thêm avatar mặc định nếu không có
    if (!userObject.avatar || AvatarUtils.isDefaultAvatar(userObject.avatar)) {
        userObject.avatar = this.getAvatarUrl();
    }
    
    // Temporarily commenting out full name due to virtual conflict
    // userObject.fullName = this.fullName;
    
    return userObject;
};

/**
 * Static Methods
 */

/**
 * Tìm user theo email hoặc username
 * @param {string} identifier 
 * @returns {Promise<User|null>}
 */
UserSchema.statics.findByEmailOrUsername = function(identifier) {
    return this.findOne({
        $or: [
            { email: identifier.toLowerCase() },
            { username: identifier.toLowerCase() }
        ]
    });
};

/**
 * Tạo user từ form data
 * @param {Object} formData 
 * @returns {User}
 */
UserSchema.statics.fromFormData = function(formData) {
    const dateOfBirth = formData.day && formData.month && formData.year ? 
        new Date(formData.year, formData.month - 1, formData.day) : null;

    return new this({
        firstName: formData.first_name,
        lastName: formData.last_name,
        email: formData.email,
        username: formData.username,
        password: formData.password,
        dateOfBirth,
        gender: formData.gender
    });
};

/**
 * Tìm user theo token xác thực email
 * @param {string} token 
 * @returns {Promise<User|null>}
 */
UserSchema.statics.findByEmailVerificationToken = function(token) {
    const crypto = require('crypto');
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
    
    return this.findOne({
        emailVerificationToken: hashedToken,
        emailVerificationExpires: { $gt: Date.now() }
    });
};

/**
 * Tìm user theo password reset token
 * @param {string} token 
 * @returns {Promise<User|null>}
 */
UserSchema.statics.findByPasswordResetToken = function(token) {
    const crypto = require('crypto');
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
    
    return this.findOne({
        passwordResetToken: hashedToken,
        passwordResetExpires: { $gt: Date.now() }
    });
};

// Export model
module.exports = mongoose.model('User', UserSchema);
