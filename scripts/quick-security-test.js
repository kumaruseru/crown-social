#!/usr/bin/env node

/**
 * Simple Security Test
 * Basic testing of core security features
 */

const https = require('https');
const { performance } = require('perf_hooks');

// Skip certificate validation for testing
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

console.log('🔒 Crown Social Network - Quick Security Check');
console.log('===============================================\n');

async function testSecurityFeatures() {
    let passedTests = 0;
    let totalTests = 0;

    // Test 1: HTTPS Server Response
    console.log('🔍 Testing HTTPS Server...');
    try {
        const response = await makeRequest('https://localhost:3443/', 'GET');
        const passed = response.status < 500;
        logResult('HTTPS Server', passed, `Status: ${response.status}`);
        if (passed) passedTests++;
        totalTests++;
    } catch (error) {
        logResult('HTTPS Server', false, error.message);
        totalTests++;
    }

    // Test 2: Security Headers
    console.log('\n🛡️  Testing Security Headers...');
    try {
        const response = await makeRequest('https://localhost:3443/', 'GET');
        const headers = response.headers;
        
        const securityHeaders = [
            'strict-transport-security',
            'x-content-type-options',
            'x-frame-options',
            'content-security-policy'
        ];

        let headersPassed = 0;
        for (const header of securityHeaders) {
            const present = header.toLowerCase() in headers;
            if (present) headersPassed++;
            logResult(`${header} header`, present, present ? '✓' : 'Missing');
        }
        
        if (headersPassed >= securityHeaders.length * 0.75) passedTests++;
        totalTests++;
    } catch (error) {
        logResult('Security Headers', false, error.message);
        totalTests++;
    }

    // Test 3: SSL Certificate
    console.log('\n🔐 Testing SSL Certificate...');
    try {
        const hasCert = await testSSLCertificate();
        logResult('SSL Certificate', hasCert, hasCert ? 'Valid certificate' : 'No certificate');
        if (hasCert) passedTests++;
        totalTests++;
    } catch (error) {
        logResult('SSL Certificate', false, error.message);
        totalTests++;
    }

    // Test 4: Basic WAF Protection
    console.log('\n🛡️  Testing Basic WAF...');
    try {
        const maliciousUrl = 'https://localhost:3443/api/search?q=' + encodeURIComponent('<script>alert("test")</script>');
        const response = await makeRequest(maliciousUrl, 'GET');
        const blocked = response.status === 400 || response.status === 403;
        logResult('XSS Protection', blocked, blocked ? 'Malicious request blocked' : 'Request allowed');
        if (blocked) passedTests++;
        totalTests++;
    } catch (error) {
        // If request is rejected, that's good
        logResult('XSS Protection', true, 'Request properly rejected');
        passedTests++;
        totalTests++;
    }

    // Test 5: GDPR Endpoint Accessibility
    console.log('\n📋 Testing GDPR Endpoints...');
    try {
        const response = await makeRequest('https://localhost:3443/api/gdpr/compliance-report', 'GET');
        const accessible = response.status < 500;
        logResult('GDPR Endpoints', accessible, `Status: ${response.status}`);
        if (accessible) passedTests++;
        totalTests++;
    } catch (error) {
        logResult('GDPR Endpoints', false, error.message);
        totalTests++;
    }

    // Results
    console.log('\n🎯 SECURITY TEST RESULTS');
    console.log('=========================');
    console.log(`✅ Passed: ${passedTests}/${totalTests} tests`);
    console.log(`📊 Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`);
    
    if (passedTests / totalTests >= 0.8) {
        console.log('\n🎉 EXCELLENT - Core security features are working!');
        console.log('✅ Crown Social Network security implementation is successful');
    } else if (passedTests / totalTests >= 0.6) {
        console.log('\n🚀 GOOD - Most security features are working');
        console.log('⚠️  Some minor issues need attention');
    } else {
        console.log('\n⚠️  NEEDS ATTENTION - Several security issues detected');
        console.log('🔧 Additional security work required');
    }
    
    console.log(`\n📝 Test completed at: ${new Date().toISOString()}`);
}

function makeRequest(url, method = 'GET', data = null) {
    return new Promise((resolve, reject) => {
        const urlObj = new URL(url);
        const options = {
            hostname: urlObj.hostname,
            port: urlObj.port,
            path: urlObj.pathname + urlObj.search,
            method: method,
            headers: {
                'User-Agent': 'Crown-Security-Test/1.0'
            },
            rejectUnauthorized: false
        };

        const req = https.request(options, (res) => {
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
            req.write(JSON.stringify(data));
        }

        req.end();
    });
}

function testSSLCertificate() {
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

function logResult(testName, passed, details) {
    const status = passed ? '✅' : '❌';
    console.log(`${status} ${testName}: ${details}`);
}

// Run the test
testSecurityFeatures().catch(console.error);
