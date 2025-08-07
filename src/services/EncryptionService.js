/**
 * EncryptionService - Dịch vụ mã hóa đầu cuối cho tin nhắn
 * Sử dụng RSA cho trao đổi khóa và AES-GCM cho mã hóa tin nhắn
 */

const crypto = require('crypto');

class EncryptionService {
    constructor() {
        // Cấu hình thuật toán mã hóa
        this.RSA_KEY_SIZE = 2048;
        this.AES_ALGORITHM = 'aes-256-gcm';
        this.RSA_ALGORITHM = 'rsa-oaep';
        this.HASH_ALGORITHM = 'sha256';
    }

    /**
     * Tạo cặp khóa RSA cho người dùng
     * @returns {Object} { publicKey, privateKey }
     */
    generateRSAKeyPair() {
        try {
            const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
                modulusLength: this.RSA_KEY_SIZE,
                publicKeyEncoding: {
                    type: 'spki',
                    format: 'pem'
                },
                privateKeyEncoding: {
                    type: 'pkcs8',
                    format: 'pem'
                }
            });

            return { publicKey, privateKey };
        } catch (error) {
            console.error('Error generating RSA key pair:', error);
            throw new Error('Không thể tạo cặp khóa RSA');
        }
    }

    /**
     * Tạo khóa AES ngẫu nhiên cho phiên trò chuyện
     * @returns {Buffer} AES key
     */
    generateAESKey() {
        return crypto.randomBytes(32); // 256-bit key
    }

    /**
     * Mã hóa khóa AES bằng khóa công khai RSA
     * @param {Buffer} aesKey - Khóa AES cần mã hóa
     * @param {string} publicKey - Khóa công khai RSA (PEM format)
     * @returns {string} Khóa AES đã mã hóa (base64)
     */
    encryptAESKey(aesKey, publicKey) {
        try {
            const encrypted = crypto.publicEncrypt(
                {
                    key: publicKey,
                    padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
                    oaepHash: this.HASH_ALGORITHM
                },
                aesKey
            );
            return encrypted.toString('base64');
        } catch (error) {
            console.error('Error encrypting AES key:', error);
            throw new Error('Không thể mã hóa khóa AES');
        }
    }

    /**
     * Giải mã khóa AES bằng khóa riêng tư RSA
     * @param {string} encryptedAESKey - Khóa AES đã mã hóa (base64)
     * @param {string} privateKey - Khóa riêng tư RSA (PEM format)
     * @returns {Buffer} AES key
     */
    decryptAESKey(encryptedAESKey, privateKey) {
        try {
            const encryptedBuffer = Buffer.from(encryptedAESKey, 'base64');
            const decrypted = crypto.privateDecrypt(
                {
                    key: privateKey,
                    padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
                    oaepHash: this.HASH_ALGORITHM
                },
                encryptedBuffer
            );
            return decrypted;
        } catch (error) {
            console.error('Error decrypting AES key:', error);
            throw new Error('Không thể giải mã khóa AES');
        }
    }

    /**
     * Mã hóa tin nhắn bằng khóa AES
     * @param {string} message - Tin nhắn gốc
     * @param {Buffer} aesKey - Khóa AES
     * @returns {Object} { encryptedMessage, iv, authTag }
     */
    encryptMessage(message, aesKey) {
        try {
            const iv = crypto.randomBytes(16); // 128-bit IV for GCM
            const cipher = crypto.createCipher(this.AES_ALGORITHM, aesKey);
            cipher.setAAD(Buffer.from('crown-chat', 'utf8')); // Additional authenticated data
            
            let encrypted = cipher.update(message, 'utf8');
            encrypted = Buffer.concat([encrypted, cipher.final()]);
            
            const authTag = cipher.getAuthTag();

            return {
                encryptedMessage: encrypted.toString('base64'),
                iv: iv.toString('base64'),
                authTag: authTag.toString('base64')
            };
        } catch (error) {
            console.error('Error encrypting message:', error);
            throw new Error('Không thể mã hóa tin nhắn');
        }
    }

    /**
     * Giải mã tin nhắn bằng khóa AES
     * @param {string} encryptedMessage - Tin nhắn đã mã hóa (base64)
     * @param {string} iv - Initialization vector (base64)
     * @param {string} authTag - Authentication tag (base64)
     * @param {Buffer} aesKey - Khóa AES
     * @returns {string} Tin nhắn gốc
     */
    decryptMessage(encryptedMessage, iv, authTag, aesKey) {
        try {
            const decipher = crypto.createDecipher(this.AES_ALGORITHM, aesKey);
            decipher.setAAD(Buffer.from('crown-chat', 'utf8'));
            decipher.setAuthTag(Buffer.from(authTag, 'base64'));
            
            let decrypted = decipher.update(Buffer.from(encryptedMessage, 'base64'));
            decrypted = Buffer.concat([decrypted, decipher.final()]);
            
            return decrypted.toString('utf8');
        } catch (error) {
            console.error('Error decrypting message:', error);
            throw new Error('Không thể giải mã tin nhắn');
        }
    }

    /**
     * Tạo hash từ tin nhắn để kiểm tra tính toàn vẹn
     * @param {string} message - Tin nhắn gốc
     * @returns {string} Hash SHA-256
     */
    hashMessage(message) {
        return crypto.createHash(this.HASH_ALGORITHM)
            .update(message, 'utf8')
            .digest('hex');
    }

    /**
     * Xác minh hash của tin nhắn
     * @param {string} message - Tin nhắn
     * @param {string} hash - Hash cần xác minh
     * @returns {boolean} True nếu hash khớp
     */
    verifyMessageHash(message, hash) {
        const computedHash = this.hashMessage(message);
        return crypto.timingSafeEqual(
            Buffer.from(computedHash, 'hex'),
            Buffer.from(hash, 'hex')
        );
    }

    /**
     * Tạo fingerprint cho khóa công khai (để xác minh danh tính)
     * @param {string} publicKey - Khóa công khai RSA (PEM format)
     * @returns {string} Fingerprint SHA-256
     */
    generateKeyFingerprint(publicKey) {
        return crypto.createHash(this.HASH_ALGORITHM)
            .update(publicKey, 'utf8')
            .digest('hex')
            .match(/.{2}/g)
            .join(':')
            .toUpperCase();
    }

    /**
     * Tạo ID phiên trò chuyện từ ID của hai người dùng
     * @param {string} userId1 - ID người dùng 1
     * @param {string} userId2 - ID người dùng 2
     * @returns {string} Session ID
     */
    generateSessionId(userId1, userId2) {
        const sortedIds = [userId1, userId2].sort();
        return crypto.createHash(this.HASH_ALGORITHM)
            .update(sortedIds.join(':'), 'utf8')
            .digest('hex');
    }
}

module.exports = new EncryptionService();
