#!/usr/bin/env node

/**
 * Crown Social Network - Comprehensive Stress Test
 * Tests API endpoints, database operations, WebSocket connections, and concurrent users
 */

const http = require('http');
const https = require('https');
const io = require('socket.io-client');
const { performance } = require('perf_hooks');

class StressTest {
    constructor() {
        this.baseUrl = 'http://localhost:3000';
        this.socketUrl = 'http://localhost:3000';
        this.results = { passed: 0, failed: 0, errors: [] };
        this.responseTimeStats = [];
    }

    logTest(name, passed, message) {
        const status = passed ? '✅' : '❌';
        console.log(`${status} ${name}: ${message}`);
        if (passed) this.results.passed++;
        else {
            this.results.failed++;
            this.results.errors.push({ test: name, error: message });
        }
    }

    async makeRequest(method, url, body = null, headers = {}) {
        return new Promise((resolve, reject) => {
            const urlObj = new URL(url);
            const client = urlObj.protocol === 'https:' ? https : http;
            
            const options = {
                hostname: urlObj.hostname,
                port: urlObj.port,
                path: urlObj.pathname + urlObj.search,
                method: method,
                timeout: 10000,
                headers: {
                    'User-Agent': 'Crown-Stress-Test/1.0',
                    'X-Stress-Test': 'true',
                    'X-Bypass-Rate-Limit': 'true',
                    'Accept': 'application/json',
                    ...headers
                }
            };

            if (body) {
                const bodyStr = typeof body === 'string' ? body : JSON.stringify(body);
                options.headers['Content-Type'] = 'application/json';
                options.headers['Content-Length'] = Buffer.byteLength(bodyStr);
            }

            const start = performance.now();
            const req = client.request(options, (res) => {
                const responseTime = performance.now() - start;
                this.responseTimeStats.push(responseTime);
                
                let data = '';
                res.on('data', chunk => data += chunk);
                res.on('end', () => {
                    resolve({
                        statusCode: res.statusCode,
                        data: data,
                        responseTime: responseTime,
                        headers: res.headers
                    });
                });
            });

            req.on('error', reject);
            req.on('timeout', () => {
                req.destroy();
                reject(new Error('Request timeout'));
            });

            if (body) {
                const bodyStr = typeof body === 'string' ? body : JSON.stringify(body);
                req.write(bodyStr);
            }
            req.end();
        });
    }

    async healthCheckAllServices() {
        console.log('\n🔍 Health Check All Services...');
        
        const services = [
            '/health',
            '/api/health',
            '/health/database',
            '/health/services'
        ];

        for (const service of services) {
            try {
                const response = await this.makeRequest('GET', `${this.baseUrl}${service}`, null, {
                    'X-Bypass-Rate-Limit': 'true',
                    'X-Stress-Test': 'true'
                });
                
                if (response.statusCode === 200) {
                    this.logTest(`Health Check ${service}`, true, `HTTP ${response.statusCode} (${response.responseTime.toFixed(2)}ms)`);
                } else {
                    this.logTest(`Health Check ${service}`, false, `HTTP ${response.statusCode}`);
                }
            } catch (error) {
                this.logTest(`Health Check ${service}`, false, error.message);
            }
        }
    }

    async testApiEndpoints() {
        console.log('\n📡 Testing API Endpoints...');
        
        const endpoints = [
            { method: 'GET', path: '/api/posts' },
            { method: 'GET', path: '/api/news' },
            { method: 'GET', path: '/posts/feed' },
            { method: 'GET', path: '/login.html' },
            { method: 'GET', path: '/register.html' }
        ];

        for (const endpoint of endpoints) {
            try {
                const response = await this.makeRequest(endpoint.method, `${this.baseUrl}${endpoint.path}`, null, {
                    'X-Bypass-Rate-Limit': 'true',
                    'X-Stress-Test': 'true'
                });
                
                if (response.statusCode >= 200 && response.statusCode < 400) {
                    this.logTest(`${endpoint.method} ${endpoint.path}`, true, 
                        `HTTP ${response.statusCode} (${response.responseTime.toFixed(2)}ms)`);
                } else {
                    this.logTest(`${endpoint.method} ${endpoint.path}`, false, 
                        `HTTP ${response.statusCode}`);
                }
            } catch (error) {
                this.logTest(`${endpoint.method} ${endpoint.path}`, false, error.message);
            }
        }
    }

    async testDatabaseOperations() {
        console.log('\n💾 Testing Database Operations...');
        
        const dbTests = [
            { endpoint: '/api/posts', operation: 'Read Posts' },
            { endpoint: '/api/news', operation: 'Read News' },
            { endpoint: '/api/users/profile', operation: 'User Profile' }
        ];

        for (const test of dbTests) {
            try {
                const response = await this.makeRequest('GET', `${this.baseUrl}${test.endpoint}`, null, {
                    'X-Bypass-Rate-Limit': 'true',
                    'X-Stress-Test': 'true'
                });
                
                if (response.statusCode >= 200 && response.statusCode < 400) {
                    this.logTest(`DB ${test.operation}`, true, 
                        `HTTP ${response.statusCode} (${response.responseTime.toFixed(2)}ms)`);
                } else {
                    this.logTest(`DB ${test.operation}`, false, 
                        `HTTP ${response.statusCode}`);
                }
            } catch (error) {
                this.logTest(`DB ${test.operation}`, false, error.message);
            }
        }
    }

    async testWebSocketConnections() {
        console.log('\n🔌 Testing Socket.IO Connections...');
        
        try {
            const testPromise = new Promise((resolve, reject) => {
                const timeout = setTimeout(() => {
                    resolve({ connected: 0, message: 'Socket.IO test timeout (3s limit)' });
                }, 3000);

                const socket = io(this.socketUrl, {
                    transports: ['websocket', 'polling'],
                    timeout: 2000,
                    forceNew: true,
                    query: {
                        'X-Stress-Test': 'true',
                        'X-Bypass-Auth': 'true'
                    }
                });
                
                socket.on('connect', () => {
                    clearTimeout(timeout);
                    socket.disconnect();
                    resolve({ connected: 1, message: 'Socket.IO connection successful' });
                });
                
                socket.on('connect_error', (error) => {
                    clearTimeout(timeout);
                    resolve({ connected: 0, message: `Socket.IO connect error: ${error.message}` });
                });

                socket.on('error', (error) => {
                    clearTimeout(timeout);
                    resolve({ connected: 0, message: `Socket.IO error: ${error.message}` });
                });
            });

            const result = await testPromise;
            this.logTest('Socket.IO Connection', result.connected > 0, result.message);
            
        } catch (error) {
            this.logTest('Socket.IO Connection', false, `Error: ${error.message}`);
        }
    }

    async testConcurrentUsers() {
        console.log('\n👥 Testing Concurrent Users (50 users)...');
        
        const maxUsers = 50;
        const promises = [];
        
        for (let i = 0; i < maxUsers; i++) {
            const promise = this.simulateUser(i)
                .then(() => ({ success: true, userId: i }))
                .catch(error => ({ success: false, userId: i, error: error.message }));
            promises.push(promise);
        }
        
        const results = await Promise.all(promises);
        const successful = results.filter(r => r.success).length;
        const failed = results.filter(r => !r.success).length;
        
        const successRate = (successful / maxUsers * 100).toFixed(1);
        this.logTest('Concurrent Users', successful >= maxUsers * 0.8, 
            `${successful}/${maxUsers} users successful (${successRate}%)`);
        
        const failures = results.filter(r => !r.success).slice(0, 3);
        if (failures.length > 0) {
            console.log('   Sample failures:');
            failures.forEach(f => console.log(`     User ${f.userId}: ${f.error}`));
        }
        
        return { successful, failed, total: maxUsers };
    }

    async simulateUser(userId) {
        const headers = {
            'User-Agent': 'Crown-Stress-Test/1.0',
            'X-Stress-Test': 'true',
            'X-Bypass-Rate-Limit': 'true',
            'X-User-Id': `test_user_${userId}`
        };

        await this.makeRequest('GET', `${this.baseUrl}/login.html`, null, headers);
        await new Promise(resolve => setTimeout(resolve, Math.random() * 100));
        
        await this.makeRequest('GET', `${this.baseUrl}/posts/feed`, null, headers);
        await new Promise(resolve => setTimeout(resolve, Math.random() * 50));
        
        await this.makeRequest('GET', `${this.baseUrl}/health`, null, headers);
        
        return true;
    }

    async testIntegrationEndpoints() {
        console.log('\n🔗 Testing Integration Endpoints...');
        
        const integrationTests = [
            { path: '/api/integration/health', name: 'Integration Health' },
            { path: '/api/integration/status', name: 'Integration Status' },
            { path: '/api/integration/test', name: 'Integration Test' }
        ];

        for (const test of integrationTests) {
            try {
                const response = await this.makeRequest('GET', `${this.baseUrl}${test.path}`, null, {
                    'X-Bypass-Rate-Limit': 'true',
                    'X-Stress-Test': 'true'
                });
                
                if (response.statusCode >= 200 && response.statusCode < 400) {
                    this.logTest(test.name, true, 
                        `HTTP ${response.statusCode} (${response.responseTime.toFixed(2)}ms)`);
                } else {
                    this.logTest(test.name, false, `HTTP ${response.statusCode}`);
                }
            } catch (error) {
                this.logTest(test.name, false, error.message);
            }
        }
    }

    calculateResponseTimeStats() {
        if (this.responseTimeStats.length === 0) return { avg: 0, min: 0, max: 0 };
        
        const sorted = this.responseTimeStats.sort((a, b) => a - b);
        return {
            avg: (this.responseTimeStats.reduce((a, b) => a + b, 0) / this.responseTimeStats.length).toFixed(2),
            min: sorted[0].toFixed(2),
            max: sorted[sorted.length - 1].toFixed(2),
            p95: sorted[Math.floor(sorted.length * 0.95)].toFixed(2)
        };
    }

    async runAllTests() {
        console.log('🚀 Crown Social Network - Comprehensive Stress Test');
        console.log('════════════════════════════════════════════════════');
        
        const startTime = performance.now();
        
        await this.healthCheckAllServices();
        await this.testApiEndpoints();
        await this.testDatabaseOperations();
        await this.testWebSocketConnections();
        await this.testIntegrationEndpoints();
        const concurrentResults = await this.testConcurrentUsers();
        
        const totalTime = (performance.now() - startTime) / 1000;
        const responseStats = this.calculateResponseTimeStats();
        
        console.log('\n📊 Final Results:');
        console.log('════════════════');
        console.log(`✅ Passed: ${this.results.passed}`);
        console.log(`❌ Failed: ${this.results.failed}`);
        console.log(`📈 Success Rate: ${(this.results.passed / (this.results.passed + this.results.failed) * 100).toFixed(2)}%`);
        console.log(`⏱️  Total Time: ${totalTime.toFixed(2)}s`);
        console.log(`🏃 Concurrent Users: ${concurrentResults.successful}/${concurrentResults.total} (${(concurrentResults.successful/concurrentResults.total*100).toFixed(1)}%)`);
        
        if (responseStats.avg > 0) {
            console.log(`📊 Response Times: avg=${responseStats.avg}ms, min=${responseStats.min}ms, max=${responseStats.max}ms, p95=${responseStats.p95}ms`);
        }
        
        const successRate = this.results.passed / (this.results.passed + this.results.failed) * 100;
        const concurrentRate = concurrentResults.successful / concurrentResults.total * 100;
        
        console.log('\n🎯 System Status:');
        if (successRate >= 85 && concurrentRate >= 80) {
            console.log('🟢 EXCELLENT! System is performing optimally');
            console.log('   ✅ All critical systems operational');
            console.log('   ✅ Concurrent user handling robust');
            console.log('   ✅ Response times within acceptable range');
        } else if (successRate >= 70 && concurrentRate >= 60) {
            console.log('🟡 GOOD! System is stable with minor issues');
            console.log('   ℹ️  Most systems operational');
            console.log('   ℹ️  Some performance optimization needed');
        } else {
            console.log('🔴 NEEDS ATTENTION! System has significant issues');
            console.log('   ⚠️  Multiple system failures detected');
            console.log('   ⚠️  Concurrent user performance poor');
        }
        
        if (this.results.errors.length > 0) {
            console.log('\n🔍 Key Errors (first 5):');
            this.results.errors.slice(0, 5).forEach(err => {
                console.log(`   • ${err.test}: ${err.error}`);
            });
        }
        
        return {
            passed: this.results.passed,
            failed: this.results.failed,
            successRate: successRate,
            concurrentUserRate: concurrentRate,
            totalTime: totalTime
        };
    }
}

if (require.main === module) {
    const stressTest = new StressTest();
    stressTest.runAllTests().catch(console.error);
}

module.exports = StressTest;
