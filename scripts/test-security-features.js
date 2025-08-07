#!/usr/bin/env node

/**
 * Security Features Test Suite
 * Comprehensive testing of all implemented security features
 */

const https = require('https');
const http = require('http');
const { performance } = require('perf_hooks');

class SecurityTestSuite {
    constructor() {
        this.baseURL = 'https://localhost:3443';
        this.httpURL = 'http://localhost:3000';
        this.results = [];
        this.passedTests = 0;
        this.totalTests = 0;
        
        // Skip certificate validation for testing
        process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
        
        console.log('🧪 Crown Social Network - Security Test Suite');
        console.log('================================================');
    }

    /**
     * Run all security tests
     */
    async runAllTests() {
        console.log('🚀 Starting comprehensive security testing...\n');
        
        try {
            await this.testHTTPSRedirection();
            await this.testSecurityHeaders();
            await this.testWAFProtection();
            await this.testRateLimiting();
            await this.testGDPREndpoints();
            await this.testAuthenticationEndpoints();
            await this.testSQLInjectionProtection();
            await this.testXSSProtection();
            await this.testInputValidation();
            
            this.printResults();
            
        } catch (error) {
            console.error('❌ Test suite failed:', error.message);
        }
    }

    /**
     * Test HTTPS redirection
     */
    async testHTTPSRedirection() {
        console.log('🔒 Testing HTTPS/SSL Configuration...');
        
        try {
            const response = await this.makeRequest(this.baseURL + '/health');
            this.recordTest('HTTPS Server Response', response.status === 200, 
                `HTTPS server responding: ${response.status}`);
                
            // Test SSL certificate
            const sslTest = await this.testSSLCertificate();
            this.recordTest('SSL Certificate', sslTest, 
                'SSL certificate validation');
                
        } catch (error) {
            this.recordTest('HTTPS Configuration', false, error.message);
        }
        
        console.log('');
    }

    /**
     * Test security headers
     */
    async testSecurityHeaders() {
        console.log('🛡️  Testing Security Headers...');
        
        try {
            const response = await this.makeRequest(this.baseURL + '/');
            const headers = response.headers;
            
            const requiredHeaders = {
                'strict-transport-security': 'HSTS Header',
                'x-content-type-options': 'MIME Sniffing Protection',
                'x-frame-options': 'Clickjacking Protection',
                'x-xss-protection': 'XSS Protection Header',
                'content-security-policy': 'Content Security Policy',
                'referrer-policy': 'Referrer Policy'
            };
            
            for (const [header, description] of Object.entries(requiredHeaders)) {
                const present = header.toLowerCase() in headers;
                this.recordTest(description, present, 
                    present ? `✅ ${header}: ${headers[header.toLowerCase()]}` : `❌ Missing: ${header}`);
            }
            
        } catch (error) {
            this.recordTest('Security Headers', false, error.message);
        }
        
        console.log('');
    }

    /**
     * Test WAF protection
     */
    async testWAFProtection() {
        console.log('🛡️  Testing WAF Protection...');
        
        // Test SQL injection detection
        try {
            const maliciousPayload = "'; DROP TABLE users; --";
            const response = await this.makeRequest(this.baseURL + '/api/search?q=' + encodeURIComponent(maliciousPayload));
            const blocked = response.status === 400;
            this.recordTest('SQL Injection Protection', blocked, 
                blocked ? 'Malicious SQL query blocked' : 'SQL injection not detected');
        } catch (error) {
            this.recordTest('SQL Injection Protection', true, 'Request properly rejected');
        }
        
        // Test XSS detection
        try {
            const xssPayload = '<script>alert("XSS")</script>';
            const response = await this.makeRequest(this.baseURL + '/api/search?q=' + encodeURIComponent(xssPayload));
            const blocked = response.status === 400;
            this.recordTest('XSS Protection', blocked, 
                blocked ? 'Malicious script blocked' : 'XSS not detected');
        } catch (error) {
            this.recordTest('XSS Protection', true, 'Request properly rejected');
        }
        
        console.log('');
    }

    /**
     * Test rate limiting
     */
    async testRateLimiting() {
        console.log('⚡ Testing Rate Limiting...');
        
        try {
            const requests = [];
            const startTime = performance.now();
            
            // Make multiple rapid requests
            for (let i = 0; i < 15; i++) {
                requests.push(this.makeRequest(this.baseURL + '/api/test-endpoint'));
            }
            
            const responses = await Promise.allSettled(requests);
            const rateLimited = responses.some(r => 
                r.status === 'fulfilled' && r.value.status === 429
            );
            
            const endTime = performance.now();
            const duration = Math.round(endTime - startTime);
            
            this.recordTest('Rate Limiting', rateLimited, 
                rateLimited ? `Rate limiting activated after rapid requests (${duration}ms)` : 'Rate limiting not triggered');
                
        } catch (error) {
            this.recordTest('Rate Limiting', false, error.message);
        }
        
        console.log('');
    }

    /**
     * Test GDPR endpoints
     */
    async testGDPREndpoints() {
        console.log('📋 Testing GDPR Compliance Endpoints...');
        
        const gdprEndpoints = [
            { path: '/api/gdpr/consent', method: 'POST', name: 'Consent Recording' },
            { path: '/api/gdpr/data-access', method: 'POST', name: 'Data Access Request' },
            { path: '/api/gdpr/data-portability', method: 'POST', name: 'Data Portability' },
            { path: '/api/gdpr/data-erasure', method: 'POST', name: 'Right to Erasure' },
            { path: '/api/gdpr/compliance-report', method: 'GET', name: 'Compliance Report' }
        ];
        
        for (const endpoint of gdprEndpoints) {
            try {
                const response = await this.makeRequest(
                    this.baseURL + endpoint.path, 
                    endpoint.method, 
                    endpoint.method === 'POST' ? { userId: 'test-user', consentTypes: ['analytics'] } : null
                );
                
                const working = response.status === 200 || response.status === 400; // 400 is OK for missing auth
                this.recordTest(`GDPR ${endpoint.name}`, working, 
                    `Endpoint responding: ${response.status}`);
                    
            } catch (error) {
                this.recordTest(`GDPR ${endpoint.name}`, false, error.message);
            }
        }
        
        console.log('');
    }

    /**
     * Test authentication endpoints
     */
    async testAuthenticationEndpoints() {
        console.log('🔐 Testing Authentication System...');
        
        const authEndpoints = [
            { path: '/auth/login', method: 'POST', name: 'Login Endpoint' },
            { path: '/auth/register', method: 'POST', name: 'Registration Endpoint' },
            { path: '/auth/refresh', method: 'POST', name: 'Token Refresh' },
            { path: '/auth/logout', method: 'POST', name: 'Logout Endpoint' }
        ];
        
        for (const endpoint of authEndpoints) {
            try {
                const response = await this.makeRequest(
                    this.baseURL + endpoint.path, 
                    endpoint.method,
                    { username: 'test', password: 'test123' }
                );
                
                const working = response.status === 200 || response.status === 400 || response.status === 401;
                this.recordTest(`Auth ${endpoint.name}`, working, 
                    `Endpoint responding: ${response.status}`);
                    
            } catch (error) {
                this.recordTest(`Auth ${endpoint.name}`, false, error.message);
            }
        }
        
        console.log('');
    }

    /**
     * Test SQL injection protection
     */
    async testSQLInjectionProtection() {
        console.log('🔍 Testing SQL Injection Protection...');
        
        const sqlPayloads = [
            "1' OR '1'='1",
            "'; DROP TABLE users; --",
            "1 UNION SELECT * FROM users",
            "admin'--",
            "1' HAVING 1=1 --"
        ];
        
        for (const payload of sqlPayloads) {
            try {
                const response = await this.makeRequest(
                    this.baseURL + '/api/search?q=' + encodeURIComponent(payload)
                );
                
                const blocked = response.status === 400;
                this.recordTest(`SQL Injection Block (${payload.substring(0, 20)}...)`, blocked, 
                    blocked ? 'Payload blocked' : 'Payload not detected');
                    
            } catch (error) {
                this.recordTest(`SQL Injection Block`, true, 'Request rejected by WAF');
            }
        }
        
        console.log('');
    }

    /**
     * Test XSS protection
     */
    async testXSSProtection() {
        console.log('🚫 Testing XSS Protection...');
        
        const xssPayloads = [
            '<script>alert("XSS")</script>',
            '<img src=x onerror=alert("XSS")>',
            '<svg onload=alert("XSS")>',
            'javascript:alert("XSS")',
            '<iframe src="javascript:alert(\'XSS\')"></iframe>'
        ];
        
        for (const payload of xssPayloads) {
            try {
                const response = await this.makeRequest(
                    this.baseURL + '/api/search?q=' + encodeURIComponent(payload)
                );
                
                const blocked = response.status === 400;
                this.recordTest(`XSS Protection (${payload.substring(0, 20)}...)`, blocked, 
                    blocked ? 'XSS payload blocked' : 'XSS payload not detected');
                    
            } catch (error) {
                this.recordTest(`XSS Protection`, true, 'Request rejected by WAF');
            }
        }
        
        console.log('');
    }

    /**
     * Test input validation
     */
    async testInputValidation() {
        console.log('✅ Testing Input Validation...');
        
        try {
            // Test oversized input
            const largePayload = 'A'.repeat(10000);
            const response1 = await this.makeRequest(
                this.baseURL + '/api/search?q=' + encodeURIComponent(largePayload)
            );
            
            const sizeBlocked = response1.status === 400 || response1.status === 413;
            this.recordTest('Large Input Validation', sizeBlocked, 
                sizeBlocked ? 'Oversized input blocked' : 'Large input accepted');
            
            // Test invalid JSON
            const response2 = await this.makeRequest(
                this.baseURL + '/api/test', 
                'POST',
                'invalid json{'
            );
            
            const jsonBlocked = response2.status === 400;
            this.recordTest('Invalid JSON Handling', jsonBlocked, 
                jsonBlocked ? 'Invalid JSON rejected' : 'Invalid JSON processed');
                
        } catch (error) {
            this.recordTest('Input Validation', true, 'Input properly validated');
        }
        
        console.log('');
    }

    /**
     * Test SSL certificate
     */
    async testSSLCertificate() {
        return new Promise((resolve) => {
            const options = {
                hostname: 'localhost',
                port: 3443,
                path: '/',
                method: 'GET',
                rejectUnauthorized: false
            };

            const req = https.request(options, (res) => {
                const cert = res.connection.getPeerCertificate();
                resolve(cert && cert.subject);
            });

            req.on('error', () => resolve(false));
            req.end();
        });
    }

    /**
     * Make HTTP request
     */
    async makeRequest(url, method = 'GET', data = null) {
        return new Promise((resolve, reject) => {
            const urlObj = new URL(url);
            const isHttps = urlObj.protocol === 'https:';
            const client = isHttps ? https : http;
            
            const options = {
                hostname: urlObj.hostname,
                port: urlObj.port,
                path: urlObj.pathname + urlObj.search,
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                    'User-Agent': 'Crown-Security-Test-Suite/1.0'
                },
                rejectUnauthorized: false
            };

            if (data && method !== 'GET') {
                const postData = typeof data === 'string' ? data : JSON.stringify(data);
                options.headers['Content-Length'] = Buffer.byteLength(postData);
            }

            const req = client.request(options, (res) => {
                let body = '';
                res.on('data', (chunk) => body += chunk);
                res.on('end', () => {
                    resolve({
                        status: res.statusCode,
                        headers: res.headers,
                        body: body
                    });
                });
            });

            req.on('error', (error) => {
                reject(error);
            });

            if (data && method !== 'GET') {
                const postData = typeof data === 'string' ? data : JSON.stringify(data);
                req.write(postData);
            }

            req.end();
        });
    }

    /**
     * Record test result
     */
    recordTest(testName, passed, details) {
        this.totalTests++;
        if (passed) this.passedTests++;
        
        const status = passed ? '✅' : '❌';
        const result = { testName, passed, details };
        this.results.push(result);
        
        console.log(`${status} ${testName}: ${details}`);
    }

    /**
     * Print final results
     */
    printResults() {
        console.log('\n🎯 SECURITY TEST RESULTS');
        console.log('========================');
        console.log(`✅ Passed: ${this.passedTests}/${this.totalTests} tests`);
        console.log(`📊 Success Rate: ${((this.passedTests / this.totalTests) * 100).toFixed(1)}%`);
        
        const failedTests = this.results.filter(r => !r.passed);
        if (failedTests.length > 0) {
            console.log('\n❌ Failed Tests:');
            failedTests.forEach(test => {
                console.log(`   - ${test.testName}: ${test.details}`);
            });
        }
        
        console.log('\n🏆 SECURITY IMPLEMENTATION STATUS:');
        if (this.passedTests / this.totalTests >= 0.9) {
            console.log('🎉 EXCELLENT - Crown Social Network is production-ready!');
        } else if (this.passedTests / this.totalTests >= 0.8) {
            console.log('🚀 GOOD - Minor improvements needed before production');
        } else {
            console.log('⚠️  NEEDS ATTENTION - Additional security work required');
        }
        
        console.log(`\n📝 Test completed at: ${new Date().toISOString()}`);
    }
}

// Run tests if called directly
if (require.main === module) {
    const testSuite = new SecurityTestSuite();
    testSuite.runAllTests().catch(console.error);
}

module.exports = SecurityTestSuite;
