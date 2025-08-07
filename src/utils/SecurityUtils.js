const crypto = require('crypto');

/**
 * Enhanced Security Utils for Crown Social Network
 * Utility functions cho bảo mật nâng cao
 */
class SecurityUtils {
    
    /**
     * Generate cryptographically secure random string
     * @param {number} length 
     * @returns {string}
     */
    static generateSecureRandomString(length = 32) {
        return crypto.randomBytes(length).toString('hex');
    }

    /**
     * Generate secure token with expiry
     * @param {number} expiryMinutes 
     * @returns {Object} {token, hashedToken, expiry}
     */
    static generateSecureToken(expiryMinutes = 10) {
        const token = crypto.randomBytes(32).toString('hex');
        const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
        const expiry = new Date(Date.now() + expiryMinutes * 60 * 1000);
        
        return {
            token,
            hashedToken,
            expiry
        };
    }

    /**
     * Hash token for storage
     * @param {string} token 
     * @returns {string}
     */
    static hashToken(token) {
        return crypto.createHash('sha256').update(token).digest('hex');
    }

    /**
     * Generate CSRF token
     * @returns {string}
     */
    static generateCSRFToken() {
        return crypto.randomBytes(32).toString('base64');
    }

    /**
     * Verify CSRF token
     * @param {string} token 
     * @param {string} sessionToken 
     * @returns {boolean}
     */
    static verifyCSRFToken(token, sessionToken) {
        if (!token || !sessionToken) return false;
        return crypto.timingSafeEqual(
            Buffer.from(token, 'base64'),
            Buffer.from(sessionToken, 'base64')
        );
    }

    /**
     * Encrypt sensitive data using AES-256-GCM
     * @param {string} plaintext 
     * @param {string} key - 32 bytes key
     * @returns {Object} {encrypted, iv, authTag}
     */
    static encryptSensitiveData(plaintext, key = null) {
        if (!key) {
            key = process.env.AES_ENCRYPTION_KEY || crypto.randomBytes(32);
        }
        
        const iv = crypto.randomBytes(16);
        const cipher = crypto.createCipher('aes-256-gcm', key, iv);
        
        let encrypted = cipher.update(plaintext, 'utf8', 'hex');
        encrypted += cipher.final('hex');
        
        const authTag = cipher.getAuthTag();
        
        return {
            encrypted,
            iv: iv.toString('hex'),
            authTag: authTag.toString('hex')
        };
    }

    /**
     * Decrypt sensitive data using AES-256-GCM
     * @param {Object} encryptedData 
     * @param {string} key 
     * @returns {string}
     */
    static decryptSensitiveData(encryptedData, key = null) {
        if (!key) {
            key = process.env.AES_ENCRYPTION_KEY;
        }
        
        const { encrypted, iv, authTag } = encryptedData;
        
        const decipher = crypto.createDecipher('aes-256-gcm', key, Buffer.from(iv, 'hex'));
        decipher.setAuthTag(Buffer.from(authTag, 'hex'));
        
        let decrypted = decipher.update(encrypted, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        
        return decrypted;
    }

    /**
     * Generate secure session ID
     * @returns {string}
     */
    static generateSessionId() {
        return crypto.randomBytes(32).toString('base64url');
    }

    /**
     * Rate limiting check with sliding window
     * @param {string} identifier 
     * @param {number} maxAttempts 
     * @param {number} windowMs 
     * @param {Map} storage 
     * @returns {Object} {allowed, remainingAttempts, resetTime}
     */
    static checkRateLimit(identifier, maxAttempts = 5, windowMs = 900000, storage = new Map()) {
        const now = Date.now();
        const windowStart = now - windowMs;
        
        if (!storage.has(identifier)) {
            storage.set(identifier, []);
        }
        
        const attempts = storage.get(identifier);
        
        // Remove old attempts outside window
        while (attempts.length > 0 && attempts[0] < windowStart) {
            attempts.shift();
        }
        
        const remainingAttempts = Math.max(0, maxAttempts - attempts.length);
        const allowed = remainingAttempts > 0;
        
        if (allowed) {
            attempts.push(now);
            storage.set(identifier, attempts);
        }
        
        const resetTime = attempts.length > 0 ? attempts[0] + windowMs : now;
        
        return {
            allowed,
            remainingAttempts,
            resetTime
        };
    }

    /**
     * Validate password strength
     * @param {string} password 
     * @returns {Object}
     */
    static validatePasswordStrength(password) {
        const result = {
            isValid: false,
            score: 0,
            feedback: []
        };

        if (!password) {
            result.feedback.push('Mật khẩu không được để trống');
            return result;
        }

        // Minimum length
        if (password.length < 8) {
            result.feedback.push('Mật khẩu phải có ít nhất 8 ký tự');
        } else {
            result.score += 1;
        }

        // Character variety checks
        if (!/[a-z]/.test(password)) {
            result.feedback.push('Mật khẩu phải có ít nhất một chữ thường');
        } else {
            result.score += 1;
        }

        if (!/[A-Z]/.test(password)) {
            result.feedback.push('Mật khẩu phải có ít nhất một chữ hoa');
        } else {
            result.score += 1;
        }

        if (!/[0-9]/.test(password)) {
            result.feedback.push('Mật khẩu phải có ít nhất một chữ số');
        } else {
            result.score += 1;
        }

        if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
            result.feedback.push('Mật khẩu phải có ít nhất một ký tự đặc biệt');
        } else {
            result.score += 1;
        }

        // Common password patterns
        const commonPatterns = [
            /123456/,
            /password/i,
            /qwerty/i,
            /admin/i,
            /crown/i
        ];

        const hasCommonPattern = commonPatterns.some(pattern => pattern.test(password));
        if (hasCommonPattern) {
            result.feedback.push('Mật khẩu không được chứa từ hoặc chuỗi phổ biến');
            result.score -= 1;
        }

        result.isValid = result.score >= 4 && result.feedback.length === 0;
        
        return result;
    }

    /**
     * Sanitize input to prevent XSS and injection attacks
     * @param {any} input 
     * @returns {any}
     */
    static sanitizeInput(input) {
        if (typeof input === 'string') {
            return input
                .replace(/[<>]/g, '') // Remove angle brackets
                .replace(/javascript:/gi, '') // Remove javascript: protocol
                .replace(/vbscript:/gi, '') // Remove vbscript: protocol
                .replace(/on\w+\s*=/gi, '') // Remove event handlers
                .replace(/data:/gi, '') // Remove data: protocol
                .trim();
        }
        
        if (Array.isArray(input)) {
            return input.map(item => this.sanitizeInput(item));
        }
        
        if (typeof input === 'object' && input !== null) {
            const sanitized = {};
            for (const key in input) {
                sanitized[key] = this.sanitizeInput(input[key]);
            }
            return sanitized;
        }
        
        return input;
    }

    /**
     * Generate secure API key
     * @returns {string}
     */
    static generateApiKey() {
        const prefix = 'crown_';
        const key = crypto.randomBytes(32).toString('base64url');
        return prefix + key;
    }

    /**
     * Hash API key for storage
     * @param {string} apiKey 
     * @returns {string}
     */
    static hashApiKey(apiKey) {
        return crypto.createHash('sha256').update(apiKey).digest('hex');
    }

    /**
     * Verify API key
     * @param {string} apiKey 
     * @param {string} hashedKey 
     * @returns {boolean}
     */
    static verifyApiKey(apiKey, hashedKey) {
        const hash = this.hashApiKey(apiKey);
        return crypto.timingSafeEqual(
            Buffer.from(hash, 'hex'),
            Buffer.from(hashedKey, 'hex')
        );
    }
}

module.exports = SecurityUtils;
