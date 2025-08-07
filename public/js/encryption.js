/**
 * Client-side Encryption Service cho tin nhắn End-to-End Encrypted
 * Sử dụng Web Crypto API để mã hóa/giải mã phía client
 */

class ClientEncryptionService {
    constructor() {
        this.RSA_ALGORITHM = 'RSA-OAEP';
        this.AES_ALGORITHM = 'AES-GCM';
        this.HASH_ALGORITHM = 'SHA-256';
        this.RSA_KEY_SIZE = 2048;
        this.AES_KEY_SIZE = 256;
        
        // Cache cho public keys
        this.publicKeyCache = new Map();
        
        // User's private key (decrypted và cached)
        this.userPrivateKey = null;
        this.userPublicKey = null;
    }

    /**
     * Khởi tạo encryption cho user hiện tại
     */
    async initializeUserEncryption() {
        try {
            console.log('🔐 Khởi tạo encryption cho user...');
            
            // Gọi API để khởi tạo keys
            const response = await fetch('/api/messages/keys/init', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            
            const result = await response.json();
            
            if (result.success) {
                console.log('✅ Encryption keys đã được khởi tạo');
                this.userPublicKey = result.data.publicKey;
                return result.data;
            } else {
                throw new Error(result.message);
            }
            
        } catch (error) {
            console.error('❌ Lỗi khởi tạo encryption:', error);
            throw error;
        }
    }

    /**
     * Lấy public key của user khác
     */
    async getUserPublicKey(userId) {
        try {
            // Kiểm tra cache trước
            if (this.publicKeyCache.has(userId)) {
                return this.publicKeyCache.get(userId);
            }
            
            const response = await fetch(`/api/messages/keys/user/${userId}`);
            const result = await response.json();
            
            if (result.success) {
                const publicKeyData = result.data;
                
                // Import public key để sử dụng với Web Crypto API
                const publicKey = await this.importRSAPublicKey(publicKeyData.publicKey);
                
                const keyInfo = {
                    ...publicKeyData,
                    cryptoKey: publicKey
                };
                
                // Cache key
                this.publicKeyCache.set(userId, keyInfo);
                
                return keyInfo;
            } else {
                throw new Error(result.message);
            }
            
        } catch (error) {
            console.error(`❌ Lỗi lấy public key của user ${userId}:`, error);
            throw error;
        }
    }

    /**
     * Import RSA public key từ PEM format
     */
    async importRSAPublicKey(pemKey) {
        try {
            // Chuyển PEM sang binary
            const binaryKey = this.pemToBinary(pemKey);
            
            // Import key
            const publicKey = await crypto.subtle.importKey(
                'spki',
                binaryKey,
                {
                    name: this.RSA_ALGORITHM,
                    hash: this.HASH_ALGORITHM
                },
                false,
                ['encrypt']
            );
            
            return publicKey;
        } catch (error) {
            console.error('❌ Lỗi import RSA public key:', error);
            throw error;
        }
    }

    /**
     * Import RSA private key từ PEM format
     */
    async importRSAPrivateKey(pemKey) {
        try {
            const binaryKey = this.pemToBinary(pemKey);
            
            const privateKey = await crypto.subtle.importKey(
                'pkcs8',
                binaryKey,
                {
                    name: this.RSA_ALGORITHM,
                    hash: this.HASH_ALGORITHM
                },
                false,
                ['decrypt']
            );
            
            return privateKey;
        } catch (error) {
            console.error('❌ Lỗi import RSA private key:', error);
            throw error;
        }
    }

    /**
     * Chuyển PEM format sang binary
     */
    pemToBinary(pem) {
        const b64 = pem
            .replace(/-----BEGIN [A-Z ]+-----/g, '')
            .replace(/-----END [A-Z ]+-----/g, '')
            .replace(/\s/g, '');
        
        return Uint8Array.from(atob(b64), c => c.charCodeAt(0));
    }

    /**
     * Chuyển binary sang base64
     */
    arrayBufferToBase64(buffer) {
        const bytes = new Uint8Array(buffer);
        let binary = '';
        for (let i = 0; i < bytes.byteLength; i++) {
            binary += String.fromCharCode(bytes[i]);
        }
        return btoa(binary);
    }

    /**
     * Chuyển base64 sang ArrayBuffer
     */
    base64ToArrayBuffer(base64) {
        const binary = atob(base64);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) {
            bytes[i] = binary.charCodeAt(i);
        }
        return bytes.buffer;
    }

    /**
     * Tạo khóa AES ngẫu nhiên
     */
    async generateAESKey() {
        return await crypto.subtle.generateKey(
            {
                name: this.AES_ALGORITHM,
                length: this.AES_KEY_SIZE
            },
            true,
            ['encrypt', 'decrypt']
        );
    }

    /**
     * Mã hóa tin nhắn
     */
    async encryptMessage(message, receiverUserId) {
        try {
            console.log('🔐 Đang mã hóa tin nhắn...');
            
            // Lấy public key của receiver
            const receiverKeyInfo = await this.getUserPublicKey(receiverUserId);
            
            // Tạo khóa AES cho tin nhắn này
            const aesKey = await this.generateAESKey();
            
            // Mã hóa tin nhắn bằng AES
            const messageBuffer = new TextEncoder().encode(message);
            const iv = crypto.getRandomValues(new Uint8Array(12)); // 96-bit IV cho GCM
            
            const encryptedMessage = await crypto.subtle.encrypt(
                {
                    name: this.AES_ALGORITHM,
                    iv: iv,
                    additionalData: new TextEncoder().encode('crown-chat')
                },
                aesKey,
                messageBuffer
            );
            
            // Export AES key để mã hóa bằng RSA
            const aesKeyBuffer = await crypto.subtle.exportKey('raw', aesKey);
            
            // Mã hóa AES key cho receiver
            const receiverEncryptedKey = await crypto.subtle.encrypt(
                {
                    name: this.RSA_ALGORITHM
                },
                receiverKeyInfo.cryptoKey,
                aesKeyBuffer
            );
            
            // Mã hóa AES key cho sender (để sender có thể đọc lại tin nhắn)
            const senderPublicKey = await this.importRSAPublicKey(this.userPublicKey);
            const senderEncryptedKey = await crypto.subtle.encrypt(
                {
                    name: this.RSA_ALGORITHM
                },
                senderPublicKey,
                aesKeyBuffer
            );
            
            // Tạo hash của tin nhắn gốc
            const messageHash = await crypto.subtle.digest(this.HASH_ALGORITHM, messageBuffer);
            
            // Tách encrypted message thành content và auth tag
            const encryptedBuffer = new Uint8Array(encryptedMessage);
            const authTagLength = 16; // 128-bit auth tag cho GCM
            const encryptedContent = encryptedBuffer.slice(0, -authTagLength);
            const authTag = encryptedBuffer.slice(-authTagLength);
            
            return {
                encryptedContent: this.arrayBufferToBase64(encryptedContent),
                iv: this.arrayBufferToBase64(iv),
                authTag: this.arrayBufferToBase64(authTag),
                senderEncryptedKey: this.arrayBufferToBase64(senderEncryptedKey),
                receiverEncryptedKey: this.arrayBufferToBase64(receiverEncryptedKey),
                messageHash: this.arrayBufferToBase64(messageHash)
            };
            
        } catch (error) {
            console.error('❌ Lỗi mã hóa tin nhắn:', error);
            throw error;
        }
    }

    /**
     * Giải mã tin nhắn
     */
    async decryptMessage(encryptedData, encryptedAESKey, userPrivateKeyPem) {
        try {
            console.log('🔓 Đang giải mã tin nhắn...');
            
            // Import private key nếu chưa có
            if (!this.userPrivateKey) {
                this.userPrivateKey = await this.importRSAPrivateKey(userPrivateKeyPem);
            }
            
            // Giải mã AES key
            const encryptedKeyBuffer = this.base64ToArrayBuffer(encryptedAESKey);
            const aesKeyBuffer = await crypto.subtle.decrypt(
                {
                    name: this.RSA_ALGORITHM
                },
                this.userPrivateKey,
                encryptedKeyBuffer
            );
            
            // Import AES key
            const aesKey = await crypto.subtle.importKey(
                'raw',
                aesKeyBuffer,
                {
                    name: this.AES_ALGORITHM,
                    length: this.AES_KEY_SIZE
                },
                false,
                ['decrypt']
            );
            
            // Chuẩn bị dữ liệu để giải mã
            const encryptedContent = this.base64ToArrayBuffer(encryptedData.encryptedContent);
            const authTag = this.base64ToArrayBuffer(encryptedData.authTag);
            const iv = this.base64ToArrayBuffer(encryptedData.iv);
            
            // Ghép encrypted content và auth tag
            const encryptedMessage = new Uint8Array(encryptedContent.byteLength + authTag.byteLength);
            encryptedMessage.set(new Uint8Array(encryptedContent), 0);
            encryptedMessage.set(new Uint8Array(authTag), encryptedContent.byteLength);
            
            // Giải mã tin nhắn
            const decryptedMessage = await crypto.subtle.decrypt(
                {
                    name: this.AES_ALGORITHM,
                    iv: iv,
                    additionalData: new TextEncoder().encode('crown-chat')
                },
                aesKey,
                encryptedMessage
            );
            
            const message = new TextDecoder().decode(decryptedMessage);
            
            // Xác minh hash
            const computedHash = await crypto.subtle.digest(this.HASH_ALGORITHM, decryptedMessage);
            const providedHash = this.base64ToArrayBuffer(encryptedData.messageHash);
            
            const hashMatch = this.arrayBuffersEqual(computedHash, providedHash);
            if (!hashMatch) {
                console.warn('⚠️ Hash không khớp - tin nhắn có thể bị thay đổi');
            }
            
            return {
                message,
                hashVerified: hashMatch
            };
            
        } catch (error) {
            console.error('❌ Lỗi giải mã tin nhắn:', error);
            throw error;
        }
    }

    /**
     * So sánh hai ArrayBuffer
     */
    arrayBuffersEqual(buf1, buf2) {
        if (buf1.byteLength !== buf2.byteLength) return false;
        const view1 = new Uint8Array(buf1);
        const view2 = new Uint8Array(buf2);
        for (let i = 0; i < view1.length; i++) {
            if (view1[i] !== view2[i]) return false;
        }
        return true;
    }

    /**
     * Tạo fingerprint cho public key
     */
    async generateKeyFingerprint(publicKeyPem) {
        const keyBuffer = new TextEncoder().encode(publicKeyPem);
        const hashBuffer = await crypto.subtle.digest(this.HASH_ALGORITHM, keyBuffer);
        const hashArray = new Uint8Array(hashBuffer);
        
        return Array.from(hashArray)
            .map(b => b.toString(16).padStart(2, '0'))
            .join(':')
            .toUpperCase();
    }

    /**
     * Clear cache và private key khi logout
     */
    clearEncryptionData() {
        this.publicKeyCache.clear();
        this.userPrivateKey = null;
        this.userPublicKey = null;
        console.log('🧹 Đã xóa dữ liệu encryption');
    }
}

// Export singleton instance
window.ClientEncryptionService = new ClientEncryptionService();

console.log('🔐 Client Encryption Service đã được khởi tạo');
