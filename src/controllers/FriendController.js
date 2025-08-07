const Friend = require('../models/Friend');
const User = require('../models/User');

/**
 * Friend Controller - Handle all friend system operations
 */
class FriendController {
    
    /**
     * Send friend request
     * POST /api/friends/request
     */
    async sendFriendRequest(req, res) {
        try {
            const { recipientId } = req.body;
            const requesterId = req.user.id;
            
            // Validate input
            if (!recipientId) {
                return res.status(400).json({
                    success: false,
                    message: 'Recipient ID is required'
                });
            }
            
            // Check if trying to add self
            if (requesterId === recipientId) {
                return res.status(400).json({
                    success: false,
                    message: 'Cannot send friend request to yourself'
                });
            }
            
            // Check if recipient exists
            const recipient = await User.findById(recipientId);
            if (!recipient) {
                return res.status(404).json({
                    success: false,
                    message: 'User not found'
                });
            }
            
            // Check privacy settings
            if (recipient.privacy.allowFriendRequests === 'none') {
                return res.status(403).json({
                    success: false,
                    message: 'User does not accept friend requests'
                });
            }
            
            // Check if friendship already exists
            const existingFriendship = await Friend.findOne({
                $or: [
                    { requester: requesterId, recipient: recipientId },
                    { requester: recipientId, recipient: requesterId }
                ]
            });
            
            if (existingFriendship) {
                let message = 'Friend request already exists';
                if (existingFriendship.status === 'accepted') {
                    message = 'You are already friends';
                } else if (existingFriendship.status === 'blocked') {
                    message = 'Cannot send friend request';
                }
                
                return res.status(409).json({
                    success: false,
                    message
                });
            }
            
            // Create friend request
            const friendship = new Friend({
                requester: requesterId,
                recipient: recipientId,
                status: 'pending'
            });
            
            await friendship.save();
            
            // Populate for response
            await friendship.populate([
                { path: 'requester', select: 'firstName lastName username avatar' },
                { path: 'recipient', select: 'firstName lastName username avatar' }
            ]);
            
            res.status(201).json({
                success: true,
                message: 'Friend request sent successfully',
                data: friendship
            });
            
        } catch (error) {
            console.error('Error sending friend request:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to send friend request',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    }
    
    /**
     * Accept friend request
     * PUT /api/friends/accept/:friendshipId
     */
    async acceptFriendRequest(req, res) {
        try {
            const { friendshipId } = req.params;
            const userId = req.user.id;
            
            const friendship = await Friend.findById(friendshipId)
                .populate('requester', 'firstName lastName username avatar')
                .populate('recipient', 'firstName lastName username avatar');
            
            if (!friendship) {
                return res.status(404).json({
                    success: false,
                    message: 'Friend request not found'
                });
            }
            
            // Check if user is the recipient
            if (!friendship.recipient._id.equals(userId)) {
                return res.status(403).json({
                    success: false,
                    message: 'You can only accept requests sent to you'
                });
            }
            
            // Check if request is pending
            if (friendship.status !== 'pending') {
                return res.status(400).json({
                    success: false,
                    message: `Request is already ${friendship.status}`
                });
            }
            
            // Accept the request
            friendship.status = 'accepted';
            friendship.acceptedAt = new Date();
            await friendship.save();
            
            // Update both users' friend counts
            await Promise.all([
                User.findByIdAndUpdate(friendship.requester._id, { $inc: { friendsCount: 1 } }),
                User.findByIdAndUpdate(friendship.recipient._id, { $inc: { friendsCount: 1 } })
            ]);
            
            res.json({
                success: true,
                message: 'Friend request accepted',
                data: friendship
            });
            
        } catch (error) {
            console.error('Error accepting friend request:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to accept friend request',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    }
    
    /**
     * Reject friend request
     * PUT /api/friends/reject/:friendshipId
     */
    async rejectFriendRequest(req, res) {
        try {
            const { friendshipId } = req.params;
            const userId = req.user.id;
            
            const friendship = await Friend.findById(friendshipId);
            
            if (!friendship) {
                return res.status(404).json({
                    success: false,
                    message: 'Friend request not found'
                });
            }
            
            // Check if user is the recipient
            if (!friendship.recipient.equals(userId)) {
                return res.status(403).json({
                    success: false,
                    message: 'You can only reject requests sent to you'
                });
            }
            
            // Check if request is pending
            if (friendship.status !== 'pending') {
                return res.status(400).json({
                    success: false,
                    message: `Request is already ${friendship.status}`
                });
            }
            
            // Reject the request (soft delete)
            friendship.status = 'rejected';
            await friendship.save();
            
            res.json({
                success: true,
                message: 'Friend request rejected'
            });
            
        } catch (error) {
            console.error('Error rejecting friend request:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to reject friend request',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    }
    
    /**
     * Remove friend (unfriend)
     * DELETE /api/friends/:friendId
     */
    async removeFriend(req, res) {
        try {
            const { friendId } = req.params;
            const userId = req.user.id;
            
            // Find friendship
            const friendship = await Friend.findOne({
                $or: [
                    { requester: userId, recipient: friendId },
                    { requester: friendId, recipient: userId }
                ],
                status: 'accepted'
            });
            
            if (!friendship) {
                return res.status(404).json({
                    success: false,
                    message: 'Friendship not found'
                });
            }
            
            // Remove friendship
            await friendship.deleteOne();
            
            // Update both users' friend counts
            await Promise.all([
                User.findByIdAndUpdate(userId, { $inc: { friendsCount: -1 } }),
                User.findByIdAndUpdate(friendId, { $inc: { friendsCount: -1 } })
            ]);
            
            res.json({
                success: true,
                message: 'Friend removed successfully'
            });
            
        } catch (error) {
            console.error('Error removing friend:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to remove friend',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    }
    
    /**
     * Block user
     * PUT /api/friends/block/:userId
     */
    async blockUser(req, res) {
        try {
            const { userId: targetUserId } = req.params;
            const userId = req.user.id;
            
            if (userId === targetUserId) {
                return res.status(400).json({
                    success: false,
                    message: 'Cannot block yourself'
                });
            }
            
            // Find existing relationship
            let friendship = await Friend.findOne({
                $or: [
                    { requester: userId, recipient: targetUserId },
                    { requester: targetUserId, recipient: userId }
                ]
            });
            
            if (friendship) {
                // Update existing relationship
                friendship.status = 'blocked';
                friendship.blockedBy = userId;
                friendship.blockedAt = new Date();
                await friendship.save();
            } else {
                // Create new blocked relationship
                friendship = new Friend({
                    requester: userId,
                    recipient: targetUserId,
                    status: 'blocked',
                    blockedBy: userId,
                    blockedAt: new Date()
                });
                await friendship.save();
            }
            
            res.json({
                success: true,
                message: 'User blocked successfully'
            });
            
        } catch (error) {
            console.error('Error blocking user:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to block user',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    }
    
    /**
     * Unblock user
     * PUT /api/friends/unblock/:userId
     */
    async unblockUser(req, res) {
        try {
            const { userId: targetUserId } = req.params;
            const userId = req.user.id;
            
            const friendship = await Friend.findOne({
                $or: [
                    { requester: userId, recipient: targetUserId },
                    { requester: targetUserId, recipient: userId }
                ],
                status: 'blocked',
                blockedBy: userId
            });
            
            if (!friendship) {
                return res.status(404).json({
                    success: false,
                    message: 'Blocked relationship not found'
                });
            }
            
            // Remove the block
            await friendship.deleteOne();
            
            res.json({
                success: true,
                message: 'User unblocked successfully'
            });
            
        } catch (error) {
            console.error('Error unblocking user:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to unblock user',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    }
    
    /**
     * Get friends list
     * GET /api/friends
     */
    async getFriendsList(req, res) {
        try {
            const userId = req.user.id;
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 20;
            
            const friends = await Friend.getFriendsList(userId, { page, limit });
            
            res.json({
                success: true,
                data: friends,
                pagination: {
                    page,
                    limit,
                    hasMore: friends.length === limit
                }
            });
            
        } catch (error) {
            console.error('Error getting friends list:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to get friends list',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    }
    
    /**
     * Get pending friend requests (received)
     * GET /api/friends/requests/received
     */
    async getReceivedRequests(req, res) {
        try {
            const userId = req.user.id;
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;
            
            const requests = await Friend.getPendingRequests(userId, { page, limit });
            
            res.json({
                success: true,
                data: requests,
                pagination: {
                    page,
                    limit,
                    hasMore: requests.length === limit
                }
            });
            
        } catch (error) {
            console.error('Error getting received requests:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to get received requests',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    }
    
    /**
     * Get sent friend requests
     * GET /api/friends/requests/sent
     */
    async getSentRequests(req, res) {
        try {
            const userId = req.user.id;
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;
            
            const requests = await Friend.getSentRequests(userId, { page, limit });
            
            res.json({
                success: true,
                data: requests,
                pagination: {
                    page,
                    limit,
                    hasMore: requests.length === limit
                }
            });
            
        } catch (error) {
            console.error('Error getting sent requests:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to get sent requests',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    }
    
    /**
     * Get friend suggestions
     * GET /api/friends/suggestions
     */
    async getFriendSuggestions(req, res) {
        try {
            const userId = req.user.id;
            const limit = parseInt(req.query.limit) || 10;
            
            const suggestions = await Friend.getFriendSuggestions(userId, { limit });
            
            res.json({
                success: true,
                data: suggestions
            });
            
        } catch (error) {
            console.error('Error getting friend suggestions:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to get friend suggestions',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    }
    
    /**
     * Get friendship status with another user
     * GET /api/friends/status/:userId
     */
    async getFriendshipStatus(req, res) {
        try {
            const { userId: targetUserId } = req.params;
            const userId = req.user.id;
            
            if (userId === targetUserId) {
                return res.json({
                    success: true,
                    data: { status: 'self' }
                });
            }
            
            const status = await Friend.getFriendshipStatus(userId, targetUserId);
            
            res.json({
                success: true,
                data: { status }
            });
            
        } catch (error) {
            console.error('Error getting friendship status:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to get friendship status',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    }
}

module.exports = new FriendController();
