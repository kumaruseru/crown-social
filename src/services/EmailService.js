const nodemailer = require('nodemailer');

class EmailService {
    constructor() {
        this.transporter = this.createTransporter();
    }

    createTransporter() {
        // Cấu hình cho development - sử dụng Ethereal Email
        return nodemailer.createTransport({
            host: 'smtp.ethereal.email',
            port: 587,
            auth: {
                user: 'ethereal.user@ethereal.email',
                pass: 'ethereal.pass'
            }
        });
    }

    async sendEmail(to, subject, html, text = null) {
        try {
            const mailOptions = {
                from: '"Crown App" <noreply@crown.app>',
                to: to,
                subject: subject,
                html: html,
                text: text || html.replace(/<[^>]*>/g, '')
            };

            const info = await this.transporter.sendMail(mailOptions);
            console.log('📧 Email sent:', info.messageId);
            return { success: true, messageId: info.messageId };
        } catch (error) {
            console.error('❌ Email sending failed:', error);
            return { success: false, error: error.message };
        }
    }

    async sendVerificationEmail(email, token) {
        const verificationUrl = `${process.env.BASE_URL || 'http://localhost:3000'}/verify-email?token=${token}`;
        
        const html = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #333;">Xác thực tài khoản Crown</h2>
                <p>Chào bạn,</p>
                <p>Cảm ơn bạn đã đăng ký tài khoản Crown. Vui lòng nhấn vào nút bên dưới để xác thực email của bạn:</p>
                <div style="text-align: center; margin: 30px 0;">
                    <a href="${verificationUrl}" 
                       style="background-color: #007bff; color: white; padding: 12px 24px; 
                              text-decoration: none; border-radius: 5px; display: inline-block;">
                        Xác thực Email
                    </a>
                </div>
                <p>Hoặc copy link sau vào trình duyệt:</p>
                <p style="word-break: break-all; color: #666;">${verificationUrl}</p>
                <p>Link này sẽ hết hạn sau 24 giờ.</p>
                <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
                <p style="color: #666; font-size: 12px;">
                    Nếu bạn không đăng ký tài khoản này, vui lòng bỏ qua email này.
                </p>
            </div>
        `;

        return await this.sendEmail(email, 'Xác thực tài khoản Crown', html);
    }

    async sendPasswordResetEmail(email, token) {
        const resetUrl = `${process.env.BASE_URL || 'http://localhost:3000'}/reset-password?token=${token}`;
        
        const html = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #333;">Đặt lại mật khẩu Crown</h2>
                <p>Chào bạn,</p>
                <p>Bạn đã yêu cầu đặt lại mật khẩu cho tài khoản Crown. Nhấn vào nút bên dưới để tạo mật khẩu mới:</p>
                <div style="text-align: center; margin: 30px 0;">
                    <a href="${resetUrl}" 
                       style="background-color: #dc3545; color: white; padding: 12px 24px; 
                              text-decoration: none; border-radius: 5px; display: inline-block;">
                        Đặt lại mật khẩu
                    </a>
                </div>
                <p>Hoặc copy link sau vào trình duyệt:</p>
                <p style="word-break: break-all; color: #666;">${resetUrl}</p>
                <p>Link này sẽ hết hạn sau 1 giờ.</p>
                <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
                <p style="color: #666; font-size: 12px;">
                    Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này.
                </p>
            </div>
        `;

        return await this.sendEmail(email, 'Đặt lại mật khẩu Crown', html);
    }

    async sendWelcomeEmail(email, username) {
        const html = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #333;">Chào mừng đến với Crown! 👑</h2>
                <p>Chào ${username},</p>
                <p>Chào mừng bạn đã gia nhập cộng đồng Crown! Tài khoản của bạn đã được tạo thành công.</p>
                <p>Bạn có thể bắt đầu khám phá các tính năng:</p>
                <ul>
                    <li>🗺️ Maps - Khám phá thế giới</li>
                    <li>📰 News - Cập nhật tin tức</li>
                    <li>💬 Messages - Trò chuyện với bạn bè</li>
                    <li>🔔 Notifications - Nhận thông báo</li>
                    <li>🔍 Explore - Khám phá nội dung</li>
                </ul>
                <div style="text-align: center; margin: 30px 0;">
                    <a href="${process.env.BASE_URL || 'http://localhost:3000'}" 
                       style="background-color: #28a745; color: white; padding: 12px 24px; 
                              text-decoration: none; border-radius: 5px; display: inline-block;">
                        Bắt đầu sử dụng Crown
                    </a>
                </div>
                <p>Chúc bạn có những trải nghiệm tuyệt vời!</p>
                <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
                <p style="color: #666; font-size: 12px;">
                    Đây là email tự động, vui lòng không reply.
                </p>
            </div>
        `;

        return await this.sendEmail(email, 'Chào mừng đến với Crown! 👑', html);
    }
}

module.exports = EmailService;
