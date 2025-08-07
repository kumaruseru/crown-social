/**
 * Maps Routes - Crown Maps API endpoints
 * Xử lý các API cho bản đồ và vị trí người dùng
 */

const express = require('express');
const router = express.Router();
const MapsController = require('../controllers/MapsController');
const AuthMiddleware = require('../middleware/AuthMiddleware');

/**
 * @route GET /api/maps/friends
 * @desc Lấy danh sách bạn bè có chia sẻ vị trí
 * @access Private
 */
router.get('/friends', AuthMiddleware.authenticateToken, MapsController.getFriendsLocation);

/**
 * @route GET /api/maps/location
 * @desc Lấy vị trí hiện tại của user
 * @access Private
 */
router.get('/location', AuthMiddleware.authenticateToken, MapsController.getUserLocation);

/**
 * @route POST /api/maps/update-location
 * @desc Cập nhật vị trí của user
 * @access Private
 */
router.post('/update-location', AuthMiddleware.authenticateToken, MapsController.updateUserLocation);

/**
 * @route POST /api/maps/save-location
 * @desc Lưu vị trí quan trọng của user
 * @access Private
 */
router.post('/save-location', AuthMiddleware.authenticateToken, MapsController.saveUserLocation);

/**
 * @route GET /api/maps/nearby
 * @desc Tìm địa điểm gần đó
 * @access Private
 */
router.get('/nearby', AuthMiddleware.authenticateToken, MapsController.getNearbyPlaces);

/**
 * @route POST /api/maps/share-location
 * @desc Chia sẻ vị trí với bạn bè
 * @access Private
 */
router.post('/share-location', AuthMiddleware.authenticateToken, MapsController.shareLocation);

/**
 * @route DELETE /api/maps/location
 * @desc Xóa/ẩn vị trí khỏi bản đồ
 * @access Private
 */
router.delete('/location', AuthMiddleware.authenticateToken, MapsController.hideLocation);

module.exports = router;
