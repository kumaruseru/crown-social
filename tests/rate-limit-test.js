#!/usr/bin/env node

// Simple rate limiting test
process.env.DISABLE_RATE_LIMITING = 'true';
process.env.NODE_ENV = 'test';

const http = require('http');

function makeRequest(path = '/', headers = {}) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'localhost',
            port: 3000,
            path: path,
            method: 'GET',
            headers: {
                'User-Agent': 'Crown-Stress-Test/1.0',
                'X-Stress-Test': 'true',
                'X-Test-Mode': 'stress',
                ...headers
            },
            timeout: 10000
        };

        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                resolve({
                    statusCode: res.statusCode,
                    statusMessage: res.statusMessage,
                    headers: res.headers,
                    data: data.slice(0, 100) // First 100 chars only
                });
            });
        });

        req.on('error', reject);
        req.on('timeout', () => reject(new Error('Request timeout')));
        req.end();
    });
}

async function testRateLimiting() {
    console.log('🔥 Testing Rate Limiting Bypass...');
    console.log('Environment variables:');
    console.log('DISABLE_RATE_LIMITING:', process.env.DISABLE_RATE_LIMITING);
    console.log('NODE_ENV:', process.env.NODE_ENV);
    
    const results = { success: 0, failed: 0, errors: [] };
    
    // Test with multiple rapid requests
    const promises = [];
    for (let i = 0; i < 100; i++) {
        promises.push(
            makeRequest('/')
                .then(response => {
                    if (response.statusCode === 200) {
                        results.success++;
                    } else {
                        results.failed++;
                        results.errors.push(`Request ${i}: HTTP ${response.statusCode} ${response.statusMessage}`);
                    }
                })
                .catch(error => {
                    results.failed++;
                    results.errors.push(`Request ${i}: ${error.message}`);
                })
        );
    }
    
    await Promise.all(promises);
    
    console.log('\n📊 Results:');
    console.log(`✅ Success: ${results.success}`);
    console.log(`❌ Failed: ${results.failed}`);
    console.log(`📈 Success Rate: ${(results.success / 100 * 100).toFixed(2)}%`);
    
    if (results.errors.length > 0) {
        console.log('\n❌ Errors (first 10):');
        results.errors.slice(0, 10).forEach((error, i) => {
            console.log(`${i + 1}. ${error}`);
        });
    }
    
    // Test specific endpoints
    console.log('\n🔍 Testing specific endpoints...');
    const endpoints = ['/health', '/api/posts/status', '/api/news/status', '/integration/status'];
    
    for (const endpoint of endpoints) {
        try {
            const response = await makeRequest(endpoint);
            console.log(`✅ ${endpoint}: HTTP ${response.statusCode}`);
        } catch (error) {
            console.log(`❌ ${endpoint}: ${error.message}`);
        }
    }
}

testRateLimiting().catch(console.error);
