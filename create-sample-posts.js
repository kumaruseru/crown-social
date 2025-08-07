const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const User = require('./src/models/User');
const Post = require('./src/models/Post');

/**
 * Script tạo sample posts để test
 */
async function createSamplePosts() {
    try {
        // Connect to MongoDB
        console.log('🔌 Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        // Tìm user Hương để tạo posts
        const user = await User.findOne({ email: 'hohuong15052005@gmail.com' });
        if (!user) {
            console.log('❌ User not found');
            return;
        }

        console.log(`✅ Found user: ${user.firstName} ${user.lastName}`);

        // Xóa posts cũ (nếu có)
        await Post.deleteMany({});
        console.log('🗑️ Cleared existing posts');

        // Sample posts data
        const samplePosts = [
            {
                author: user._id,
                content: 'Chào mọi người! Mình vừa tham gia Crown và cảm thấy rất thú vị. Hy vọng sẽ kết nối được với nhiều bạn bè mới! 🎉',
                images: [],
                privacy: 'public',
                createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000) // 2 hours ago
            },
            {
                author: user._id,
                content: 'Hôm nay thời tiết thật đẹp! Mình đi dạo công viên và chụp được vài tấm hình cực kỳ đẹp. Các bạn có thích không? 📸🌸',
                images: [
                    {
                        url: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop',
                        alt: 'Beautiful park scenery'
                    }
                ],
                privacy: 'public',
                createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000) // 4 hours ago
            },
            {
                author: user._id,
                content: 'Vừa hoàn thành buổi tập yoga buổi sáng. Cảm giác thật tuyệt vời và tràn đầy năng lượng cho một ngày mới! 🧘‍♀️✨ #yoga #healthy #morning',
                images: [],
                hashtags: ['yoga', 'healthy', 'morning'],
                privacy: 'public',
                createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000) // 6 hours ago
            },
            {
                author: user._id,
                content: 'Món ăn yêu thích cuối tuần: bánh mì thịt nướng! Ai cũng thích bánh mì này không? 🥖🔥',
                images: [
                    {
                        url: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=800&h=600&fit=crop',
                        alt: 'Vietnamese banh mi'
                    },
                    {
                        url: 'https://images.unsplash.com/photo-1552566068-d4534e1dd4b0?w=800&h=600&fit=crop',
                        alt: 'Grilled meat banh mi'
                    }
                ],
                privacy: 'public',
                createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000) // 1 day ago
            },
            {
                author: user._id,
                content: 'Cuối tuần rảnh rỗi, mình quyết định học một kỹ năng mới: vẽ tranh! Đây là tác phẩm đầu tiên, mọi người góp ý nhé! 🎨',
                images: [
                    {
                        url: 'https://images.unsplash.com/photo-1544967882-f4f296ed67d8?w=800&h=600&fit=crop',
                        alt: 'First painting artwork'
                    }
                ],
                privacy: 'public',
                createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) // 2 days ago
            }
        ];

        // Tạo posts
        console.log('📝 Creating sample posts...');
        const createdPosts = await Post.insertMany(samplePosts);
        console.log(`✅ Created ${createdPosts.length} sample posts`);

        // Thêm một số likes và comments ngẫu nhiên
        for (const post of createdPosts) {
            // Thêm likes (random 1-10)
            const likeCount = Math.floor(Math.random() * 10) + 1;
            for (let i = 0; i < likeCount; i++) {
                post.likes.push({ user: user._id });
            }

            // Thêm comments (random 0-3)
            const commentCount = Math.floor(Math.random() * 4);
            const sampleComments = [
                'Tuyệt vời quá!',
                'Mình cũng thích điều này!',
                'Cảm ơn bạn đã chia sẻ!',
                'Thật là hay! 👍',
                'Mình sẽ thử làm theo!'
            ];

            for (let i = 0; i < commentCount; i++) {
                const randomComment = sampleComments[Math.floor(Math.random() * sampleComments.length)];
                post.comments.push({
                    user: user._id,
                    content: randomComment
                });
            }

            await post.save();
        }

        console.log('✅ Added likes and comments to posts');
        console.log('🎉 Sample data created successfully!');

    } catch (error) {
        console.error('❌ Error creating sample posts:', error);
    } finally {
        await mongoose.disconnect();
        console.log('🔌 Disconnected from MongoDB');
        process.exit(0);
    }
}

// Run the script
createSamplePosts();
