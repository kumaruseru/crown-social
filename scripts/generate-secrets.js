#!/usr/bin/env node

/**
 * Generate Secure Secrets for Crown Social Network
 * Script để generate các secrets bảo mật cho production
 */

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

console.log('🔐 CROWN SOCIAL NETWORK - SECURITY SECRETS GENERATOR');
console.log('==================================================\n');

/**
 * Generate secure random string
 */
function generateSecureSecret(length = 64) {
    return crypto.randomBytes(length).toString('hex');
}

/**
 * Generate JWT key pair
 */
function generateJWTKeys() {
    return {
        secret: generateSecureSecret(64),
        refreshSecret: generateSecureSecret(64)
    };
}

/**
 * Generate AES encryption key
 */
function generateAESKey() {
    return crypto.randomBytes(32).toString('hex');
}

/**
 * Generate API key
 */
function generateAPIKey() {
    const prefix = 'crown_';
    const key = crypto.randomBytes(32).toString('base64url');
    return prefix + key;
}

/**
 * Main generation function
 */
function generateAllSecrets() {
    console.log('🔑 Generating secure secrets...\n');
    
    const secrets = {
        // Session & Security
        SESSION_SECRET: generateSecureSecret(64),
        
        // JWT Tokens
        JWT_SECRET: generateSecureSecret(64),
        JWT_REFRESH_SECRET: generateSecureSecret(64),
        
        // Encryption
        AES_ENCRYPTION_KEY: generateAESKey(),
        
        // API Security
        API_KEY: generateAPIKey(),
        
        // Database encryption salt
        DB_ENCRYPTION_SALT: generateSecureSecret(32),
        
        // CSRF Secret
        CSRF_SECRET: generateSecureSecret(32)
    };
    
    // Generate hashes for storage
    secrets.API_KEY_HASH = crypto.createHash('sha256').update(secrets.API_KEY).digest('hex');
    
    return secrets;
}

/**
 * Display secrets in different formats
 */
function displaySecrets(secrets) {
    console.log('📋 Generated Secrets (Copy to your .env file):');
    console.log('==============================================\n');
    
    // Environment file format
    console.log('# SECURITY SECRETS - Generated:', new Date().toISOString());
    console.log('# ⚠️  KEEP THESE SECRETS SECURE - DO NOT COMMIT TO VERSION CONTROL\n');
    
    Object.entries(secrets).forEach(([key, value]) => {
        if (key !== 'API_KEY_HASH') { // Don't show hash in .env
            console.log(`${key}=${value}`);
        }
    });
    
    console.log('\n# API Key Hash (for database storage):');
    console.log(`# API_KEY_HASH=${secrets.API_KEY_HASH}`);
    
    console.log('\n==============================================\n');
}

/**
 * Save secrets to file
 */
function saveSecretsToFile(secrets) {
    const envFile = path.join(__dirname, '.env.secrets');
    
    let content = '# CROWN SOCIAL NETWORK - SECURITY SECRETS\n';
    content += `# Generated: ${new Date().toISOString()}\n`;
    content += '# ⚠️  KEEP THESE SECRETS SECURE - DO NOT COMMIT TO VERSION CONTROL\n\n';
    content += '# Copy these values to your .env file\n\n';
    
    Object.entries(secrets).forEach(([key, value]) => {
        if (key !== 'API_KEY_HASH') {
            content += `${key}=${value}\n`;
        }
    });
    
    content += '\n# Database storage values:\n';
    content += `API_KEY_HASH=${secrets.API_KEY_HASH}\n`;
    
    fs.writeFileSync(envFile, content);
    
    console.log(`💾 Secrets saved to: ${envFile}`);
    console.log('⚠️  Remember to delete this file after copying to .env!\n');
}

/**
 * Security recommendations
 */
function showSecurityRecommendations() {
    console.log('🛡️  SECURITY RECOMMENDATIONS:');
    console.log('=============================\n');
    
    console.log('1. 🔐 Environment Security:');
    console.log('   - Copy secrets to .env file');
    console.log('   - Add .env to .gitignore');
    console.log('   - Delete .env.secrets file after use');
    console.log('   - Set proper file permissions (600)\n');
    
    console.log('2. 🔄 Secret Rotation:');
    console.log('   - Rotate JWT secrets monthly');
    console.log('   - Rotate API keys quarterly');
    console.log('   - Rotate encryption keys annually\n');
    
    console.log('3. 📊 Monitoring:');
    console.log('   - Monitor for invalid token usage');
    console.log('   - Alert on multiple failed API attempts');
    console.log('   - Log all admin access attempts\n');
    
    console.log('4. 💾 Backup & Recovery:');
    console.log('   - Store secrets in secure password manager');
    console.log('   - Have emergency access procedures');
    console.log('   - Document secret recovery process\n');
    
    console.log('5. 🔍 Security Testing:');
    console.log('   - Test with generated secrets');
    console.log('   - Verify all authentication flows');
    console.log('   - Conduct regular security audits\n');
}

/**
 * Main execution
 */
function main() {
    try {
        const secrets = generateAllSecrets();
        displaySecrets(secrets);
        saveSecretsToFile(secrets);
        showSecurityRecommendations();
        
        console.log('✅ Secret generation completed successfully!');
        console.log('🚀 Your Crown Social Network is now ready for secure deployment.\n');
        
    } catch (error) {
        console.error('❌ Error generating secrets:', error.message);
        process.exit(1);
    }
}

// Run if called directly
if (require.main === module) {
    main();
}

module.exports = {
    generateAllSecrets,
    generateSecureSecret,
    generateJWTKeys,
    generateAESKey,
    generateAPIKey
};
