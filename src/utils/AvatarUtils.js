/**
 * AvatarUtils - Tiện ích tạo và quản lý avatar mặc định
 */
class AvatarUtils {
    /**
     * Danh sách màu gradient cho avatar mặc định
     */
    static AVATAR_COLORS = [
        { bg: '#FF6B6B', text: '#FFFFFF' }, // Đỏ
        { bg: '#4ECDC4', text: '#FFFFFF' }, // Xanh ngọc
        { bg: '#45B7D1', text: '#FFFFFF' }, // Xanh dương
        { bg: '#96CEB4', text: '#FFFFFF' }, // Xanh lá
        { bg: '#FFEAA7', text: '#2D3436' }, // Vàng
        { bg: '#DDA0DD', text: '#FFFFFF' }, // Tím
        { bg: '#98D8C8', text: '#FFFFFF' }, // Xanh mint
        { bg: '#FFB6C1', text: '#2D3436' }, // Hồng
        { bg: '#F7DC6F', text: '#2D3436' }, // Vàng nhạt
        { bg: '#BB8FCE', text: '#FFFFFF' }  // Tím nhạt
    ];

    /**
     * Tạo initials từ firstName và lastName
     * @param {string} firstName - Tên
     * @param {string} lastName - Họ
     * @returns {string} Initials (VD: "H T" -> "HT")
     */
    static generateInitials(firstName, lastName) {
        const first = firstName ? firstName.charAt(0).toUpperCase() : '';
        const last = lastName ? lastName.charAt(0).toUpperCase() : '';
        return (first + last) || 'U'; // 'U' cho User nếu không có tên
    }

    /**
     * Tạo initials từ username
     * @param {string} username - Tên đăng nhập
     * @returns {string} Initials
     */
    static generateInitialsFromUsername(username) {
        if (!username) return 'U';
        
        // Nếu username có dấu gạch dưới hoặc số, tách ra
        const parts = username.split(/[_\d]+/);
        if (parts.length >= 2) {
            return (parts[0].charAt(0) + parts[1].charAt(0)).toUpperCase();
        }
        
        // Lấy 2 ký tự đầu
        return username.substring(0, 2).toUpperCase();
    }

    /**
     * Chọn màu dựa trên string (để màu luôn nhất quán cho cùng 1 user)
     * @param {string} seed - Chuỗi để tạo màu (thường là email hoặc username)
     * @returns {Object} Màu { bg, text }
     */
    static getColorFromSeed(seed) {
        if (!seed) seed = 'default';
        
        // Tạo hash đơn giản từ string
        let hash = 0;
        for (let i = 0; i < seed.length; i++) {
            const char = seed.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32-bit integer
        }
        
        // Lấy index từ hash
        const index = Math.abs(hash) % this.AVATAR_COLORS.length;
        return this.AVATAR_COLORS[index];
    }

    /**
     * Tạo URL cho SVG avatar
     * @param {string} initials - Initials
     * @param {Object} colors - Màu { bg, text }
     * @param {number} size - Kích thước (default: 120)
     * @returns {string} Data URL của SVG
     */
    static generateSVGAvatar(initials, colors, size = 120) {
        const svg = `
            <svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
                <defs>
                    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" style="stop-color:${colors.bg};stop-opacity:1" />
                        <stop offset="100%" style="stop-color:${this.lightenColor(colors.bg, 20)};stop-opacity:1" />
                    </linearGradient>
                </defs>
                <rect width="100%" height="100%" rx="50%" fill="url(#grad)"/>
                <text x="50%" y="50%" text-anchor="middle" dy="0.35em" 
                      font-family="Arial, sans-serif" font-size="${size * 0.4}" 
                      font-weight="bold" fill="${colors.text}">
                    ${initials}
                </text>
            </svg>
        `;
        
        return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
    }

    /**
     * Làm sáng màu
     * @param {string} color - Màu hex
     * @param {number} percent - Phần trăm làm sáng
     * @returns {string} Màu mới
     */
    static lightenColor(color, percent) {
        const num = parseInt(color.slice(1), 16);
        const amt = Math.round(2.55 * percent);
        const R = (num >> 16) + amt;
        const G = (num >> 8 & 0x00FF) + amt;
        const B = (num & 0x0000FF) + amt;
        
        return `#${(0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
            (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
            (B < 255 ? B < 1 ? 0 : B : 255))
            .toString(16).slice(1)}`;
    }

    /**
     * Tạo avatar mặc định hoàn chỉnh cho user
     * @param {Object} user - Thông tin user { firstName, lastName, username, email }
     * @param {number} size - Kích thước (default: 120)
     * @returns {string} URL của avatar mặc định
     */
    static generateDefaultAvatar(user, size = 120) {
        // Thử tạo initials từ firstName/lastName trước
        let initials = '';
        if (user.firstName || user.lastName) {
            initials = this.generateInitials(user.firstName, user.lastName);
        } else if (user.username) {
            initials = this.generateInitialsFromUsername(user.username);
        } else {
            initials = 'U';
        }

        // Chọn màu dựa trên email hoặc username
        const seed = user.email || user.username || 'default';
        const colors = this.getColorFromSeed(seed);

        return this.generateSVGAvatar(initials, colors, size);
    }

    /**
     * Kiểm tra xem URL có phải là avatar mặc định không
     * @param {string} avatarUrl - URL avatar
     * @returns {boolean}
     */
    static isDefaultAvatar(avatarUrl) {
        return !avatarUrl || 
               avatarUrl.startsWith('data:image/svg+xml') ||
               avatarUrl.includes('placeholder') ||
               avatarUrl.includes('placehold');
    }

    /**
     * Tạo avatar placeholder cho các size khác nhau
     * @param {string} initials - Initials
     * @param {Object} colors - Màu
     * @returns {Object} Object chứa các size khác nhau
     */
    static generateAvatarSizes(initials, colors) {
        return {
            small: this.generateSVGAvatar(initials, colors, 40),
            medium: this.generateSVGAvatar(initials, colors, 80),
            large: this.generateSVGAvatar(initials, colors, 120),
            xlarge: this.generateSVGAvatar(initials, colors, 200)
        };
    }
}

module.exports = AvatarUtils;
