/**
 * Validation Utilities
 * Các hàm tiện ích để validate dữ liệu
 */
class ValidationUtils {
    /**
     * Validate email format
     * @param {string} email 
     * @returns {boolean}
     */
    static isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    /**
     * Validate password strength
     * @param {string} password 
     * @returns {Object}
     */
    static validatePassword(password) {
        const result = {
            isValid: true,
            score: 0,
            feedback: []
        };

        if (!password || password.length < 6) {
            result.isValid = false;
            result.feedback.push('Mật khẩu phải có ít nhất 6 ký tự');
            return result;
        }

        // Check length
        if (password.length >= 8) result.score += 1;
        else result.feedback.push('Nên có ít nhất 8 ký tự');

        // Check lowercase
        if (/[a-z]/.test(password)) result.score += 1;
        else result.feedback.push('Nên có ít nhất 1 chữ thường');

        // Check uppercase
        if (/[A-Z]/.test(password)) result.score += 1;
        else result.feedback.push('Nên có ít nhất 1 chữ hoa');

        // Check numbers
        if (/[0-9]/.test(password)) result.score += 1;
        else result.feedback.push('Nên có ít nhất 1 số');

        // Check special characters
        if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) result.score += 1;
        else result.feedback.push('Nên có ít nhất 1 ký tự đặc biệt');

        return result;
    }

    /**
     * Validate username
     * @param {string} username 
     * @returns {Object}
     */
    static validateUsername(username) {
        const result = {
            isValid: true,
            errors: []
        };

        if (!username || username.length < 3) {
            result.isValid = false;
            result.errors.push('Tên người dùng phải có ít nhất 3 ký tự');
        }

        if (username && username.length > 20) {
            result.isValid = false;
            result.errors.push('Tên người dùng không được quá 20 ký tự');
        }

        if (username && !/^[a-zA-Z0-9_]+$/.test(username)) {
            result.isValid = false;
            result.errors.push('Tên người dùng chỉ được chứa chữ cái, số và dấu gạch dưới');
        }

        return result;
    }

    /**
     * Validate phone number
     * @param {string} phone 
     * @returns {boolean}
     */
    static isValidPhone(phone) {
        const phoneRegex = /^(\+84|84|0)[3|5|7|8|9][0-9]{8}$/;
        return phoneRegex.test(phone);
    }

    /**
     * Validate date of birth
     * @param {Date} dateOfBirth 
     * @returns {Object}
     */
    static validateDateOfBirth(dateOfBirth) {
        const result = {
            isValid: true,
            errors: []
        };

        if (!dateOfBirth) {
            result.isValid = false;
            result.errors.push('Ngày sinh không được để trống');
            return result;
        }

        const today = new Date();
        const birthDate = new Date(dateOfBirth);

        if (birthDate >= today) {
            result.isValid = false;
            result.errors.push('Ngày sinh phải nhỏ hơn ngày hiện tại');
        }

        const age = today.getFullYear() - birthDate.getFullYear();
        if (age < 13) {
            result.isValid = false;
            result.errors.push('Người dùng phải từ 13 tuổi trở lên');
        }

        if (age > 120) {
            result.isValid = false;
            result.errors.push('Ngày sinh không hợp lệ');
        }

        return result;
    }

    /**
     * Sanitize string input
     * @param {string} input 
     * @returns {string}
     */
    static sanitizeString(input) {
        if (typeof input !== 'string') return '';
        return input.trim().replace(/[<>]/g, '');
    }

    /**
     * Validate file upload
     * @param {Object} file 
     * @param {Array} allowedTypes 
     * @param {number} maxSize 
     * @returns {Object}
     */
    static validateFileUpload(file, allowedTypes = [], maxSize = 5 * 1024 * 1024) {
        const result = {
            isValid: true,
            errors: []
        };

        if (!file) {
            result.isValid = false;
            result.errors.push('Không có file được upload');
            return result;
        }

        if (file.size > maxSize) {
            result.isValid = false;
            result.errors.push(`File không được vượt quá ${maxSize / 1024 / 1024}MB`);
        }

        if (allowedTypes.length > 0 && !allowedTypes.includes(file.mimetype)) {
            result.isValid = false;
            result.errors.push('Định dạng file không được hỗ trợ');
        }

        return result;
    }
}

module.exports = ValidationUtils;
