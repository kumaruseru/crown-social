#!/usr/bin/env node

/**
 * Crown Social Network - Quick Stress Test
 * Focus on critical endpoints only
 */

const http = require('http');

class QuickStressTest {
    constructor() {
        this.baseUrl = 'http://localhost:3000';
        this.results = { passed: 0, failed: 0, errors: [] };
    }

    async makeRequest(method, url, body = null, headers = {}) {
        return new Promise((resolve, reject) => {
            const urlObj = new URL(url);
            const options = {
                hostname: urlObj.hostname,
                port: urlObj.port,
                path: urlObj.pathname + urlObj.search,
                method: method,
                timeout: 5000,
                headers: {
                    'User-Agent': 'Crown-Stress-Test/1.0',
                    'X-Stress-Test': 'true',
                    'Accept': 'application/json, text/html',
                    ...headers
                }
            };

            if (body) {
                options.headers['Content-Type'] = 'application/json';
                options.headers['Content-Length'] = Buffer.byteLength(body);
            }

            const req = http.request(options, (res) => {
                let data = '';
                res.on('data', chunk => data += chunk);
                res.on('end', () => {
                    if (res.statusCode >= 200 && res.statusCode < 300) {
                        resolve({ statusCode: res.statusCode });
                    } else {
                        reject(new Error(`HTTP ${res.statusCode}: ${res.statusMessage}`));
                    }
                });
            });

            req.on('error', reject);
            req.on('timeout', () => reject(new Error('Request timeout')));

            if (body) req.write(body);
            req.end();
        });
    }

    async runConcurrentUserTest() {
        console.log('\n👥 Quick Concurrent User Test (25 users)...');
        
        const promises = [];
        for (let i = 0; i < 25; i++) {
            const promise = this.simulateUser(i)
                .then(() => ({ success: true, userId: i }))
                .catch(error => ({ success: false, userId: i, error: error.message }));
            promises.push(promise);
        }
        
        const results = await Promise.all(promises);
        const successful = results.filter(r => r.success).length;
        const failed = results.filter(r => !r.success).length;
        
        console.log(`📊 Results: ${successful}/${25} users successful (${(successful/25*100).toFixed(1)}%)`);
        
        // Log first few failures
        const failures = results.filter(r => !r.success).slice(0, 3);
        if (failures.length > 0) {
            console.log('❌ Sample failures:');
            failures.forEach(f => console.log(`  User ${f.userId}: ${f.error}`));
        }
        
        this.results.passed += successful;
        this.results.failed += failed;
        
        return { successful, failed, total: 25 };
    }

    async simulateUser(userId) {
        const headers = {
            'User-Agent': 'Crown-Stress-Test/1.0',
            'X-Stress-Test': 'true',
            'X-User-Id': `test_user_${userId}`
        };

        // Simple user journey
        await this.makeRequest('GET', `${this.baseUrl}/login.html`, null, headers);
        await new Promise(resolve => setTimeout(resolve, 50));
        
        await this.makeRequest('GET', `${this.baseUrl}/posts/feed`, null, headers);
        await new Promise(resolve => setTimeout(resolve, 25));
        
        await this.makeRequest('GET', `${this.baseUrl}/health`, null, headers);
        
        return true;
    }
}

async function main() {
    const test = new QuickStressTest();
    
    console.log('🚀 Crown Social Network - Quick Concurrent User Test');
    console.log('════════════════════════════════════════════════════');
    
    const result = await test.runConcurrentUserTest();
    
    console.log('\n📋 Final Results:');
    console.log(`✅ Successful: ${result.successful}`);
    console.log(`❌ Failed: ${result.failed}`);
    console.log(`📈 Success Rate: ${(result.successful/result.total*100).toFixed(2)}%`);
    
    if (result.successful >= 20) {
        console.log('🎉 EXCELLENT! Concurrent users working well!');
    } else if (result.successful >= 15) {
        console.log('🟡 GOOD! Most concurrent users working');
    } else {
        console.log('🔴 NEEDS WORK: Concurrent user issues persist');
    }
}

if (require.main === module) {
    main().catch(console.error);
}

module.exports = QuickStressTest;
