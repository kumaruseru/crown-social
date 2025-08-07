const path = require('path');
const BaseController = require('./BaseController');
const AuthService = require('../services/AuthService');
const passport = require('passport');

/**
 * AuthController - Xử lý các request liên quan đến authentication
 */
class AuthController extends BaseController {
    constructor() {
        super();
        this.authService = new AuthService();
    }

    /**
     * Hiển thị trang home
     * @param {Object} req 
     * @param {Object} res 
     */
    showRegisterPage(req, res) {
        res.sendFile(path.join(__dirname, '../../views/register.html'));
    }

    showHomePage(req, res) {
        try {
            console.log(`[${new Date().toISOString()}] SHOW_HOME_PAGE - IP: ${req.ip} - User-Agent: ${req.get('User-Agent')}`);
            res.sendFile(path.join(__dirname, '../../views/home.html'));
        } catch (error) {
            console.error('❌ Lỗi hiển thị trang home:', error);
            res.status(500).json({
                success: false,
                message: 'Không thể tải trang chủ',
                errors: []
            });
        }
    }

    showMapsPage(req, res) {
        try {
            console.log(`[${new Date().toISOString()}] SHOW_MAPS_PAGE - IP: ${req.ip} - User-Agent: ${req.get('User-Agent')}`);
            res.sendFile(path.join(__dirname, '../../views/maps.html'));
        } catch (error) {
            console.error('❌ Lỗi hiển thị trang maps:', error);
            res.status(500).json({
                success: false,
                message: 'Không thể tải trang bản đồ',
                errors: []
            });
        }
    }

    showMessagesPage(req, res) {
        try {
            console.log(`[${new Date().toISOString()}] SHOW_MESSAGES_PAGE - IP: ${req.ip} - User-Agent: ${req.get('User-Agent')}`);
            res.sendFile(path.join(__dirname, '../../views/messages.html'));
        } catch (error) {
            console.error('❌ Lỗi hiển thị trang messages:', error);
            res.status(500).json({
                success: false,
                message: 'Không thể tải trang tin nhắn',
                errors: []
            });
        }
    }

    /**
     * Hiển thị trang đăng nhập
     * @param {Object} req 
     * @param {Object} res 
     */
    showLoginPage = (req, res) => {
        try {
            this.logRequest(req, 'SHOW_LOGIN_PAGE');
            res.sendFile(path.join(__dirname, '../../views/login.html'));
        } catch (error) {
            console.error('❌ Lỗi hiển thị trang đăng nhập:', error);
            this.sendError(res, 'Không thể tải trang đăng nhập', [], 500);
        }
    }

    /**
     * Hiển thị trang đăng ký
     * @param {Object} req 
     * @param {Object} res 
     */
    showRegisterPage = (req, res) => {
        try {
            this.logRequest(req, 'SHOW_REGISTER_PAGE');
            res.sendFile(path.join(__dirname, '../../views/register.html'));
        } catch (error) {
            console.error('❌ Lỗi hiển thị trang đăng ký:', error);
            this.sendError(res, 'Không thể tải trang đăng ký', [], 500);
        }
    }

    /**
     * Xử lý đăng nhập
     * @param {Object} req 
     * @param {Object} res 
     */
    async register(req, res) {
        try {
            const { username, email, password, confirmPassword, firstName, lastName, day, month, year, gender } = req.body;
            
            // Validation
            if (!username || !email || !password || !confirmPassword || !firstName || !lastName || !day || !month || !year || !gender) {
                return res.status(400).json({
                    success: false,
                    message: 'Vui lòng điền đầy đủ thông tin'
                });
            }
            
            if (password !== confirmPassword) {
                return res.status(400).json({
                    success: false,
                    message: 'Mật khẩu xác nhận không khớp'
                });
            }
            
            if (password.length < 6) {
                return res.status(400).json({
                    success: false,
                    message: 'Mật khẩu phải có ít nhất 6 ký tự'
                });
            }
            
            // Email validation
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                return res.status(400).json({
                    success: false,
                    message: 'Email không hợp lệ'
                });
            }
            
            // Date validation
            const dateOfBirth = new Date(year, month - 1, day);
            if (isNaN(dateOfBirth.getTime())) {
                return res.status(400).json({
                    success: false,
                    message: 'Ngày sinh không hợp lệ'
                });
            }
            
            // Register user
            const result = await this.authService.register({
                username,
                email,
                password,
                firstName,
                lastName,
                day,
                month,
                year,
                gender
            });
            if (result.success) {
                res.json({
                    success: true,
                    message: 'Đăng ký thành công',
                    redirect: '/login.html'
                });
            } else {
                res.status(400).json({
                    success: false,
                    message: result.message
                });
            }
        } catch (error) {
            console.error('Register error:', error);
            res.status(500).json({
                success: false,
                message: 'Có lỗi xảy ra trong quá trình đăng ký'
            });
        }
    }

    login = async (req, res) => {
        try {
            this.logRequest(req, 'LOGIN_ATTEMPT');

            // Validate required fields
            const requiredFields = ['email', 'password'];
            const validationErrors = this.validateRequiredFields(req.body, requiredFields);
            
            if (validationErrors.length > 0) {
                return this.sendError(res, 'Thiếu thông tin bắt buộc', validationErrors);
            }

            // Xử lý đăng nhập
            const result = await this.authService.login(req.body);

            if (result.success) {
                console.log('🔧 About to log in user with Passport');
                console.log('🔧 User object:', {
                    id: result.user._id,
                    email: result.user.email,
                    firstName: result.user.firstName,
                    lastName: result.user.lastName
                });
                
                // Use Passport's req.logIn to properly set up session
                req.logIn(result.user, (err) => {
                    if (err) {
                        console.error('❌ Lỗi khi thiết lập session:', err);
                        return this.sendError(res, 'Lỗi thiết lập phiên đăng nhập', [], 500);
                    }
                    
                    console.log('✅ Session thiết lập thành công cho:', result.user.email);
                    console.log('✅ User ID in session:', result.user._id);
                    console.log('✅ Session passport:', req.session.passport);
                    console.log('✅ req.user được set:', !!req.user);
                    
                    this.sendSuccess(res, {
                        user: {
                            id: result.user._id,
                            username: result.user.username,
                            email: result.user.email,
                            firstName: result.user.firstName,
                            lastName: result.user.lastName,
                            fullName: result.user.firstName + ' ' + result.user.lastName
                        },
                        redirect: '/home.html'
                    }, result.message);
                });
            } else {
                console.log('❌ Đăng nhập thất bại:', result.message);
                return this.sendError(res, result.message, result.errors, 401);
            }

        } catch (error) {
            console.error('❌ Lỗi server trong login:', error);
            return this.sendError(res, 'Có lỗi xảy ra, vui lòng thử lại', [], 500);
        }
    }

    /**
     * Xử lý đăng ký
     * @param {Object} req 
     * @param {Object} res 
     */
    register = async (req, res) => {
        try {
            this.logRequest(req, 'REGISTER_ATTEMPT');
            
            console.log('📝 Register request body:', req.body);
            console.log('📝 Request body keys:', Object.keys(req.body));

            // Validate required fields  
            const requiredFields = ['first_name', 'last_name', 'email', 'username', 'password', 'password_confirm', 'day', 'month', 'year', 'gender'];
            const validationErrors = this.validateRequiredFields(req.body, requiredFields);
            
            if (validationErrors.length > 0) {
                console.log('❌ Validation errors:', validationErrors);
                return this.sendError(res, 'Thiếu thông tin bắt buộc', validationErrors);
            }

            // Map field names to match AuthService expectations
            const userData = {
                ...req.body,
                firstName: req.body.first_name,
                lastName: req.body.last_name,
                confirmPassword: req.body.password_confirm
            };

            // Xử lý đăng ký
            const result = await this.authService.register(userData);

            if (result.success) {
                console.log('✅ Đăng ký thành công:', result.user.email);
                return this.sendSuccess(res, {
                    user: result.user,
                    redirect: '/login'
                }, result.message, 201);
            } else {
                console.log('❌ Đăng ký thất bại:', result.message);
                return this.sendError(res, result.message, result.errors);
            }

        } catch (error) {
            console.error('❌ Lỗi server trong register:', error);
            return this.sendError(res, 'Có lỗi xảy ra, vui lòng thử lại', [], 500);
        }
    }

    /**
     * Đăng xuất
     * @param {Object} req 
     * @param {Object} res 
     */
    logout = (req, res) => {
        try {
            this.logRequest(req, 'LOGOUT');
            
            // Clear session/token (sẽ implement sau)
            
            return this.sendSuccess(res, {
                redirect: '/login'
            }, 'Đăng xuất thành công');

        } catch (error) {
            console.error('❌ Lỗi đăng xuất:', error);
            return this.sendError(res, 'Có lỗi xảy ra khi đăng xuất', [], 500);
        }
    }

    /**
     * Lấy thông tin user hiện tại
     * @param {Object} req 
     * @param {Object} res 
     */
    getCurrentUser = (req, res) => {
        try {
            console.log('🔍 getCurrentUser called');
            console.log('🔍 req.user:', req.user);
            console.log('🔍 req.isAuthenticated():', req.isAuthenticated());
            console.log('🔍 req.session:', req.session);
            
            if (!req.user) {
                console.log('❌ No user in session');
                return this.sendError(res, 'Chưa đăng nhập', [], 401);
            }

            const currentUser = {
                id: req.user._id,
                username: req.user.username,
                email: req.user.email,
                firstName: req.user.firstName,
                lastName: req.user.lastName,
                fullName: req.user.fullName || req.user.firstName + ' ' + req.user.lastName,
                avatar: req.user.getAvatarUrl ? req.user.getAvatarUrl() : req.user.avatar,
                provider: req.user.provider
            };

            console.log('✅ Returning user info:', currentUser);
            return this.sendSuccess(res, currentUser, 'Lấy thông tin người dùng thành công');

        } catch (error) {
            console.error('❌ Lỗi lấy thông tin user:', error);
            return this.sendError(res, 'Không thể lấy thông tin người dùng', [], 500);
        }
    }

    /**
     * Hiển thị trang quên mật khẩu
     * @param {Object} req 
     * @param {Object} res 
     */
    showForgotPasswordPage = (req, res) => {
        try {
            this.logRequest(req, 'SHOW_FORGOT_PASSWORD_PAGE');
            res.sendFile(path.join(__dirname, '../../views/forgotpassword.html'));
        } catch (error) {
            console.error('❌ Lỗi hiển thị trang quên mật khẩu:', error);
            this.sendError(res, 'Không thể tải trang quên mật khẩu', [], 500);
        }
    }

    /**
     * Xử lý yêu cầu quên mật khẩu
     * @param {Object} req 
     * @param {Object} res 
     */
    forgotPassword = async (req, res) => {
        try {
            this.logRequest(req, 'FORGOT_PASSWORD_REQUEST');

            const { email } = req.body;

            // Validate email
            if (!email) {
                return this.sendError(res, 'Vui lòng nhập email', ['Email là bắt buộc']);
            }

            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                return this.sendError(res, 'Email không hợp lệ', ['Định dạng email sai']);
            }

            // Xử lý forgot password
            const result = await this.authService.forgotPassword(email);

            if (result.success) {
                console.log('✅ Yêu cầu quên mật khẩu thành công:', email);
                return this.sendSuccess(res, { 
                    resetToken: result.resetToken // Chỉ để test, production sẽ remove
                }, result.message);
            } else {
                console.log('❌ Yêu cầu quên mật khẩu thất bại:', result.message);
                return this.sendError(res, result.message, result.errors);
            }

        } catch (error) {
            console.error('❌ Lỗi server trong forgot password:', error);
            return this.sendError(res, 'Có lỗi xảy ra, vui lòng thử lại', [], 500);
        }
    }

    /**
     * Hiển thị trang reset password
     * @param {Object} req 
     * @param {Object} res 
     */
    showResetPasswordPage = (req, res) => {
        try {
            this.logRequest(req, 'SHOW_RESET_PASSWORD_PAGE');
            res.sendFile(path.join(__dirname, '../../views/reset-password.html'));
        } catch (error) {
            console.error('❌ Lỗi hiển thị trang reset password:', error);
            this.sendError(res, 'Không thể tải trang reset password', [], 500);
        }
    }

    /**
     * Xử lý reset password
     * @param {Object} req 
     * @param {Object} res 
     */
    resetPassword = async (req, res) => {
        try {
            this.logRequest(req, 'RESET_PASSWORD_REQUEST');

            const { token, password, confirmPassword } = req.body;

            // Validate input
            if (!token) {
                return this.sendError(res, 'Token không hợp lệ', ['Token là bắt buộc']);
            }

            if (!password || !confirmPassword) {
                return this.sendError(res, 'Vui lòng nhập đầy đủ thông tin', ['Password là bắt buộc']);
            }

            if (password !== confirmPassword) {
                return this.sendError(res, 'Mật khẩu xác nhận không khớp', ['Password không khớp']);
            }

            if (password.length < 6) {
                return this.sendError(res, 'Mật khẩu phải có ít nhất 6 ký tự', ['Password quá ngắn']);
            }

            // Xử lý reset password
            const result = await this.authService.resetPassword(token, password);

            if (result.success) {
                console.log('✅ Reset password thành công');
                return this.sendSuccess(res, {
                    redirect: '/login.html'
                }, result.message);
            } else {
                console.log('❌ Reset password thất bại:', result.message);
                return this.sendError(res, result.message, result.errors);
            }

        } catch (error) {
            console.error('❌ Lỗi server trong reset password:', error);
            return this.sendError(res, 'Có lỗi xảy ra, vui lòng thử lại', [], 500);
        }
    }

    /**
     * Xử lý thay đổi mật khẩu (cho user đã đăng nhập)
     * @param {Object} req 
     * @param {Object} res 
     */
    changePassword = async (req, res) => {
        try {
            this.logRequest(req, 'CHANGE_PASSWORD_REQUEST');

            // Kiểm tra user đã đăng nhập
            if (!req.user) {
                return this.sendError(res, 'Vui lòng đăng nhập', [], 401);
            }

            const { currentPassword, newPassword, confirmPassword } = req.body;

            // Validate input
            if (!currentPassword || !newPassword || !confirmPassword) {
                return this.sendError(res, 'Vui lòng nhập đầy đủ thông tin', ['Thiếu thông tin bắt buộc']);
            }

            if (newPassword !== confirmPassword) {
                return this.sendError(res, 'Mật khẩu mới và xác nhận không khớp', ['Password không khớp']);
            }

            if (newPassword.length < 6) {
                return this.sendError(res, 'Mật khẩu mới phải có ít nhất 6 ký tự', ['Password quá ngắn']);
            }

            // Xử lý thay đổi mật khẩu
            const result = await this.authService.changePassword(req.user._id, currentPassword, newPassword);

            if (result.success) {
                console.log('✅ Thay đổi mật khẩu thành công:', req.user.email);
                return this.sendSuccess(res, {}, result.message);
            } else {
                console.log('❌ Thay đổi mật khẩu thất bại:', result.message);
                return this.sendError(res, result.message, result.errors);
            }

        } catch (error) {
            console.error('❌ Lỗi server trong change password:', error);
            return this.sendError(res, 'Có lỗi xảy ra, vui lòng thử lại', [], 500);
        }
    }

    // ==================== OAUTH METHODS ====================

    /**
     * Google OAuth - Bắt đầu authentication với Google
     */
    googleAuth = (req, res, next) => {
        passport.authenticate('google', {
            scope: ['profile', 'email']
        })(req, res, next);
    }

    /**
     * Google OAuth Callback - Xử lý callback từ Google
     */
    googleCallback = (req, res, next) => {
        passport.authenticate('google', (err, user, info) => {
            if (err) {
                console.error('Google OAuth error:', err);
                return res.redirect('/login.html?error=oauth_error');
            }
            
            if (!user) {
                return res.redirect('/login.html?error=oauth_failed');
            }

            // Đăng nhập user
            req.logIn(user, (err) => {
                if (err) {
                    console.error('Login after OAuth error:', err);
                    return res.redirect('/login.html?error=login_failed');
                }
                
                // Redirect về trang home
                return res.redirect('/home.html?login=success');
            });
        })(req, res, next);
    }

    /**
     * Facebook OAuth - Bắt đầu authentication với Facebook
     */
    facebookAuth = (req, res, next) => {
        passport.authenticate('facebook', {
            scope: ['email', 'public_profile']
        })(req, res, next);
    }

    /**
     * Facebook OAuth Callback - Xử lý callback từ Facebook
     */
    facebookCallback = (req, res, next) => {
        passport.authenticate('facebook', (err, user, info) => {
            if (err) {
                console.error('Facebook OAuth error:', err);
                return res.redirect('/login.html?error=oauth_error');
            }
            
            if (!user) {
                return res.redirect('/login.html?error=oauth_failed');
            }

            // Đăng nhập user
            req.logIn(user, (err) => {
                if (err) {
                    console.error('Login after OAuth error:', err);
                    return res.redirect('/login.html?error=login_failed');
                }
                
                // Redirect về trang home
                return res.redirect('/home.html?login=success');
            });
        })(req, res, next);
    }

    /**
     * Hiển thị trang active call
     * @param {Object} req 
     * @param {Object} res 
     */
    showActiveCallPage = (req, res) => {
        try {
            console.log(`[${new Date().toISOString()}] SHOW_ACTIVE_CALL_PAGE - IP: ${req.ip} - User-Agent: ${req.get('User-Agent')}`);
            res.sendFile(path.join(__dirname, '../../views/calls/active-call.html'));
        } catch (error) {
            console.error('❌ Lỗi hiển thị trang active call:', error);
            this.sendError(res, 'Không thể tải trang cuộc gọi', [], 500);
        }
    }

    /**
     * Hiển thị trang incoming call
     * @param {Object} req 
     * @param {Object} res 
     */
    showIncomingCallPage = (req, res) => {
        try {
            console.log(`[${new Date().toISOString()}] SHOW_INCOMING_CALL_PAGE - IP: ${req.ip} - User-Agent: ${req.get('User-Agent')}`);
            res.sendFile(path.join(__dirname, '../../views/calls/incoming-call.html'));
        } catch (error) {
            console.error('❌ Lỗi hiển thị trang incoming call:', error);
            this.sendError(res, 'Không thể tải trang cuộc gọi đến', [], 500);
        }
    }

    /**
     * Hiển thị trang outgoing call
     * @param {Object} req 
     * @param {Object} res 
     */
    showOutgoingCallPage = (req, res) => {
        try {
            console.log(`[${new Date().toISOString()}] SHOW_OUTGOING_CALL_PAGE - IP: ${req.ip} - User-Agent: ${req.get('User-Agent')}`);
            res.sendFile(path.join(__dirname, '../../views/calls/outgoing-call.html'));
        } catch (error) {
            console.error('❌ Lỗi hiển thị trang outgoing call:', error);
            this.sendError(res, 'Không thể tải trang cuộc gọi đi', [], 500);
        }
    }
}

module.exports = AuthController;
