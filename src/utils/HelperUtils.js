const crypto = require('crypto');

/**
 * Helper Utilities
 * Các hàm tiện ích chung
 */
class HelperUtils {
    /**
     * Tạo ID ngẫu nhiên
     * @param {number} length 
     * @returns {string}
     */
    static generateRandomId(length = 10) {
        return crypto.randomBytes(length).toString('hex');
    }

    /**
     * Tạo UUID
     * @returns {string}
     */
    static generateUUID() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            const r = Math.random() * 16 | 0;
            const v = c == 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }

    /**
     * Format date thành string
     * @param {Date} date 
     * @param {string} format 
     * @returns {string}
     */
    static formatDate(date, format = 'dd/MM/yyyy') {
        if (!(date instanceof Date)) return '';

        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        const seconds = String(date.getSeconds()).padStart(2, '0');

        return format
            .replace('dd', day)
            .replace('MM', month)
            .replace('yyyy', year)
            .replace('HH', hours)
            .replace('mm', minutes)
            .replace('ss', seconds);
    }

    /**
     * Sleep function
     * @param {number} ms 
     * @returns {Promise}
     */
    static sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Capitalize first letter
     * @param {string} str 
     * @returns {string}
     */
    static capitalize(str) {
        if (typeof str !== 'string' || str.length === 0) return '';
        return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
    }

    /**
     * Capitalize words
     * @param {string} str 
     * @returns {string}
     */
    static capitalizeWords(str) {
        if (typeof str !== 'string') return '';
        return str.split(' ')
            .map(word => this.capitalize(word))
            .join(' ');
    }

    /**
     * Generate slug from string
     * @param {string} str 
     * @returns {string}
     */
    static generateSlug(str) {
        if (typeof str !== 'string') return '';
        
        return str
            .toLowerCase()
            .replace(/á|à|ả|ạ|ã|ă|ắ|ằ|ẳ|ặ|ẵ|â|ấ|ầ|ẩ|ậ|ẫ/g, 'a')
            .replace(/é|è|ẻ|ẹ|ẽ|ê|ế|ề|ể|ệ|ễ/g, 'e')
            .replace(/í|ì|ỉ|ị|ĩ/g, 'i')
            .replace(/ó|ò|ỏ|ọ|õ|ô|ố|ồ|ổ|ộ|ỗ|ơ|ớ|ờ|ở|ợ|ỡ/g, 'o')
            .replace(/ú|ù|ủ|ụ|ũ|ư|ứ|ừ|ử|ự|ữ/g, 'u')
            .replace(/ý|ỳ|ỷ|ỵ|ỹ/g, 'y')
            .replace(/đ/g, 'd')
            .replace(/[^a-z0-9 -]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-')
            .replace(/^-|-$/g, '');
    }

    /**
     * Mask email
     * @param {string} email 
     * @returns {string}
     */
    static maskEmail(email) {
        if (typeof email !== 'string' || !email.includes('@')) return email;
        
        const [username, domain] = email.split('@');
        if (username.length <= 2) return email;
        
        const maskedUsername = username[0] + '*'.repeat(username.length - 2) + username[username.length - 1];
        return `${maskedUsername}@${domain}`;
    }

    /**
     * Mask phone number
     * @param {string} phone 
     * @returns {string}
     */
    static maskPhone(phone) {
        if (typeof phone !== 'string' || phone.length < 4) return phone;
        
        const visibleStart = 3;
        const visibleEnd = 2;
        const masked = '*'.repeat(phone.length - visibleStart - visibleEnd);
        
        return phone.substring(0, visibleStart) + masked + phone.substring(phone.length - visibleEnd);
    }

    /**
     * Get file extension
     * @param {string} filename 
     * @returns {string}
     */
    static getFileExtension(filename) {
        if (typeof filename !== 'string') return '';
        return filename.split('.').pop().toLowerCase();
    }

    /**
     * Format file size
     * @param {number} bytes 
     * @returns {string}
     */
    static formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    /**
     * Check if object is empty
     * @param {Object} obj 
     * @returns {boolean}
     */
    static isEmpty(obj) {
        if (obj === null || obj === undefined) return true;
        if (typeof obj === 'string') return obj.trim().length === 0;
        if (Array.isArray(obj)) return obj.length === 0;
        if (typeof obj === 'object') return Object.keys(obj).length === 0;
        return false;
    }

    /**
     * Deep clone object
     * @param {Object} obj 
     * @returns {Object}
     */
    static deepClone(obj) {
        if (obj === null || typeof obj !== 'object') return obj;
        if (obj instanceof Date) return new Date(obj.getTime());
        if (Array.isArray(obj)) return obj.map(item => this.deepClone(item));
        
        const cloned = {};
        for (const key in obj) {
            if (obj.hasOwnProperty(key)) {
                cloned[key] = this.deepClone(obj[key]);
            }
        }
        return cloned;
    }
}

module.exports = HelperUtils;
