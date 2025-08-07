/**
 * Client-side Avatar Utilities - Tiện ích tạo avatar mặc định phía client
 */
class ClientAvatarUtils {
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
     */
    static generateInitials(firstName, lastName) {
        const first = firstName ? firstName.charAt(0).toUpperCase() : '';
        const last = lastName ? lastName.charAt(0).toUpperCase() : '';
        return (first + last) || 'U';
    }

    /**
     * Chọn màu dựa trên string
     */
    static getColorFromSeed(seed) {
        if (!seed) seed = 'default';
        
        let hash = 0;
        for (let i = 0; i < seed.length; i++) {
            const char = seed.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        
        const index = Math.abs(hash) % this.AVATAR_COLORS.length;
        return this.AVATAR_COLORS[index];
    }

    /**
     * Làm sáng màu
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
     * Tạo SVG avatar
     */
    static generateSVGAvatar(initials, colors, size = 120) {
        const svg = `
            <svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
                <defs>
                    <linearGradient id="grad-${initials}-${size}" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" style="stop-color:${colors.bg};stop-opacity:1" />
                        <stop offset="100%" style="stop-color:${this.lightenColor(colors.bg, 20)};stop-opacity:1" />
                    </linearGradient>
                </defs>
                <rect width="100%" height="100%" rx="50%" fill="url(#grad-${initials}-${size})"/>
                <text x="50%" y="50%" text-anchor="middle" dy="0.35em" 
                      font-family="Arial, sans-serif" font-size="${size * 0.4}" 
                      font-weight="bold" fill="${colors.text}">
                    ${initials}
                </text>
            </svg>
        `;
        
        return `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svg)))}`;
    }

    /**
     * Tạo avatar mặc định cho user
     */
    static generateDefaultAvatar(user, size = 40) {
        let initials = '';
        if (user.firstName || user.lastName) {
            initials = this.generateInitials(user.firstName, user.lastName);
        } else if (user.username) {
            initials = user.username.substring(0, 2).toUpperCase();
        } else {
            initials = 'U';
        }

        const seed = user.email || user.username || 'default';
        const colors = this.getColorFromSeed(seed);

        return this.generateSVGAvatar(initials, colors, size);
    }

    /**
     * Kiểm tra xem URL có phải là avatar mặc định không
     */
    static isDefaultAvatar(avatarUrl) {
        return !avatarUrl || 
               avatarUrl.includes('placeholder') ||
               avatarUrl.includes('placehold') ||
               avatarUrl.includes('via.placeholder');
    }

    /**
     * Lấy avatar URL với fallback
     */
    static getAvatarUrl(user, size = 40) {
        if (user.avatar && !this.isDefaultAvatar(user.avatar)) {
            return user.avatar;
        }
        return this.generateDefaultAvatar(user, size);
    }

    /**
     * Cập nhật tất cả avatar trong trang
     */
    static updateAllAvatars() {
        document.querySelectorAll('[data-user-avatar]').forEach(img => {
            const userData = JSON.parse(img.dataset.userAvatar);
            const size = parseInt(img.dataset.avatarSize) || 40;
            img.src = this.getAvatarUrl(userData, size);
        });
    }
}

// Export cho global scope
window.ClientAvatarUtils = ClientAvatarUtils;
