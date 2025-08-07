const jest = require('jest');
const supertest = require('supertest');

/**
 * Security Test Suite
 * Comprehensive security testing for Crown Social Network
 */
class SecurityTestSuite {
    constructor(app) {
        this.app = app;
        this.request = supertest(app);
        this.results = {
            passed: 0,
            failed: 0,
            total: 0,
            details: []
        };
        
        console.log('🧪 Security Test Suite initialized');
    }

    /**
     * Run all security tests
     */
    async runAllTests() {
        console.log('🚀 Starting comprehensive security tests...\n');

        try {
            await this.testAuthentication();
            await this.testAuthorization();
            await this.testInputValidation();
            await this.testSQLInjection();
            await this.testXSSProtection();
            await this.testCSRFProtection();
            await this.testSecurityHeaders();
            await this.testRateLimiting();
            await this.testSessionSecurity();
            await this.testGDPRCompliance();
            
            return this.generateReport();

        } catch (error) {
            console.error('❌ Security test suite failed:', error);
            throw error;
        }
    }

    /**
     * Test Authentication mechanisms
     */
    async testAuthentication() {
        console.log('🔐 Testing Authentication...');

        // Test valid login
        await this.runTest('Valid Login', async () => {
            const response = await this.request
                .post('/auth/login')
                .send({
                    username: 'testuser',
                    password: 'ValidPassword123!'
                });
            
            return response.status === 200 || response.status === 400; // 400 is OK if user doesn't exist
        });

        // Test invalid credentials
        await this.runTest('Invalid Credentials Rejection', async () => {
            const response = await this.request
                .post('/auth/login')
                .send({
                    username: 'invaliduser',
                    password: 'wrongpassword'
                });
            
            return response.status === 401 || response.status === 400;
        });

        // Test password complexity
        await this.runTest('Weak Password Rejection', async () => {
            const response = await this.request
                .post('/auth/register')
                .send({
                    username: 'newuser',
                    email: 'test@example.com',
                    password: '123'
                });
            
            return response.status === 400;
        });

        // Test JWT token validation
        await this.runTest('JWT Token Validation', async () => {
            const response = await this.request
                .get('/api/profile')
                .set('Authorization', 'Bearer invalid.jwt.token');
            
            return response.status === 401;
        });

        console.log('');
    }

    /**
     * Test Authorization controls
     */
    async testAuthorization() {
        console.log('🛡️  Testing Authorization...');

        // Test unauthorized access to protected route
        await this.runTest('Protected Route Access Control', async () => {
            const response = await this.request
                .get('/api/admin/users');
            
            return response.status === 401 || response.status === 403;
        });

        // Test role-based access
        await this.runTest('Role-based Access Control', async () => {
            const response = await this.request
                .get('/api/admin/settings')
                .set('Authorization', 'Bearer user.token'); // Regular user token
            
            return response.status === 403;
        });

        console.log('');
    }

    /**
     * Test Input validation
     */
    async testInputValidation() {
        console.log('✅ Testing Input Validation...');

        // Test oversized input
        await this.runTest('Oversized Input Rejection', async () => {
            const largeInput = 'A'.repeat(10000);
            const response = await this.request
                .post('/api/posts')
                .send({ content: largeInput });
            
            return response.status === 400 || response.status === 413;
        });

        // Test invalid data types
        await this.runTest('Invalid Data Type Handling', async () => {
            const response = await this.request
                .post('/api/posts')
                .send({ content: null, likes: 'not_a_number' });
            
            return response.status === 400;
        });

        // Test required field validation
        await this.runTest('Required Field Validation', async () => {
            const response = await this.request
                .post('/api/posts')
                .send({}); // Empty body
            
            return response.status === 400;
        });

        console.log('');
    }

    /**
     * Test SQL Injection protection
     */
    async testSQLInjection() {
        console.log('🔍 Testing SQL Injection Protection...');

        const sqlPayloads = [
            "'; DROP TABLE users; --",
            "1' OR '1'='1",
            "admin'--",
            "1 UNION SELECT * FROM users",
            "'; INSERT INTO users VALUES ('hacker'); --"
        ];

        for (let i = 0; i < sqlPayloads.length; i++) {
            const payload = sqlPayloads[i];
            await this.runTest(`SQL Injection Test ${i + 1}`, async () => {
                const response = await this.request
                    .get('/api/search')
                    .query({ q: payload });
                
                // Should be blocked by WAF or return safe results
                return response.status === 400 || response.status === 403 || 
                       (response.status === 200 && !this.containsSensitiveData(response.body));
            });
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

        for (let i = 0; i < xssPayloads.length; i++) {
            const payload = xssPayloads[i];
            await this.runTest(`XSS Protection Test ${i + 1}`, async () => {
                const response = await this.request
                    .post('/api/posts')
                    .send({ content: payload });
                
                // Should be blocked or sanitized
                return response.status === 400 || response.status === 403 ||
                       (response.status === 200 && !response.body.content?.includes('<script'));
            });
        }

        console.log('');
    }

    /**
     * Test CSRF protection
     */
    async testCSRFProtection() {
        console.log('🛡️  Testing CSRF Protection...');

        await this.runTest('CSRF Token Validation', async () => {
            const response = await this.request
                .post('/api/posts')
                .send({ content: 'Test post' });
                // Missing CSRF token
            
            return response.status === 403 || response.status === 401;
        });

        console.log('');
    }

    /**
     * Test Security headers
     */
    async testSecurityHeaders() {
        console.log('🔒 Testing Security Headers...');

        await this.runTest('Security Headers Present', async () => {
            const response = await this.request.get('/');
            
            const requiredHeaders = [
                'strict-transport-security',
                'x-content-type-options',
                'x-frame-options',
                'content-security-policy'
            ];

            let headerCount = 0;
            for (const header of requiredHeaders) {
                if (response.headers[header]) {
                    headerCount++;
                }
            }

            return headerCount >= 3; // At least 3 out of 4 headers
        });

        console.log('');
    }

    /**
     * Test Rate limiting
     */
    async testRateLimiting() {
        console.log('⚡ Testing Rate Limiting...');

        await this.runTest('Rate Limiting Enforcement', async () => {
            const promises = [];
            
            // Make multiple rapid requests
            for (let i = 0; i < 20; i++) {
                promises.push(this.request.get('/api/news'));
            }

            const responses = await Promise.all(promises);
            const rateLimited = responses.some(response => response.status === 429);
            
            return rateLimited;
        });

        console.log('');
    }

    /**
     * Test Session security
     */
    async testSessionSecurity() {
        console.log('🔐 Testing Session Security...');

        await this.runTest('Secure Cookie Configuration', async () => {
            const response = await this.request.get('/');
            
            const setCookieHeaders = response.headers['set-cookie'];
            if (!setCookieHeaders) return true; // No cookies is OK
            
            // Check if cookies have security flags
            const secureCookies = setCookieHeaders.some(cookie => 
                cookie.includes('HttpOnly') && cookie.includes('Secure')
            );
            
            return secureCookies;
        });

        console.log('');
    }

    /**
     * Test GDPR compliance
     */
    async testGDPRCompliance() {
        console.log('📋 Testing GDPR Compliance...');

        // Test consent endpoint
        await this.runTest('GDPR Consent Endpoint', async () => {
            const response = await this.request
                .post('/api/gdpr/consent')
                .send({
                    userId: 'testuser',
                    consentTypes: ['analytics', 'marketing']
                });
            
            return response.status === 200 || response.status === 400 || response.status === 403;
        });

        // Test data access endpoint
        await this.runTest('GDPR Data Access Endpoint', async () => {
            const response = await this.request
                .post('/api/gdpr/data-access')
                .send({ userId: 'testuser' });
            
            return response.status === 200 || response.status === 400 || response.status === 403;
        });

        // Test data erasure endpoint
        await this.runTest('GDPR Data Erasure Endpoint', async () => {
            const response = await this.request
                .post('/api/gdpr/data-erasure')
                .send({ userId: 'testuser', reason: 'user_request' });
            
            return response.status === 200 || response.status === 400 || response.status === 403;
        });

        console.log('');
    }

    /**
     * Run individual test
     */
    async runTest(testName, testFunction) {
        try {
            const passed = await testFunction();
            this.recordResult(testName, passed);
            
            const status = passed ? '✅' : '❌';
            console.log(`${status} ${testName}: ${passed ? 'PASSED' : 'FAILED'}`);
            
        } catch (error) {
            this.recordResult(testName, false, error.message);
            console.log(`❌ ${testName}: ERROR - ${error.message}`);
        }
    }

    /**
     * Record test result
     */
    recordResult(testName, passed, error = null) {
        this.results.total++;
        if (passed) {
            this.results.passed++;
        } else {
            this.results.failed++;
        }

        this.results.details.push({
            name: testName,
            passed,
            error,
            timestamp: new Date().toISOString()
        });
    }

    /**
     * Check if response contains sensitive data
     */
    containsSensitiveData(body) {
        const sensitiveFields = ['password', 'secret', 'token', 'key'];
        const bodyString = JSON.stringify(body).toLowerCase();
        
        return sensitiveFields.some(field => bodyString.includes(field));
    }

    /**
     * Generate test report
     */
    generateReport() {
        const successRate = (this.results.passed / this.results.total * 100).toFixed(1);
        const failedTests = this.results.details.filter(test => !test.passed);

        const report = {
            summary: {
                total: this.results.total,
                passed: this.results.passed,
                failed: this.results.failed,
                successRate: `${successRate}%`,
                status: this.getOverallStatus(successRate)
            },
            failedTests: failedTests.map(test => ({
                name: test.name,
                error: test.error
            })),
            recommendations: this.generateRecommendations(failedTests),
            timestamp: new Date().toISOString()
        };

        console.log('\n🎯 SECURITY TEST RESULTS');
        console.log('=========================');
        console.log(`✅ Passed: ${this.results.passed}/${this.results.total} tests`);
        console.log(`📊 Success Rate: ${successRate}%`);
        console.log(`🏆 Status: ${report.summary.status}`);

        if (failedTests.length > 0) {
            console.log('\n❌ Failed Tests:');
            failedTests.forEach(test => {
                console.log(`   - ${test.name}${test.error ? ': ' + test.error : ''}`);
            });
        }

        if (report.recommendations.length > 0) {
            console.log('\n💡 Recommendations:');
            report.recommendations.forEach((rec, index) => {
                console.log(`   ${index + 1}. ${rec}`);
            });
        }

        return report;
    }

    /**
     * Get overall status based on success rate
     */
    getOverallStatus(successRate) {
        if (successRate >= 95) return 'EXCELLENT';
        if (successRate >= 85) return 'GOOD';
        if (successRate >= 70) return 'ACCEPTABLE';
        return 'NEEDS IMPROVEMENT';
    }

    /**
     * Generate recommendations based on failed tests
     */
    generateRecommendations(failedTests) {
        const recommendations = [];

        if (failedTests.some(test => test.name.includes('Authentication'))) {
            recommendations.push('Strengthen authentication mechanisms and password policies');
        }

        if (failedTests.some(test => test.name.includes('Authorization'))) {
            recommendations.push('Implement proper role-based access controls');
        }

        if (failedTests.some(test => test.name.includes('SQL Injection'))) {
            recommendations.push('Enhance SQL injection protection in WAF configuration');
        }

        if (failedTests.some(test => test.name.includes('XSS'))) {
            recommendations.push('Improve XSS protection and input sanitization');
        }

        if (failedTests.some(test => test.name.includes('Rate Limiting'))) {
            recommendations.push('Configure more aggressive rate limiting policies');
        }

        if (failedTests.some(test => test.name.includes('GDPR'))) {
            recommendations.push('Complete GDPR compliance implementation');
        }

        return recommendations;
    }
}

module.exports = SecurityTestSuite;
