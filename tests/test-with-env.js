// Test file to verify environment variable is working
process.env.DISABLE_RATE_LIMITING = 'true';
process.env.NODE_ENV = 'test';

console.log('Environment variables:');
console.log('DISABLE_RATE_LIMITING:', process.env.DISABLE_RATE_LIMITING);
console.log('NODE_ENV:', process.env.NODE_ENV);

// Import and run master test
require('./master-test.js');
