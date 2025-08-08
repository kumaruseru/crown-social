# 📋 ENVIRONMENT VARIABLES CHO RENDER - COPY PASTE NHANH

## 🚨 URGENT FIX: MongoDB Connection Error
**Nếu deploy bị lỗi MongoDB:** `MONGODB_URI` là biến quan trọng nhất - phải thêm trước!

## 🔧 Server Configuration
```
NODE_ENV=production
PORT=3000
```

## 💾 Database Configuration (⚠️ QUAN TRỌNG NHẤT)
```
MONGODB_URI=mongodb+srv://nghiaht281003:Huong1505@cow.ewbokez.mongodb.net/cow?retryWrites=true&w=majority&appName=cow

DB_NAME=cow
```

## 🔐 Security Configuration
```
JWT_SECRET=[YOUR_JWT_SECRET_FROM_ENV_FILE]

JWT_REFRESH_SECRET=[YOUR_JWT_REFRESH_SECRET_FROM_ENV_FILE]

SESSION_SECRET=[YOUR_SESSION_SECRET_FROM_ENV_FILE]
```

## 🔑 OAuth Configuration
```
GOOGLE_CLIENT_ID=[YOUR_GOOGLE_CLIENT_ID_FROM_ENV_FILE]

GOOGLE_CLIENT_SECRET=[YOUR_GOOGLE_CLIENT_SECRET_FROM_ENV_FILE]

FACEBOOK_APP_ID=[YOUR_FACEBOOK_APP_ID_FROM_ENV_FILE]

FACEBOOK_APP_SECRET=[YOUR_FACEBOOK_APP_SECRET_FROM_ENV_FILE]

FACEBOOK_CALLBACK_URL=https://YOUR-SERVICE-NAME.onrender.com/oauth/facebook/callback
```
⚠️ **LƯU Ý**: Thay `YOUR-SERVICE-NAME` bằng tên service thực tế của bạn

## 📧 Email Configuration
```
EMAIL_SERVICE=production

EMAIL_FROM=noreply@cown.name.vn

EMAIL_FROM_NAME=Crown Social Network

SMTP_HOST=mail.cown.name.vn

SMTP_PORT=587

SMTP_USER=[YOUR_SMTP_USER_FROM_ENV_FILE]

SMTP_PASS=[YOUR_SMTP_PASS_FROM_ENV_FILE]

PROD_SMTP_HOST=cown.name.vn

PROD_SMTP_PORT=465

PROD_SMTP_USER=[YOUR_PROD_SMTP_USER_FROM_ENV_FILE]

PROD_SMTP_PASS=[YOUR_PROD_SMTP_PASS_FROM_ENV_FILE]

PROD_SMTP_SECURE=true
```

## 📁 Upload Configuration
```
MAX_FILE_SIZE=5242880

ALLOWED_FILE_TYPES=image/jpeg,image/png,image/gif,image/webp
```

## ⚡ Performance Configuration
```
COMPRESSION_ENABLED=true

CACHE_ENABLED=true

RATE_LIMITING_ENABLED=true
```

---

# 📊 TỔNG QUAN ENVIRONMENT VARIABLES

## 📈 Thống kê:
- **Tổng số biến**: 22 biến môi trường
- **Server**: 2 biến
- **Database**: 2 biến  
- **Security**: 3 biến
- **OAuth**: 5 biến
- **Email**: 9 biến
- **Upload**: 2 biến
- **Performance**: 3 biến

## ✅ Checklist khi thêm vào Render:
- [ ] Server Configuration (2 biến)
- [ ] Database Configuration (2 biến)
- [ ] Security Configuration (3 biến)
- [ ] OAuth Configuration (5 biến) 
- [ ] Email Configuration (9 biến)
- [ ] Upload Configuration (2 biến)
- [ ] Performance Configuration (3 biến)

## 🎯 Cách thêm nhanh vào Render:
1. **Render Dashboard** → **Your Service** → **Environment** tab
2. **Add Environment Variable** cho từng biến
3. **Copy Key** từ danh sách trên
4. **Copy Value** từ file .env local của bạn (thay [YOUR_*_FROM_ENV_FILE])
5. **Save** sau khi thêm tất cả

## 🔄 Lưu ý quan trọng:
- **FACEBOOK_CALLBACK_URL**: Cập nhật URL sau khi deploy xong
- **OAuth Redirects**: Cập nhật Google & Facebook console sau khi có URL
- **Email**: Đã sử dụng domain cown.name.vn của bạn
- **Database**: Sử dụng MongoDB Atlas cluster có sẵn

## 🚀 Sau khi thêm xong tất cả biến:
1. **Save Changes** → Render tự động redeploy  
2. **Wait for deployment** ~ 3-5 phút
3. **Check logs** để đảm bảo không có lỗi
4. **Test URL**: https://your-service-name.onrender.com/health

## 📝 Tham khảo values từ file .env local:
**Chạy lệnh này để xem values trong file .env:**
```bash
node setup-render-env.js
```
