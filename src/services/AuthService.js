const User = require('../models/User');
const DatabaseManager = require('../models/DatabaseManager');
const EmailService = require('./EmailService');
const crypto = require('crypto');

/**
 * AuthService - Xử lý logic xác thực với MongoDB
 */
class AuthService {
    constructor() {
        // Đảm bảo database đã kết nối
        this.ensureConnection();
        
        // Khởi tạo EmailService
        this.emailService = new EmailService();
    }

    /**
     * Đảm bảo database đã kết nối
     */
    async ensureConnection() {
        try {
            await DatabaseManager.connect();
        } catch (error) {
            console.error('❌ Không thể kết nối database:', error.message);
        }
    }

    /**
     * Đăng ký người dùng mới
     * @param {Object} userData 
     * @returns {Promise<Object>}
     */
    async register(userData) {
        try {
            // Validate required fields
            const requiredFields = ['username', 'email', 'password', 'firstName', 'lastName', 'day', 'month', 'year', 'gender'];
            for (const field of requiredFields) {
                if (!userData[field]) {
                    return {
                        success: false,
                        message: `Thiếu thông tin bắt buộc`,
                        errors: [`Vui lòng điền đầy đủ thông tin`]
                    };
                }
            }

            // Create date of birth
            const dateOfBirth = new Date(userData.year, userData.month - 1, userData.day);
            
            // Validate age
            const today = new Date();
            let age = today.getFullYear() - dateOfBirth.getFullYear();
            const monthDiff = today.getMonth() - dateOfBirth.getMonth();
            if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dateOfBirth.getDate())) {
                age--;
            }

            if (age < 13) {
                return {
                    success: false,
                    message: 'Bạn phải ít nhất 13 tuổi để đăng ký',
                    errors: ['Tuổi không hợp lệ']
                };
            }

            // Create user data
            const newUser = new User({
                username: userData.username,
                email: userData.email,
                password: userData.password,
                firstName: userData.firstName,
                lastName: userData.lastName,
                dateOfBirth: dateOfBirth,
                gender: userData.gender,
                provider: 'local'
            });

            // Kiểm tra user đã tồn tại
            const existingUser = await User.findByEmailOrUsername(newUser.email);
            if (existingUser) {
                const field = existingUser.email === newUser.email ? 'Email' : 'Tên người dùng';
                return {
                    success: false,
                    message: `${field} đã được sử dụng`,
                    errors: [`${field} đã tồn tại trong hệ thống`]
                };
            }

            // Lưu user vào database (password sẽ tự động được hash)
            const savedUser = await newUser.save();

            console.log('✅ Đăng ký thành công:', savedUser.firstName + ' ' + savedUser.lastName);

            // Gửi email chào mừng (không chờ kết quả để không làm chậm response)
            this.emailService.sendWelcomeEmail(
                savedUser.email,
                savedUser.fullName || `${savedUser.firstName} ${savedUser.lastName}`
            ).catch(error => {
                console.error('❌ Error sending welcome email:', error);
            });

            return {
                success: true,
                message: 'Đăng ký thành công',
                user: savedUser.toJSON()
            };

        } catch (error) {
            console.error('❌ Lỗi đăng ký:', error);

            // Handle validation errors
            if (error.name === 'ValidationError') {
                const errors = Object.values(error.errors).map(err => err.message);
                return {
                    success: false,
                    message: 'Dữ liệu không hợp lệ',
                    errors: errors
                };
            }

            // Handle duplicate key error
            if (error.code === 11000) {
                const field = Object.keys(error.keyValue)[0];
                const fieldName = field === 'email' ? 'Email' : 'Tên người dùng';
                return {
                    success: false,
                    message: `${fieldName} đã được sử dụng`,
                    errors: [`${fieldName} đã tồn tại trong hệ thống`]
                };
            }

            return {
                success: false,
                message: 'Có lỗi xảy ra trong quá trình đăng ký',
                errors: ['Lỗi server']
            };
        }
    }

    /**
     * Đăng nhập
     * @param {Object} loginData 
     * @returns {Promise<Object>}
     */
    async login(loginData) {
        try {
            const { email, password } = loginData;

            // Tìm user theo email hoặc username
            const user = await User.findByEmailOrUsername(email).select('+password');

            if (!user) {
                return {
                    success: false,
                    message: 'Email/Username hoặc mật khẩu không đúng',
                    errors: ['Thông tin đăng nhập không hợp lệ']
                };
            }

            // Kiểm tra user có active không
            if (!user.isActive) {
                return {
                    success: false,
                    message: 'Tài khoản đã bị vô hiệu hóa',
                    errors: ['Tài khoản không hoạt động']
                };
            }

            // Kiểm tra password
            const isPasswordValid = await user.comparePassword(password);
            if (!isPasswordValid) {
                return {
                    success: false,
                    message: 'Email/Username hoặc mật khẩu không đúng',
                    errors: ['Thông tin đăng nhập không hợp lệ']
                };
            }

            // Cập nhật thời gian đăng nhập
            await user.updateLastLogin();

            console.log('✅ Đăng nhập thành công:', user.fullName);

            return {
                success: true,
                message: 'Đăng nhập thành công',
                user: user  // Trả về Mongoose document, không phải JSON
            };

        } catch (error) {
            console.error('❌ Lỗi đăng nhập:', error);
            return {
                success: false,
                message: 'Có lỗi xảy ra trong quá trình đăng nhập',
                errors: ['Lỗi server']
            };
        }
    }

    /**
     * Lấy user theo ID
     * @param {string} userId 
     * @returns {Promise<Object|null>}
     */
    async getUserById(userId) {
        try {
            const user = await User.findById(userId);
            return user ? user.toJSON() : null;
        } catch (error) {
            console.error('❌ Lỗi lấy user:', error);
            return null;
        }
    }

    /**
     * Lấy user theo email
     * @param {string} email 
     * @returns {Promise<Object|null>}
     */
    async getUserByEmail(email) {
        try {
            const user = await User.findOne({ email: email.toLowerCase() });
            return user ? user.toJSON() : null;
        } catch (error) {
            console.error('❌ Lỗi lấy user:', error);
            return null;
        }
    }

    /**
     * Cập nhật thông tin user
     * @param {string} userId 
     * @param {Object} updateData 
     * @returns {Promise<Object>}
     */
    async updateUser(userId, updateData) {
        try {
            const user = await User.findByIdAndUpdate(
                userId,
                updateData,
                { new: true, runValidators: true }
            );

            if (!user) {
                return {
                    success: false,
                    message: 'Không tìm thấy người dùng',
                    errors: ['User không tồn tại']
                };
            }

            return {
                success: true,
                message: 'Cập nhật thông tin thành công',
                user: user.toJSON()
            };

        } catch (error) {
            console.error('❌ Lỗi cập nhật user:', error);

            if (error.name === 'ValidationError') {
                const errors = Object.values(error.errors).map(err => err.message);
                return {
                    success: false,
                    message: 'Dữ liệu không hợp lệ',
                    errors: errors
                };
            }

            return {
                success: false,
                message: 'Có lỗi xảy ra khi cập nhật',
                errors: ['Lỗi server']
            };
        }
    }

    /**
     * Xóa user (soft delete)
     * @param {string} userId 
     * @returns {Promise<Object>}
     */
    async deleteUser(userId) {
        try {
            const user = await User.findByIdAndUpdate(
                userId,
                { isActive: false },
                { new: true }
            );

            if (!user) {
                return {
                    success: false,
                    message: 'Không tìm thấy người dùng',
                    errors: ['User không tồn tại']
                };
            }

            return {
                success: true,
                message: 'Xóa người dùng thành công'
            };

        } catch (error) {
            console.error('❌ Lỗi xóa user:', error);
            return {
                success: false,
                message: 'Có lỗi xảy ra khi xóa',
                errors: ['Lỗi server']
            };
        }
    }

    /**
     * Gửi email reset password
     * @param {string} email 
     * @returns {Promise<Object>}
     */
    async forgotPassword(email) {
        try {
            // Tìm user theo email
            const user = await User.findOne({ 
                email: email.toLowerCase(),
                isActive: true
            });

            if (!user) {
                // Không thông báo user không tồn tại để tránh enumeration attack
                return {
                    success: true,
                    message: 'Nếu email này tồn tại trong hệ thống, bạn sẽ nhận được liên kết đặt lại mật khẩu trong vài phút.'
                };
            }

            // Kiểm tra xem user có phải OAuth user không
            if (user.provider !== 'local') {
                return {
                    success: false,
                    message: `Tài khoản này được đăng nhập bằng ${user.provider}. Vui lòng sử dụng ${user.provider} để đăng nhập.`,
                    errors: ['Tài khoản OAuth']
                };
            }

            // Tạo reset token
            const resetToken = user.createPasswordResetToken();
            await user.save({ validateBeforeSave: false });

            // Gửi email reset password
            const emailSent = await this.emailService.sendResetPasswordEmail(
                user.email,
                user.fullName || user.firstName || user.username,
                resetToken
            );

            if (!emailSent) {
                // Nếu gửi email thất bại, vẫn trả về success để tránh information disclosure
                console.log('❌ Failed to send reset password email, but returning success response');
            }

            return {
                success: true,
                message: 'Liên kết đặt lại mật khẩu đã được gửi đến email của bạn. Vui lòng kiểm tra hộp thư (bao gồm cả thư rác).',
                resetToken: resetToken // Chỉ để test, production sẽ remove
            };

        } catch (error) {
            console.error('❌ Lỗi forgot password:', error);
            return {
                success: false,
                message: 'Có lỗi xảy ra khi xử lý yêu cầu',
                errors: ['Lỗi server']
            };
        }
    }

    /**
     * Reset password với token
     * @param {string} token 
     * @param {string} newPassword 
     * @returns {Promise<Object>}
     */
    async resetPassword(token, newPassword) {
        try {
            // Validate new password
            if (!newPassword || newPassword.length < 6) {
                return {
                    success: false,
                    message: 'Mật khẩu mới phải có ít nhất 6 ký tự',
                    errors: ['Mật khẩu không hợp lệ']
                };
            }

            // Tìm user với token hợp lệ
            const user = await User.findByPasswordResetToken(token);

            if (!user) {
                return {
                    success: false,
                    message: 'Liên kết đặt lại mật khẩu không hợp lệ hoặc đã hết hạn',
                    errors: ['Token không hợp lệ']
                };
            }

            // Update password và clear reset token
            user.password = newPassword;
            user.passwordResetToken = undefined;
            user.passwordResetExpires = undefined;

            await user.save();

            console.log('✅ Reset password thành công:', user.email);

            return {
                success: true,
                message: 'Đặt lại mật khẩu thành công. Bạn có thể đăng nhập với mật khẩu mới.'
            };

        } catch (error) {
            console.error('❌ Lỗi reset password:', error);
            return {
                success: false,
                message: 'Có lỗi xảy ra khi đặt lại mật khẩu',
                errors: ['Lỗi server']
            };
        }
    }

    /**
     * Thay đổi mật khẩu (cho user đã đăng nhập)
     * @param {string} userId 
     * @param {string} currentPassword 
     * @param {string} newPassword 
     * @returns {Promise<Object>}
     */
    async changePassword(userId, currentPassword, newPassword) {
        try {
            // Validate new password
            if (!newPassword || newPassword.length < 6) {
                return {
                    success: false,
                    message: 'Mật khẩu mới phải có ít nhất 6 ký tự',
                    errors: ['Mật khẩu không hợp lệ']
                };
            }

            // Tìm user
            const user = await User.findById(userId).select('+password');
            if (!user) {
                return {
                    success: false,
                    message: 'Không tìm thấy người dùng',
                    errors: ['User không tồn tại']
                };
            }

            // Kiểm tra mật khẩu hiện tại
            const isCurrentPasswordValid = await user.comparePassword(currentPassword);
            if (!isCurrentPasswordValid) {
                return {
                    success: false,
                    message: 'Mật khẩu hiện tại không đúng',
                    errors: ['Mật khẩu hiện tại sai']
                };
            }

            // Update password
            user.password = newPassword;
            await user.save();

            console.log('✅ Thay đổi mật khẩu thành công:', user.email);

            return {
                success: true,
                message: 'Thay đổi mật khẩu thành công'
            };

        } catch (error) {
            console.error('❌ Lỗi thay đổi mật khẩu:', error);
            return {
                success: false,
                message: 'Có lỗi xảy ra khi thay đổi mật khẩu',
                errors: ['Lỗi server']
            };
        }
    }

    /**
     * Lấy danh sách users (admin)
     * @param {Object} options - { page, limit, search, sortBy, sortOrder }
     * @returns {Promise<Object>}
     */
    async getAllUsers(options = {}) {
        try {
            const {
                page = 1,
                limit = 10,
                search = '',
                sortBy = 'createdAt',
                sortOrder = 'desc'
            } = options;

            // Build query
            const query = { isActive: true };
            if (search) {
                query.$or = [
                    { firstName: { $regex: search, $options: 'i' } },
                    { lastName: { $regex: search, $options: 'i' } },
                    { email: { $regex: search, $options: 'i' } },
                    { username: { $regex: search, $options: 'i' } }
                ];
            }

            // Build sort
            const sort = {};
            sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

            // Execute query
            const skip = (page - 1) * limit;
            const [users, total] = await Promise.all([
                User.find(query)
                    .sort(sort)
                    .skip(skip)
                    .limit(limit)
                    .lean(),
                User.countDocuments(query)
            ]);

            return {
                success: true,
                data: {
                    users: users.map(user => {
                        delete user.password;
                        return user;
                    }),
                    pagination: {
                        total,
                        page,
                        limit,
                        totalPages: Math.ceil(total / limit)
                    }
                }
            };

        } catch (error) {
            console.error('❌ Lỗi lấy danh sách users:', error);
            return {
                success: false,
                message: 'Có lỗi xảy ra khi lấy danh sách',
                errors: ['Lỗi server']
            };
        }
    }
}

module.exports = AuthService;
