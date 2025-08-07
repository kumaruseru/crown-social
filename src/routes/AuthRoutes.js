const express = require('express');
const AuthController = require('../controllers/AuthController');

/**
 * Auth Routes - Định nghĩa các route liên quan đến authentication
 */
class AuthRoutes {
    constructor() {
        this.router = express.Router();
        this.authController = new AuthController();
        this.initializeRoutes();
    }

    /**
     * Khởi tạo các routes
     */
    initializeRoutes() {
        // Routes cho trang web
        this.router.get('/home', this.authController.showHomePage);
        this.router.get('/maps', this.authController.showMapsPage);
        this.router.get('/messages', this.authController.showMessagesPage);
        this.router.get('/login', this.authController.showLoginPage);
        this.router.get('/register', this.authController.showRegisterPage);
        this.router.get('/forgot-password', this.authController.showForgotPasswordPage);
        this.router.get('/reset-password', this.authController.showResetPasswordPage);

        // Call routes
        this.router.get('/active-call', this.authController.showActiveCallPage);
        this.router.get('/incoming-call', this.authController.showIncomingCallPage);
        this.router.get('/outgoing-call', this.authController.showOutgoingCallPage);

        // API routes
        this.router.post('/api/login', this.authController.login);
        this.router.post('/api/register', this.authController.register);
        this.router.post('/api/logout', this.authController.logout);
        this.router.get('/api/user', this.authController.getCurrentUser);

        // Password reset routes
        this.router.post('/api/forgot-password', this.authController.forgotPassword);
        this.router.post('/api/reset-password', this.authController.resetPassword);
        this.router.post('/api/change-password', this.authController.changePassword);

        // OAuth routes
        this.router.get('/api/auth/google', this.authController.googleAuth);
        this.router.get('/api/auth/google/callback', this.authController.googleCallback);
        this.router.get('/api/auth/facebook', this.authController.facebookAuth);
        this.router.get('/api/auth/facebook/callback', this.authController.facebookCallback);

        console.log('✅ Auth routes đã được khởi tạo');
    }

    /**
     * Lấy router
     * @returns {express.Router}
     */
    getRouter() {
        return this.router;
    }
}

module.exports = AuthRoutes;
