#!/usr/bin/env node

/**
 * Crown Social Network - Render Environment Variables Setup
 * Script này tạo file chứa các environment variables để copy-paste vào Render
 */

const fs = require('fs');
const path = require('path');

console.log('🚀 Crown Social Network - Render Environment Setup');
console.log('═══════════════════════════════════════════════════');

// Đọc file .env hiện tại
const envPath = path.join(__dirname, '.env');
let envContent = '';

try {
    envContent = fs.readFileSync(envPath, 'utf8');
    console.log('✅ Đọc file .env thành công');
} catch (error) {
    console.error('❌ Không thể đọc file .env:', error.message);
    process.exit(1);
}

// Parse environment variables
const envVars = {};
const lines = envContent.split('\n');

lines.forEach(line => {
    line = line.trim();
    if (line && !line.startsWith('#')) {
        const [key, ...valueParts] = line.split('=');
        if (key && valueParts.length > 0) {
            envVars[key.trim()] = valueParts.join('=').trim();
        }
    }
});

// Tạo environment variables cho production
const productionVars = {
    // Server Configuration
    'NODE_ENV': 'production',
    'PORT': '3000',
    
    // Database
    'MONGODB_URI': envVars.MONGODB_URI,
    
    // Security
    'JWT_SECRET': envVars.JWT_SECRET,
    'JWT_REFRESH_SECRET': envVars.JWT_REFRESH_SECRET,
    'SESSION_SECRET': envVars.SESSION_SECRET,
    
    // OAuth
    'GOOGLE_CLIENT_ID': envVars.GOOGLE_CLIENT_ID,
    'GOOGLE_CLIENT_SECRET': envVars.GOOGLE_CLIENT_SECRET,
    'FACEBOOK_APP_ID': envVars.FACEBOOK_APP_ID,
    'FACEBOOK_APP_SECRET': envVars.FACEBOOK_APP_SECRET,
    'FACEBOOK_CALLBACK_URL': 'https://YOUR_RENDER_URL.onrender.com/oauth/facebook/callback',
    
    // Email
    'EMAIL_SERVICE': envVars.EMAIL_SERVICE || 'production',
    'EMAIL_FROM': envVars.EMAIL_FROM,
    'EMAIL_FROM_NAME': envVars.EMAIL_FROM_NAME || 'Crown Social Network',
    'SMTP_HOST': envVars.SMTP_HOST,
    'SMTP_PORT': envVars.SMTP_PORT,
    'SMTP_USER': envVars.SMTP_USER,
    'SMTP_PASS': envVars.SMTP_PASS,
    'PROD_SMTP_HOST': envVars.PROD_SMTP_HOST,
    'PROD_SMTP_PORT': envVars.PROD_SMTP_PORT,
    'PROD_SMTP_USER': envVars.PROD_SMTP_USER,
    'PROD_SMTP_PASS': envVars.PROD_SMTP_PASS,
    'PROD_SMTP_SECURE': envVars.PROD_SMTP_SECURE,
    
    // File Upload
    'MAX_FILE_SIZE': envVars.MAX_FILE_SIZE || '5242880',
    'ALLOWED_FILE_TYPES': envVars.ALLOWED_FILE_TYPES || 'image/jpeg,image/png,image/gif,image/webp',
    
    // Performance
    'COMPRESSION_ENABLED': 'true',
    'CACHE_ENABLED': 'true',
    'RATE_LIMITING_ENABLED': 'true',
};

// Tạo nội dung file hướng dẫn
let guide = `# 🚀 CROWN SOCIAL NETWORK - RENDER ENVIRONMENT VARIABLES

## 📋 COPY-PASTE CÁC BIẾN MÔI TRƯỜNG SAU VÀO RENDER:

### 🎯 Bước 1: Truy cập Render Dashboard
1. Đi đến: https://render.com/dashboard
2. Chọn service Crown Social Network
3. Vào tab "Environment"
4. Add từng biến dưới đây:

### ⚙️ Bước 2: Thêm Environment Variables

`;

// Nhóm các biến theo category
const categories = {
    '🔧 Server Configuration': ['NODE_ENV', 'PORT'],
    '💾 Database Configuration': ['MONGODB_URI'],
    '🔐 Security Configuration': ['JWT_SECRET', 'JWT_REFRESH_SECRET', 'SESSION_SECRET'],
    '🔑 OAuth Configuration': ['GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET', 'FACEBOOK_APP_ID', 'FACEBOOK_APP_SECRET', 'FACEBOOK_CALLBACK_URL'],
    '📧 Email Configuration': ['EMAIL_SERVICE', 'EMAIL_FROM', 'EMAIL_FROM_NAME', 'SMTP_HOST', 'SMTP_PORT', 'SMTP_USER', 'SMTP_PASS', 'PROD_SMTP_HOST', 'PROD_SMTP_PORT', 'PROD_SMTP_USER', 'PROD_SMTP_PASS', 'PROD_SMTP_SECURE'],
    '📁 Upload Configuration': ['MAX_FILE_SIZE', 'ALLOWED_FILE_TYPES'],
    '⚡ Performance Configuration': ['COMPRESSION_ENABLED', 'CACHE_ENABLED', 'RATE_LIMITING_ENABLED']
};

Object.entries(categories).forEach(([category, keys]) => {
    guide += `#### ${category}\n\`\`\`bash\n`;
    keys.forEach(key => {
        if (productionVars[key] && productionVars[key] !== 'undefined') {
            guide += `${key}=${productionVars[key]}\n`;
        }
    });
    guide += `\`\`\`\n\n`;
});

// Thêm các hướng dẫn bổ sung
guide += `
## 🔄 Bước 3: Cập nhật OAuth Redirect URLs

### Google OAuth Console:
1. Truy cập: https://console.cloud.google.com
2. Chọn project → APIs & Services → Credentials
3. Edit OAuth 2.0 Client ID:
   - Authorized origins: https://YOUR_RENDER_URL.onrender.com
   - Redirect URIs: https://YOUR_RENDER_URL.onrender.com/auth/google/callback

### Facebook App Dashboard:
1. Truy cập: https://developers.facebook.com
2. Chọn app → Products → Facebook Login → Settings
3. Valid OAuth Redirect URIs: https://YOUR_RENDER_URL.onrender.com/auth/facebook/callback

## ✅ Bước 4: Deploy và Kiểm tra

1. **Deploy**: Render sẽ tự động deploy sau khi thêm env vars
2. **Health Check**: https://YOUR_RENDER_URL.onrender.com/health
3. **Test Features**: Login, OAuth, Socket.IO, File upload

## 🎊 Hoàn tất!

Crown Social Network của bạn đã sẵn sàng với:
- ✅ MongoDB Atlas Database
- ✅ Google & Facebook OAuth  
- ✅ Email với domain cown.name.vn
- ✅ Socket.IO Real-time
- ✅ File Upload & Media
- ✅ Security & Performance

**URL**: https://YOUR_RENDER_URL.onrender.com
`;

// Ghi file hướng dẫn
const guidePath = path.join(__dirname, 'RENDER_ENV_SETUP.md');
fs.writeFileSync(guidePath, guide, 'utf8');

// Tạo file .env cho production
let prodEnvContent = '# Crown Social Network - Production Environment for Render\n\n';
Object.entries(productionVars).forEach(([key, value]) => {
    if (value && value !== 'undefined') {
        prodEnvContent += `${key}=${value}\n`;
    }
});

const prodEnvPath = path.join(__dirname, '.env.render');
fs.writeFileSync(prodEnvPath, prodEnvContent, 'utf8');

// Kết quả
console.log('✅ Đã tạo file hướng dẫn: RENDER_ENV_SETUP.md');
console.log('✅ Đã tạo file môi trường: .env.render');
console.log('');
console.log('🎯 Tiếp theo:');
console.log('1. Đọc file RENDER_ENV_SETUP.md');
console.log('2. Copy-paste environment variables vào Render');
console.log('3. Deploy và enjoy! 🚀');
console.log('');
console.log('📊 Thống kê:');
console.log(`   - Tổng biến môi trường: ${Object.keys(productionVars).length}`);
console.log(`   - Database: MongoDB Atlas ✅`);
console.log(`   - OAuth: Google + Facebook ✅`);
console.log(`   - Email: Domain cown.name.vn ✅`);
console.log(`   - Security: JWT + Session ✅`);
