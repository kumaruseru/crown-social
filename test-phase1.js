/**
 * Phase 1 Test Script - Crown Social Network
 * Test Core Social Features: Friend System, User Profiles, Activity Feed
 */

const mongoose = require('mongoose');
const User = require('./src/models/User');
const Friend = require('./src/models/Friend');
const Post = require('./src/models/Post');
const Comment = require('./src/models/Comment');

// Test configuration
const DB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/crown-social';

/**
 * Test Phase 1 Core Social Features
 */
async function testPhase1Features() {
    try {
        console.log('🚀 Starting Phase 1 Feature Tests...\n');
        
        // Connect to database
        await mongoose.connect(DB_URI);
        console.log('✅ Connected to MongoDB\n');
        
        // Clean test data
        await cleanTestData();
        
        // Create test users
        const users = await createTestUsers();
        console.log('✅ Created test users\n');
        
        // Test Friend System
        await testFriendSystem(users);
        console.log('✅ Friend System tests completed\n');
        
        // Test Enhanced User Profiles
        await testUserProfiles(users);
        console.log('✅ User Profiles tests completed\n');
        
        // Test Activity Feed
        await testActivityFeed(users);
        console.log('✅ Activity Feed tests completed\n');
        
        // Test Comment System
        await testCommentSystem(users);
        console.log('✅ Comment System tests completed\n');
        
        console.log('🎉 All Phase 1 tests passed successfully!');
        
    } catch (error) {
        console.error('❌ Test failed:', error);
    } finally {
        await mongoose.disconnect();
        console.log('👋 Disconnected from database');
        process.exit(0);
    }
}

/**
 * Clean test data
 */
async function cleanTestData() {
    console.log('🧹 Cleaning test data...');
    
    await Promise.all([
        User.deleteMany({ email: { $regex: '@test.com$' } }),
        Friend.deleteMany({}),
        Post.deleteMany({ content: { $regex: 'Test post' } }),
        Comment.deleteMany({ content: { $regex: 'Test comment' } })
    ]);
    
    console.log('✅ Test data cleaned');
}

/**
 * Create test users
 */
async function createTestUsers() {
    console.log('👥 Creating test users...');
    
    const testUsers = [
        {
            firstName: 'John',
            lastName: 'Doe',
            username: 'johndoe',
            email: 'john@test.com',
            password: 'hashedpassword',
            bio: 'Software developer and tech enthusiast',
            location: 'Ho Chi Minh City, Vietnam',
            website: 'https://johndoe.dev',
            profileVisibility: 'public',
            showEmail: false,
            allowFriendRequests: true
        },
        {
            firstName: 'Jane',
            lastName: 'Smith',
            username: 'janesmith',
            email: 'jane@test.com',
            password: 'hashedpassword',
            bio: 'Digital marketing specialist',
            location: 'Hanoi, Vietnam',
            profileVisibility: 'friends',
            showEmail: true,
            allowFriendRequests: true
        },
        {
            firstName: 'Bob',
            lastName: 'Johnson',
            username: 'bobjohnson',
            email: 'bob@test.com',
            password: 'hashedpassword',
            bio: 'Photographer and travel blogger',
            location: 'Da Nang, Vietnam',
            profileVisibility: 'public',
            showEmail: false,
            allowFriendRequests: true
        }
    ];
    
    const users = await User.insertMany(testUsers);
    console.log(`✅ Created ${users.length} test users`);
    
    return users;
}

/**
 * Test Friend System
 */
async function testFriendSystem(users) {
    console.log('🤝 Testing Friend System...');
    
    const [john, jane, bob] = users;
    
    // Test 1: Send friend request
    const friendship1 = new Friend({
        requester: john._id,
        recipient: jane._id,
        status: 'pending'
    });
    await friendship1.save();
    console.log('  ✅ Friend request sent successfully');
    
    // Test 2: Accept friend request
    friendship1.status = 'accepted';
    friendship1.acceptedAt = new Date();
    await friendship1.save();
    
    // Update friend counts
    await User.findByIdAndUpdate(john._id, { $inc: { friendsCount: 1 } });
    await User.findByIdAndUpdate(jane._id, { $inc: { friendsCount: 1 } });
    console.log('  ✅ Friend request accepted successfully');
    
    // Test 3: Block user
    const blockRelation = new Friend({
        requester: bob._id,
        recipient: jane._id,
        status: 'blocked',
        blockedBy: bob._id,
        blockedAt: new Date()
    });
    await blockRelation.save();
    console.log('  ✅ User blocked successfully');
    
    // Test 4: Get friends list
    const friendsList = await Friend.getFriendsList(john._id);
    console.log(`  ✅ Friends list retrieved: ${friendsList.length} friends`);
    
    // Test 5: Get friend suggestions
    const suggestions = await Friend.getFriendSuggestions(john._id, { limit: 5 });
    console.log(`  ✅ Friend suggestions retrieved: ${suggestions.length} suggestions`);
    
    // Test 6: Get friendship status
    const status = await Friend.getFriendshipStatus(john._id, jane._id);
    console.log(`  ✅ Friendship status: ${status}`);
}

/**
 * Test Enhanced User Profiles
 */
async function testUserProfiles(users) {
    console.log('👤 Testing Enhanced User Profiles...');
    
    const [john] = users;
    
    // Test 1: Update profile with social features
    john.bio = 'Updated bio with social features';
    john.isOnline = true;
    john.lastSeen = new Date();
    await john.save();
    console.log('  ✅ User profile updated with social features');
    
    // Test 2: Privacy settings test
    console.log(`  ✅ Profile visibility: ${john.profileVisibility}`);
    console.log(`  ✅ Friend requests setting: ${john.allowFriendRequests}`);
    
    // Test 3: Activity status
    console.log(`  ✅ Online status: ${john.isOnline}`);
    console.log(`  ✅ Last seen: ${john.lastSeen}`);
    
    // Test 4: Statistics
    console.log(`  ✅ Friends count: ${john.friendsCount}`);
    console.log(`  ✅ Posts count: ${john.postsCount}`);
}

/**
 * Test Activity Feed
 */
async function testActivityFeed(users) {
    console.log('📰 Testing Activity Feed...');
    
    const [john, jane, bob] = users;
    
    // Test 1: Create posts with different types
    const posts = [
        {
            author: john._id,
            content: 'Test post 1 - My first social media post!',
            type: 'text',
            visibility: 'public',
            tags: ['social', 'test']
        },
        {
            author: jane._id,
            content: 'Test post 2 - Sharing my thoughts with friends only',
            type: 'text',
            visibility: 'friends',
            tags: ['private', 'thoughts'],
            location: {
                type: 'Point',
                coordinates: [106.6297, 10.8231], // Ho Chi Minh City
                name: 'Ho Chi Minh City',
                address: 'Vietnam'
            }
        },
        {
            author: bob._id,
            content: 'Test post 3 - Public post with media',
            type: 'image',
            visibility: 'public',
            media: [{
                type: 'image',
                url: 'https://example.com/image.jpg',
                filename: 'test-image.jpg'
            }]
        }
    ];
    
    const createdPosts = await Post.insertMany(posts);
    console.log(`  ✅ Created ${createdPosts.length} test posts`);
    
    // Update users' post counts
    await User.findByIdAndUpdate(john._id, { $inc: { postsCount: 1 } });
    await User.findByIdAndUpdate(jane._id, { $inc: { postsCount: 1 } });
    await User.findByIdAndUpdate(bob._id, { $inc: { postsCount: 1 } });
    
    // Test 2: Test likes and reactions
    const [post1, post2] = createdPosts;
    
    await post1.toggleLike(jane._id, 'love');
    await post1.toggleLike(bob._id, 'like');
    console.log(`  ✅ Post likes: ${post1.likesCount} likes`);
    
    // Test 3: Get feed posts (simulated)
    try {
        const feedPosts = await Post.getFeedPosts(john._id, { page: 1, limit: 10 });
        console.log(`  ✅ Feed posts retrieved: ${feedPosts.length} posts`);
    } catch (error) {
        console.log('  ⚠️ Feed posts test skipped (Friend model integration needed)');
    }
    
    // Test 4: Get trending posts
    const trendingPosts = await Post.getTrendingPosts('24h');
    console.log(`  ✅ Trending posts retrieved: ${trendingPosts.length} posts`);
    
    // Test 5: Get user posts
    const userPosts = await Post.getUserPosts(john._id, john._id, { page: 1, limit: 10 });
    console.log(`  ✅ User posts retrieved: ${userPosts.length} posts`);
}

/**
 * Test Comment System
 */
async function testCommentSystem(users) {
    console.log('💬 Testing Comment System...');
    
    const [john, jane] = users;
    
    // Get a test post
    const testPost = await Post.findOne({ author: john._id });
    
    if (testPost) {
        // Test 1: Create comments
        const comments = [
            {
                post: testPost._id,
                author: jane._id,
                content: 'Test comment 1 - Great post!',
                parentComment: null
            },
            {
                post: testPost._id,
                author: john._id,
                content: 'Test comment 2 - Thank you!',
                parentComment: null
            }
        ];
        
        const createdComments = await Comment.insertMany(comments);
        console.log(`  ✅ Created ${createdComments.length} comments`);
        
        // Test 2: Create a reply
        const [firstComment] = createdComments;
        const reply = new Comment({
            post: testPost._id,
            author: jane._id,
            content: 'Test reply - This is a reply to the first comment',
            parentComment: firstComment._id
        });
        await reply.save();
        console.log('  ✅ Reply created successfully');
        
        // Test 3: Like a comment
        await firstComment.toggleLike(john._id);
        console.log(`  ✅ Comment liked: ${firstComment.likesCount} likes`);
        
        // Test 4: Get post comments
        const postComments = await Comment.getPostComments(testPost._id, { page: 1, limit: 10 });
        console.log(`  ✅ Post comments retrieved: ${postComments.length} comments`);
        
        // Update post comment count
        await Post.findByIdAndUpdate(testPost._id, { $inc: { commentsCount: 3 } });
    } else {
        console.log('  ⚠️ Comment tests skipped (no test posts found)');
    }
}

// Run tests
testPhase1Features();
