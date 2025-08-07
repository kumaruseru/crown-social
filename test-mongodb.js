// MongoDB Connection Test for Crown Social Network
const mongoose = require('mongoose');
require('dotenv').config();

async function testConnection() {
    try {
        console.log('🔍 Testing MongoDB connection...');
        console.log('URI:', process.env.MONGODB_URI.replace(/:[^@]+@/, ':***@'));
        
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ MongoDB connected successfully!');
        
        // Test basic operations
        const testCollection = mongoose.connection.db.collection('test');
        await testCollection.insertOne({ test: true, timestamp: new Date() });
        console.log('✅ Database write test passed!');
        
        await testCollection.deleteOne({ test: true });
        console.log('✅ Database delete test passed!');
        
        console.log('🎉 Database ready for production!');
        
    } catch (error) {
        console.error('❌ MongoDB connection failed:', error.message);
        console.log('🔧 Check your connection string and network access');
    } finally {
        mongoose.connection.close();
    }
}

testConnection();
