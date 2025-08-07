/**
 * Base Model Class
 * Lớp cơ sở cho tất cả các model
 */
class BaseModel {
    constructor() {
        this.createdAt = new Date();
        this.updatedAt = new Date();
    }

    /**
     * Cập nhật timestamp
     */
    updateTimestamp() {
        this.updatedAt = new Date();
    }

    /**
     * Validate dữ liệu
     * @returns {Object} - {isValid: boolean, errors: Array}
     */
    validate() {
        throw new Error('Validate method must be implemented');
    }

    /**
     * Chuyển đối tượng thành JSON
     * @returns {Object}
     */
    toJSON() {
        return {
            ...this,
            createdAt: this.createdAt.toISOString(),
            updatedAt: this.updatedAt.toISOString()
        };
    }
}

module.exports = BaseModel;
