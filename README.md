# Crown Social Network 👑

## Mô tả dự án
Crown là một mạng xã hội hiện đại được xây dựng theo kiến trúc OOP với Node.js, Express.js và MongoDB.

## 🚀 Tính năng

### Hiện tại
- ✅ Hệ thống đăng ký/đăng nhập với mã hóa bcrypt
- ✅ Giao diện đẹp với Tailwind CSS và hiệu ứng particle
- ✅ Kiến trúc OOP chuyên nghiệp
- ✅ MongoDB Atlas integration
- ✅ Validation toàn diện
- ✅ Error handling và logging
- ✅ Environment configuration

### Sắp tới
- 🔄 JWT Authentication & Session Management
- 🔄 OAuth (Google, Facebook)
- 🔄 Email verification
- 🔄 Password reset
- 🔄 File upload (avatar)
- 🔄 User profiles
- 🔄 News feed
- 🔄 Real-time chat
- 🔄 Redis caching
- 🔄 Rate limiting

## 🏗️ Kiến trúc

```
crown2/
├── src/
│   ├── controllers/     # HTTP request handlers
│   ├── models/         # Database models & schemas
│   ├── services/       # Business logic
│   ├── routes/         # API routes
│   ├── middleware/     # Custom middleware
│   └── utils/          # Helper utilities
├── config/
│   └── app.js         # Application configuration
├── public/
│   ├── css/           # Stylesheets
│   └── js/            # Client-side JavaScript
├── views/             # HTML templates
├── uploads/           # File uploads (gitignored)
├── .env              # Environment variables (gitignored)
└── server.js         # Application entry point
```

## 🛠️ Tech Stack

### Backend
- **Node.js** - JavaScript runtime
- **Express.js** - Web framework
- **MongoDB** - Database
- **Mongoose** - ODM
- **bcryptjs** - Password hashing
- **jsonwebtoken** - JWT authentication
- **dotenv** - Environment management

### Frontend
- **HTML5/CSS3** - Markup & styling
- **Tailwind CSS** - Utility-first CSS
- **Vanilla JavaScript** - Client-side logic
- **Particle.js** - Background effects

### DevOps & Tools
- **MongoDB Atlas** - Cloud database
- **Nodemon** - Development auto-reload
- **ESLint & Prettier** - Code quality

## 🚦 Cài đặt

### Prerequisites
- Node.js >= 18.0.0
- npm >= 8.0.0
- MongoDB Atlas account

### Installation
```bash
# Clone repository
git clone <repository-url>
cd crown2

# Install dependencies
npm install

# Setup environment variables
cp .env.example .env
# Chỉnh sửa file .env với thông tin của bạn

# Start development server
npm run dev

# Or start production server
npm start
```

## 🌍 Environment Variables

Tạo file `.env` với nội dung:

```bash
# Server Configuration
NODE_ENV=development
PORT=3000

# Database Configuration
MONGODB_URI=your_mongodb_atlas_connection_string

# Security Configuration
JWT_SECRET=your_super_secret_jwt_key
JWT_REFRESH_SECRET=your_refresh_token_secret
SESSION_SECRET=your_session_secret

# OAuth Configuration (Optional)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
FACEBOOK_APP_ID=your_facebook_app_id
FACEBOOK_APP_SECRET=your_facebook_app_secret

# Email Configuration (Optional)
SMTP_HOST=your_smtp_host
SMTP_PORT=587
SMTP_USER=your_email
SMTP_PASS=your_email_password
```

## 📝 API Documentation

### Authentication Endpoints
- `POST /api/register` - Đăng ký user mới
- `POST /api/login` - Đăng nhập
- `POST /api/logout` - Đăng xuất
- `GET /api/user` - Lấy thông tin user hiện tại

### Web Routes
- `GET /` - Redirect to login
- `GET /login.html` - Trang đăng nhập
- `GET /register.html` - Trang đăng ký
- `GET /health` - Health check

## 🏃‍♂️ Scripts

```bash
npm start          # Start production server
npm run dev        # Start development server with nodemon
npm test           # Run tests (TODO)
npm run lint       # Run ESLint
npm run format     # Format code with Prettier
```

## 🔧 Development

### Code Structure
- **Controllers**: Xử lý HTTP requests
- **Services**: Business logic
- **Models**: Database schemas và validation
- **Routes**: API routing
- **Middleware**: Custom middleware functions
- **Utils**: Helper functions

### Best Practices
- Sử dụng async/await cho operations bất đồng bộ
- Validate tất cả input data
- Hash passwords trước khi lưu
- Log errors và activities
- Handle graceful shutdowns

## 🐛 Debugging

### Common Issues
1. **MongoDB Connection Error**
   - Kiểm tra MONGODB_URI trong .env
   - Đảm bảo IP whitelist trên MongoDB Atlas

2. **Port Already in Use**
   - Thay đổi PORT trong .env
   - Kill process đang sử dụng port

3. **Missing Dependencies**
   - Chạy `npm install`
   - Xóa node_modules và reinstall

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.

## 👥 Authors

- **Trong Nghia** - *Initial work* - [GitHub Profile]

## 🙏 Acknowledgments

- Tailwind CSS team for amazing utility framework
- MongoDB team for excellent database solution
- Express.js community for robust web framework
- All contributors and beta testers

---

**Crown Social Network** - Kết nối mọi người, chia sẻ mọi khoảnh khắc! 👑✨
