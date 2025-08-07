/**
 * Maps Controller - Xử lý các API cho Maps và Location
 */

const User = require('../models/User');
const Location = require('../models/Location');
const Friend = require('../models/Friend');

class MapsController {
    /**
     * Lấy danh sách bạn bè có chia sẻ vị trí
     */
    static async getFriendsLocation(req, res) {
        try {
            const userId = req.user.id;
            
            // Tìm các bạn bè của user
            const friendships = await Friend.find({
                $or: [
                    { user1: userId, status: 'accepted' },
                    { user2: userId, status: 'accepted' }
                ]
            }).populate('user1 user2', 'firstName lastName username avatar isOnline lastSeen');
            
            const friendsWithLocation = [];
            
            for (const friendship of friendships) {
                const friend = friendship.user1._id.toString() === userId ? friendship.user2 : friendship.user1;
                
                // Lấy vị trí gần nhất của friend (nếu có chia sẻ)
                const location = await Location.findOne({
                    user: friend._id,
                    isShared: true,
                    isActive: true
                }).sort({ updatedAt: -1 });
                
                if (location) {
                    friendsWithLocation.push({
                        _id: friend._id,
                        firstName: friend.firstName,
                        lastName: friend.lastName,
                        username: friend.username,
                        avatar: friend.avatar,
                        isOnline: friend.isOnline,
                        lastSeen: friend.lastSeen,
                        location: {
                            lat: location.coordinates[1],
                            lon: location.coordinates[0],
                            address: location.address,
                            updatedAt: location.updatedAt
                        }
                    });
                }
            }
            
            res.status(200).json({
                success: true,
                data: friendsWithLocation,
                message: `Tìm thấy ${friendsWithLocation.length} bạn bè có chia sẻ vị trí`
            });
            
        } catch (error) {
            console.error('❌ Error getting friends location:', error);
            res.status(500).json({
                success: false,
                message: 'Lỗi khi lấy vị trí bạn bè',
                error: error.message
            });
        }
    }

    /**
     * Lấy vị trí hiện tại của user
     */
    static async getUserLocation(req, res) {
        try {
            const userId = req.user.id;
            
            const location = await Location.findOne({
                user: userId,
                isActive: true
            }).sort({ updatedAt: -1 });
            
            if (location) {
                res.status(200).json({
                    success: true,
                    data: {
                        lat: location.coordinates[1],
                        lon: location.coordinates[0],
                        address: location.address,
                        type: location.type,
                        isShared: location.isShared,
                        updatedAt: location.updatedAt
                    },
                    message: 'Lấy vị trí thành công'
                });
            } else {
                res.status(404).json({
                    success: false,
                    message: 'Chưa có vị trí nào được lưu'
                });
            }
            
        } catch (error) {
            console.error('❌ Error getting user location:', error);
            res.status(500).json({
                success: false,
                message: 'Lỗi khi lấy vị trí người dùng',
                error: error.message
            });
        }
    }

    /**
     * Cập nhật vị trí của user
     */
    static async updateUserLocation(req, res) {
        try {
            const userId = req.user.id;
            const { lat, lon, address, isShared = true } = req.body;
            
            if (!lat || !lon) {
                return res.status(400).json({
                    success: false,
                    message: 'Thiếu thông tin vị trí (lat, lon)'
                });
            }
            
            // Tạo hoặc cập nhật location
            const location = await Location.findOneAndUpdate(
                { user: userId, type: 'current' },
                {
                    user: userId,
                    coordinates: [lon, lat], // GeoJSON format: [longitude, latitude]
                    address: address || `${lat.toFixed(6)}, ${lon.toFixed(6)}`,
                    type: 'current',
                    isShared: isShared,
                    isActive: true,
                    updatedAt: new Date()
                },
                { upsert: true, new: true }
            );
            
            res.status(200).json({
                success: true,
                data: {
                    lat: location.coordinates[1],
                    lon: location.coordinates[0],
                    address: location.address,
                    isShared: location.isShared,
                    updatedAt: location.updatedAt
                },
                message: 'Cập nhật vị trí thành công'
            });
            
        } catch (error) {
            console.error('❌ Error updating user location:', error);
            res.status(500).json({
                success: false,
                message: 'Lỗi khi cập nhật vị trí',
                error: error.message
            });
        }
    }

    /**
     * Lưu vị trí quan trọng của user
     */
    static async saveUserLocation(req, res) {
        try {
            const userId = req.user.id;
            const { lat, lon, name, type = 'saved', isShared = false } = req.body;
            
            if (!lat || !lon || !name) {
                return res.status(400).json({
                    success: false,
                    message: 'Thiếu thông tin vị trí (lat, lon, name)'
                });
            }
            
            const location = new Location({
                user: userId,
                coordinates: [lon, lat],
                address: name,
                type: type,
                isShared: isShared,
                isActive: true
            });
            
            await location.save();
            
            res.status(201).json({
                success: true,
                data: {
                    _id: location._id,
                    lat: location.coordinates[1],
                    lon: location.coordinates[0],
                    address: location.address,
                    type: location.type,
                    isShared: location.isShared,
                    createdAt: location.createdAt
                },
                message: 'Lưu vị trí thành công'
            });
            
        } catch (error) {
            console.error('❌ Error saving user location:', error);
            res.status(500).json({
                success: false,
                message: 'Lỗi khi lưu vị trí',
                error: error.message
            });
        }
    }

    /**
     * Tìm địa điểm gần đó
     */
    static async getNearbyPlaces(req, res) {
        try {
            const userId = req.user.id;
            const { lat, lon, radius = 5000 } = req.query; // radius in meters
            
            if (!lat || !lon) {
                return res.status(400).json({
                    success: false,
                    message: 'Thiếu thông tin vị trí (lat, lon)'
                });
            }
            
            // Tìm các địa điểm gần đó trong bán kính
            const nearbyLocations = await Location.aggregate([
                {
                    $geoNear: {
                        near: {
                            type: "Point",
                            coordinates: [parseFloat(lon), parseFloat(lat)]
                        },
                        distanceField: "distance",
                        maxDistance: parseInt(radius),
                        spherical: true
                    }
                },
                {
                    $match: {
                        user: { $ne: require('mongoose').Types.ObjectId(userId) },
                        isShared: true,
                        isActive: true
                    }
                },
                {
                    $lookup: {
                        from: 'users',
                        localField: 'user',
                        foreignField: '_id',
                        as: 'userInfo'
                    }
                },
                {
                    $unwind: '$userInfo'
                },
                {
                    $project: {
                        distance: 1,
                        address: 1,
                        type: 1,
                        coordinates: 1,
                        updatedAt: 1,
                        user: {
                            _id: '$userInfo._id',
                            firstName: '$userInfo.firstName',
                            lastName: '$userInfo.lastName',
                            avatar: '$userInfo.avatar'
                        }
                    }
                },
                { $limit: 20 }
            ]);
            
            res.status(200).json({
                success: true,
                data: nearbyLocations.map(location => ({
                    ...location,
                    lat: location.coordinates[1],
                    lon: location.coordinates[0]
                })),
                message: `Tìm thấy ${nearbyLocations.length} địa điểm gần đó`
            });
            
        } catch (error) {
            console.error('❌ Error getting nearby places:', error);
            res.status(500).json({
                success: false,
                message: 'Lỗi khi tìm địa điểm gần đó',
                error: error.message
            });
        }
    }

    /**
     * Chia sẻ vị trí với bạn bè
     */
    static async shareLocation(req, res) {
        try {
            const userId = req.user.id;
            const { isShared = true } = req.body;
            
            // Cập nhật tất cả location của user
            await Location.updateMany(
                { user: userId, isActive: true },
                { isShared: isShared }
            );
            
            res.status(200).json({
                success: true,
                message: isShared ? 'Đã bật chia sẻ vị trí' : 'Đã tắt chia sẻ vị trí'
            });
            
        } catch (error) {
            console.error('❌ Error sharing location:', error);
            res.status(500).json({
                success: false,
                message: 'Lỗi khi cập nhật chia sẻ vị trí',
                error: error.message
            });
        }
    }

    /**
     * Ẩn vị trí khỏi bản đồ
     */
    static async hideLocation(req, res) {
        try {
            const userId = req.user.id;
            
            // Deactivate tất cả location của user
            await Location.updateMany(
                { user: userId },
                { isActive: false, isShared: false }
            );
            
            res.status(200).json({
                success: true,
                message: 'Đã ẩn vị trí khỏi bản đồ'
            });
            
        } catch (error) {
            console.error('❌ Error hiding location:', error);
            res.status(500).json({
                success: false,
                message: 'Lỗi khi ẩn vị trí',
                error: error.message
            });
        }
    }
}

module.exports = MapsController;
