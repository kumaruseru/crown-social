const express = require('express');
const router = express.Router();
const FriendController = require('../controllers/FriendController');
const AuthMiddleware = require('../middleware/AuthMiddleware');

/**
 * Friend Routes - All friend system endpoints
 */

// Apply authentication middleware to all routes
router.use(AuthMiddleware.requireAuth);

/**
 * @route   POST /api/friends/request
 * @desc    Send friend request
 * @access  Private
 */
router.post('/request', FriendController.sendFriendRequest);

/**
 * @route   PUT /api/friends/accept/:friendshipId
 * @desc    Accept friend request
 * @access  Private
 */
router.put('/accept/:friendshipId', FriendController.acceptFriendRequest);

/**
 * @route   PUT /api/friends/reject/:friendshipId
 * @desc    Reject friend request
 * @access  Private
 */
router.put('/reject/:friendshipId', FriendController.rejectFriendRequest);

/**
 * @route   DELETE /api/friends/:friendId
 * @desc    Remove friend (unfriend)
 * @access  Private
 */
router.delete('/:friendId', FriendController.removeFriend);

/**
 * @route   PUT /api/friends/block/:userId
 * @desc    Block user
 * @access  Private
 */
router.put('/block/:userId', FriendController.blockUser);

/**
 * @route   PUT /api/friends/unblock/:userId
 * @desc    Unblock user
 * @access  Private
 */
router.put('/unblock/:userId', FriendController.unblockUser);

/**
 * @route   GET /api/friends
 * @desc    Get friends list
 * @access  Private
 */
router.get('/', FriendController.getFriendsList);

/**
 * @route   GET /api/friends/requests/received
 * @desc    Get pending friend requests (received)
 * @access  Private
 */
router.get('/requests/received', FriendController.getReceivedRequests);

/**
 * @route   GET /api/friends/requests/sent
 * @desc    Get sent friend requests
 * @access  Private
 */
router.get('/requests/sent', FriendController.getSentRequests);

/**
 * @route   GET /api/friends/suggestions
 * @desc    Get friend suggestions
 * @access  Private
 */
router.get('/suggestions', FriendController.getFriendSuggestions);

/**
 * @route   GET /api/friends/status/:userId
 * @desc    Get friendship status with another user
 * @access  Private
 */
router.get('/status/:userId', FriendController.getFriendshipStatus);

module.exports = router;
