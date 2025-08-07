const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

/**
 * Hardware Security Module (HSM) Integration
 * Quản lý keys và cryptographic operations với HSM support
 */
class HSMManager {
    constructor() {
        this.hsmEnabled = process.env.HSM_ENABLED === 'true';
        this.hsmProvider = process.env.HSM_PROVIDER || 'software'; // 'aws-cloudhsm', 'azure-hsm', 'software'
        this.keyCache = new Map();
        this.initializeHSM();
    }

    /**
     * Initialize HSM connection
     */
    async initializeHSM() {
        if (!this.hsmEnabled) {
            console.log('🔐 Using software-based key management');
            return this.initializeSoftwareKeys();
        }

        switch (this.hsmProvider) {
            case 'aws-cloudhsm':
                return this.initializeAWSCloudHSM();
            case 'azure-hsm':
                return this.initializeAzureHSM();
            case 'hashicorp-vault':
                return this.initializeHashiCorpVault();
            default:
                return this.initializeSoftwareKeys();
        }
    }

    /**
     * Initialize AWS CloudHSM
     */
    async initializeAWSCloudHSM() {
        try {
            // AWS CloudHSM SDK integration
            const { CloudHSMv2 } = require('aws-sdk');
            
            this.cloudHSM = new CloudHSMv2({
                region: process.env.AWS_REGION || 'us-east-1',
                accessKeyId: process.env.AWS_ACCESS_KEY_ID,
                secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
            });

            console.log('🔐 AWS CloudHSM initialized successfully');
            return true;
        } catch (error) {
            console.error('❌ AWS CloudHSM initialization failed:', error.message);
            return this.fallbackToSoftware();
        }
    }

    /**
     * Initialize Azure Dedicated HSM
     */
    async initializeAzureHSM() {
        try {
            // Azure Key Vault integration
            const { KeyVaultKeys } = require('@azure/keyvault-keys');
            const { DefaultAzureCredential } = require('@azure/identity');

            const credential = new DefaultAzureCredential();
            const vaultUrl = process.env.AZURE_KEY_VAULT_URL;
            
            this.keyVaultClient = new KeyVaultKeys(vaultUrl, credential);
            
            console.log('🔐 Azure HSM initialized successfully');
            return true;
        } catch (error) {
            console.error('❌ Azure HSM initialization failed:', error.message);
            return this.fallbackToSoftware();
        }
    }

    /**
     * Initialize HashiCorp Vault
     */
    async initializeHashiCorpVault() {
        try {
            const vault = require('node-vault');
            
            this.vaultClient = vault({
                endpoint: process.env.VAULT_ENDPOINT || 'http://localhost:8200',
                token: process.env.VAULT_TOKEN
            });

            // Test connection
            await this.vaultClient.status();
            
            console.log('🔐 HashiCorp Vault initialized successfully');
            return true;
        } catch (error) {
            console.error('❌ HashiCorp Vault initialization failed:', error.message);
            return this.fallbackToSoftware();
        }
    }

    /**
     * Initialize software-based key management
     */
    initializeSoftwareKeys() {
        const keyDir = path.join(__dirname, '../../keys');
        
        // Create keys directory if not exists
        if (!fs.existsSync(keyDir)) {
            fs.mkdirSync(keyDir, { recursive: true, mode: 0o700 });
        }

        console.log('🔐 Software key management initialized');
        return true;
    }

    /**
     * Fallback to software implementation
     */
    fallbackToSoftware() {
        console.warn('⚠️ Falling back to software key management');
        this.hsmEnabled = false;
        this.hsmProvider = 'software';
        return this.initializeSoftwareKeys();
    }

    /**
     * Generate encryption key
     */
    async generateEncryptionKey(keyId, algorithm = 'AES-256') {
        if (this.hsmEnabled) {
            return this.generateHSMKey(keyId, algorithm);
        }
        
        return this.generateSoftwareKey(keyId, algorithm);
    }

    /**
     * Generate HSM-backed key
     */
    async generateHSMKey(keyId, algorithm) {
        try {
            switch (this.hsmProvider) {
                case 'aws-cloudhsm':
                    return this.generateAWSKey(keyId, algorithm);
                case 'azure-hsm':
                    return this.generateAzureKey(keyId, algorithm);
                case 'hashicorp-vault':
                    return this.generateVaultKey(keyId, algorithm);
                default:
                    throw new Error('Unsupported HSM provider');
            }
        } catch (error) {
            console.error(`HSM key generation failed: ${error.message}`);
            return this.generateSoftwareKey(keyId, algorithm);
        }
    }

    /**
     * Generate AWS CloudHSM key
     */
    async generateAWSKey(keyId, algorithm) {
        const keySpec = algorithm === 'AES-256' ? 'AES_256' : 'RSA_2048';
        
        const params = {
            KeyUsage: 'ENCRYPT_DECRYPT',
            KeySpec: keySpec,
            Description: `Crown Social Key: ${keyId}`
        };

        const result = await this.cloudHSM.generateDataKey(params).promise();
        
        // Cache key handle
        this.keyCache.set(keyId, {
            keyId: result.KeyId,
            algorithm: algorithm,
            createdAt: new Date()
        });

        return result.KeyId;
    }

    /**
     * Generate Azure Key Vault key
     */
    async generateAzureKey(keyId, algorithm) {
        const keyType = algorithm === 'AES-256' ? 'oct' : 'RSA';
        const keySize = algorithm === 'AES-256' ? 256 : 2048;
        
        const result = await this.keyVaultClient.createKey(keyId, keyType, {
            keySize: keySize,
            keyOperations: ['encrypt', 'decrypt', 'sign', 'verify']
        });

        this.keyCache.set(keyId, {
            keyId: result.id,
            algorithm: algorithm,
            createdAt: new Date()
        });

        return result.id;
    }

    /**
     * Generate HashiCorp Vault key
     */
    async generateVaultKey(keyId, algorithm) {
        const keyData = {
            type: algorithm === 'AES-256' ? 'aes256-gcm96' : 'rsa-2048'
        };

        await this.vaultClient.write(`transit/keys/${keyId}`, keyData);
        
        this.keyCache.set(keyId, {
            keyId: keyId,
            algorithm: algorithm,
            createdAt: new Date()
        });

        return keyId;
    }

    /**
     * Generate software-based key
     */
    generateSoftwareKey(keyId, algorithm) {
        const keySize = algorithm === 'AES-256' ? 32 : 256; // 32 bytes for AES-256, 256 bytes for RSA
        const key = crypto.randomBytes(keySize);
        
        // Store key securely on filesystem
        const keyPath = path.join(__dirname, '../../keys', `${keyId}.key`);
        fs.writeFileSync(keyPath, key, { mode: 0o600 });
        
        this.keyCache.set(keyId, {
            keyId: keyId,
            keyPath: keyPath,
            algorithm: algorithm,
            createdAt: new Date()
        });

        return keyId;
    }

    /**
     * Encrypt data using HSM
     */
    async encrypt(keyId, plaintext) {
        if (this.hsmEnabled) {
            return this.hsmEncrypt(keyId, plaintext);
        }
        
        return this.softwareEncrypt(keyId, plaintext);
    }

    /**
     * HSM encryption
     */
    async hsmEncrypt(keyId, plaintext) {
        const keyInfo = this.keyCache.get(keyId);
        if (!keyInfo) {
            throw new Error(`Key ${keyId} not found`);
        }

        switch (this.hsmProvider) {
            case 'aws-cloudhsm':
                return this.awsEncrypt(keyInfo.keyId, plaintext);
            case 'azure-hsm':
                return this.azureEncrypt(keyInfo.keyId, plaintext);
            case 'hashicorp-vault':
                return this.vaultEncrypt(keyId, plaintext);
            default:
                throw new Error('Unsupported HSM provider');
        }
    }

    /**
     * Software encryption
     */
    softwareEncrypt(keyId, plaintext) {
        const keyInfo = this.keyCache.get(keyId);
        if (!keyInfo) {
            throw new Error(`Key ${keyId} not found`);
        }

        const key = fs.readFileSync(keyInfo.keyPath);
        const iv = crypto.randomBytes(16);
        const cipher = crypto.createCipher('aes-256-gcm', key, iv);
        
        let encrypted = cipher.update(plaintext, 'utf8', 'hex');
        encrypted += cipher.final('hex');
        
        const authTag = cipher.getAuthTag();
        
        return {
            encrypted: encrypted,
            iv: iv.toString('hex'),
            authTag: authTag.toString('hex'),
            keyId: keyId
        };
    }

    /**
     * Decrypt data
     */
    async decrypt(encryptedData) {
        const { keyId } = encryptedData;
        
        if (this.hsmEnabled) {
            return this.hsmDecrypt(keyId, encryptedData);
        }
        
        return this.softwareDecrypt(keyId, encryptedData);
    }

    /**
     * Software decryption
     */
    softwareDecrypt(keyId, encryptedData) {
        const keyInfo = this.keyCache.get(keyId);
        if (!keyInfo) {
            throw new Error(`Key ${keyId} not found`);
        }

        const key = fs.readFileSync(keyInfo.keyPath);
        const { encrypted, iv, authTag } = encryptedData;
        
        const decipher = crypto.createDecipher('aes-256-gcm', key, Buffer.from(iv, 'hex'));
        decipher.setAuthTag(Buffer.from(authTag, 'hex'));
        
        let decrypted = decipher.update(encrypted, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        
        return decrypted;
    }

    /**
     * Rotate encryption keys
     */
    async rotateKey(keyId) {
        console.log(`🔄 Rotating key: ${keyId}`);
        
        // Generate new key
        const newKeyId = `${keyId}_${Date.now()}`;
        await this.generateEncryptionKey(newKeyId);
        
        // Mark old key for retirement
        const oldKeyInfo = this.keyCache.get(keyId);
        if (oldKeyInfo) {
            oldKeyInfo.retired = true;
            oldKeyInfo.retiredAt = new Date();
        }
        
        // Update key mapping
        this.keyCache.set(keyId, this.keyCache.get(newKeyId));
        
        console.log(`✅ Key rotated: ${keyId} -> ${newKeyId}`);
        return newKeyId;
    }

    /**
     * Get key information
     */
    getKeyInfo(keyId) {
        return this.keyCache.get(keyId);
    }

    /**
     * List all keys
     */
    listKeys() {
        return Array.from(this.keyCache.entries()).map(([keyId, info]) => ({
            keyId,
            algorithm: info.algorithm,
            createdAt: info.createdAt,
            retired: info.retired || false
        }));
    }

    /**
     * Key health check
     */
    async healthCheck() {
        const status = {
            hsmEnabled: this.hsmEnabled,
            provider: this.hsmProvider,
            keysCount: this.keyCache.size,
            healthy: true,
            lastCheck: new Date()
        };

        if (this.hsmEnabled) {
            try {
                // Test HSM connectivity
                switch (this.hsmProvider) {
                    case 'aws-cloudhsm':
                        await this.cloudHSM.describeCluster().promise();
                        break;
                    case 'azure-hsm':
                        await this.keyVaultClient.listKeys().next();
                        break;
                    case 'hashicorp-vault':
                        await this.vaultClient.status();
                        break;
                }
            } catch (error) {
                status.healthy = false;
                status.error = error.message;
            }
        }

        return status;
    }
}

module.exports = HSMManager;
