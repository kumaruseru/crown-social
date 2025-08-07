/**
 * Location Model - Schema cho việc lưu trữ vị trí người dùng
 */

const mongoose = require('mongoose');

const locationSchema = new mongoose.Schema({
    // User sở hữu location này
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },

    // Tọa độ địa lý (GeoJSON Point)
    coordinates: {
        type: [Number], // [longitude, latitude]
        required: true,
        index: '2dsphere' // Cho phép geo queries
    },

    // Địa chỉ hoặc tên địa điểm
    address: {
        type: String,
        required: true,
        trim: true,
        maxLength: 500
    },

    // Loại vị trí
    type: {
        type: String,
        enum: ['current', 'home', 'work', 'saved', 'search', 'manual'],
        default: 'current',
        index: true
    },

    // Có chia sẻ với bạn bè không
    isShared: {
        type: Boolean,
        default: true,
        index: true
    },

    // Vị trí có còn active không
    isActive: {
        type: Boolean,
        default: true,
        index: true
    },

    // Metadata bổ sung
    metadata: {
        accuracy: Number, // GPS accuracy in meters
        altitude: Number, // Altitude in meters
        speed: Number,    // Speed in m/s
        heading: Number,  // Heading in degrees
        source: {
            type: String,
            enum: ['gps', 'network', 'manual', 'search'],
            default: 'gps'
        }
    },

    // Timestamps
    createdAt: {
        type: Date,
        default: Date.now,
        index: true
    },
    
    updatedAt: {
        type: Date,
        default: Date.now,
        index: true
    }
}, {
    timestamps: true,
    collection: 'locations'
});

// Indexes cho performance
locationSchema.index({ user: 1, type: 1 });
locationSchema.index({ user: 1, isActive: 1, isShared: 1 });
locationSchema.index({ coordinates: '2dsphere' }); // Geo index
locationSchema.index({ createdAt: -1 });
locationSchema.index({ updatedAt: -1 });

// Compound index cho queries phổ biến
locationSchema.index({ 
    user: 1, 
    isActive: 1, 
    type: 1, 
    updatedAt: -1 
});

// Virtual fields
locationSchema.virtual('latitude').get(function() {
    return this.coordinates[1];
});

locationSchema.virtual('longitude').get(function() {
    return this.coordinates[0];
});

// Instance methods
locationSchema.methods.getDistance = function(lat, lon) {
    const R = 6371e3; // Earth radius in meters
    const φ1 = this.coordinates[1] * Math.PI/180;
    const φ2 = lat * Math.PI/180;
    const Δφ = (lat - this.coordinates[1]) * Math.PI/180;
    const Δλ = (lon - this.coordinates[0]) * Math.PI/180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c; // Distance in meters
};

locationSchema.methods.toGeoJSON = function() {
    return {
        type: 'Feature',
        geometry: {
            type: 'Point',
            coordinates: this.coordinates
        },
        properties: {
            address: this.address,
            type: this.type,
            isShared: this.isShared,
            user: this.user,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt
        }
    };
};

// Static methods
locationSchema.statics.findNearby = function(lat, lon, radius = 5000, options = {}) {
    return this.aggregate([
        {
            $geoNear: {
                near: {
                    type: "Point",
                    coordinates: [lon, lat]
                },
                distanceField: "distance",
                maxDistance: radius,
                spherical: true,
                query: {
                    isActive: true,
                    isShared: true,
                    ...options.query
                }
            }
        },
        { $limit: options.limit || 50 }
    ]);
};

locationSchema.statics.findWithinBounds = function(southwest, northeast, options = {}) {
    return this.find({
        coordinates: {
            $geoWithin: {
                $box: [southwest, northeast]
            }
        },
        isActive: true,
        isShared: true,
        ...options.query
    }).limit(options.limit || 100);
};

// Pre-save middleware
locationSchema.pre('save', function(next) {
    // Validate coordinates
    if (this.coordinates.length !== 2) {
        return next(new Error('Coordinates must be [longitude, latitude]'));
    }
    
    const [lon, lat] = this.coordinates;
    if (lon < -180 || lon > 180) {
        return next(new Error('Longitude must be between -180 and 180'));
    }
    
    if (lat < -90 || lat > 90) {
        return next(new Error('Latitude must be between -90 and 90'));
    }

    // Update updatedAt for manual saves
    if (!this.isNew) {
        this.updatedAt = new Date();
    }
    
    next();
});

// Pre-update middleware
locationSchema.pre(['updateOne', 'updateMany', 'findOneAndUpdate'], function() {
    this.set({ updatedAt: new Date() });
});

// Methods để clean up old locations
locationSchema.statics.cleanupOldLocations = async function(days = 30) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    
    return this.deleteMany({
        type: { $in: ['current', 'search', 'manual'] },
        updatedAt: { $lt: cutoffDate },
        isActive: false
    });
};

// Transform output
locationSchema.set('toJSON', {
    transform: function(doc, ret) {
        ret.lat = ret.coordinates[1];
        ret.lon = ret.coordinates[0];
        delete ret.coordinates;
        delete ret.__v;
        return ret;
    }
});

const Location = mongoose.model('Location', locationSchema);

module.exports = Location;
