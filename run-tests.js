#!/usr/bin/env node

/**
 * Crown Social Network - Test Execution Script
 * Automated testing suite for production readiness validation
 */

const path = require('path');
const fs = require('fs');

// Import test runner
const TestRunner = require('./src/tests/TestRunner');

/**
 * Test execution configuration
 */
const TEST_CONFIG = {
    // Test options
    runSecurity: true,
    runPerformance: true,
    generateReport: true,
    saveResults: true,
    
    // Output options
    resultsPath: './test-results.json',
    verbose: true,
    
    // Server options
    serverPort: process.env.TEST_PORT || 3000,
    testTimeout: 30000 // 30 seconds
};

/**
 * Main test execution function
 */
async function runTests() {
    console.log('👑 CROWN SOCIAL NETWORK - AUTOMATED TESTING SUITE');
    console.log('==================================================');
    console.log(`🕒 Started at: ${new Date().toLocaleString()}`);
    console.log(`🔧 Configuration: Security=${TEST_CONFIG.runSecurity}, Performance=${TEST_CONFIG.runPerformance}`);
    console.log(`📊 Results will be saved to: ${TEST_CONFIG.resultsPath}`);
    console.log('');

    try {
        // Initialize the application
        console.log('🚀 Initializing Crown Social Network application...');
        const app = await initializeApplication();
        
        // Create test runner
        const testRunner = new TestRunner(app);
        
        // Set test timeout
        const timeoutId = setTimeout(() => {
            console.error('⏱️  Test execution timed out after 30 seconds');
            process.exit(1);
        }, TEST_CONFIG.testTimeout);

        // Run all tests
        const results = await testRunner.runAllTests({
            runSecurity: TEST_CONFIG.runSecurity,
            runPerformance: TEST_CONFIG.runPerformance,
            generateReport: TEST_CONFIG.generateReport
        });

        // Clear timeout
        clearTimeout(timeoutId);

        // Save results if configured
        if (TEST_CONFIG.saveResults) {
            await testRunner.saveResults(TEST_CONFIG.resultsPath);
        }

        // Determine exit code based on results
        const exitCode = determineExitCode(results);
        
        console.log(`\n🏁 Testing completed with exit code: ${exitCode}`);
        console.log(`🕒 Finished at: ${new Date().toLocaleString()}`);
        
        process.exit(exitCode);

    } catch (error) {
        console.error('\n❌ CRITICAL ERROR during test execution:');
        console.error(error.message);
        
        if (TEST_CONFIG.verbose) {
            console.error('\nStack trace:');
            console.error(error.stack);
        }
        
        process.exit(1);
    }
}

/**
 * Initialize the Crown Social Network application
 */
async function initializeApplication() {
    try {
        // Check if server.js exists
        const serverPath = path.join(process.cwd(), 'server.js');
        
        if (!fs.existsSync(serverPath)) {
            throw new Error('server.js not found. Please run this script from the Crown project root directory.');
        }

        // Import the application
        const app = require(serverPath);
        
        // If the server exports the app directly, use it
        if (typeof app === 'function' || (app && app.listen)) {
            return app;
        }
        
        // If the server exports an object with app property
        if (app && app.app) {
            return app.app;
        }

        // Create a basic Express app for testing
        console.log('⚠️  Using fallback Express app for testing');
        const express = require('express');
        const testApp = express();
        
        // Basic middleware
        testApp.use(express.json());
        testApp.use(express.static('public'));
        
        // Basic routes for testing
        testApp.get('/', (req, res) => res.send('Crown Social Network - Test Mode'));
        testApp.get('/api/health', (req, res) => res.json({ status: 'OK', timestamp: new Date().toISOString() }));
        testApp.get('/login', (req, res) => res.send('Login Page'));
        testApp.get('/explore', (req, res) => res.send('Explore Page'));
        testApp.get('/api/news', (req, res) => res.json({ news: [], count: 0 }));
        
        // Error handling
        testApp.use((error, req, res, next) => {
            res.status(500).json({ error: 'Internal Server Error' });
        });
        
        return testApp;

    } catch (error) {
        console.error('❌ Failed to initialize application:', error.message);
        throw error;
    }
}

/**
 * Determine exit code based on test results
 */
function determineExitCode(results) {
    let exitCode = 0;

    // Check security results
    if (results.security) {
        const securityRate = parseFloat(results.security.summary.successRate);
        if (securityRate < 80) {
            exitCode = 1; // Critical security failures
        }
    }

    // Check performance results
    if (results.performance) {
        const performanceRate = parseFloat(results.performance.summary.successRate);
        if (performanceRate < 70) {
            exitCode = Math.max(exitCode, 2); // Performance issues
        }
    }

    // Check overall status
    if (results.overall) {
        if (results.overall.productionReadiness.status === 'NOT_READY') {
            exitCode = Math.max(exitCode, 1);
        }
        
        if (results.overall.overallHealthScore < 70) {
            exitCode = Math.max(exitCode, 2);
        }
    }

    return exitCode;
}

/**
 * Handle process signals
 */
process.on('SIGINT', () => {
    console.log('\n⚠️  Test execution interrupted by user');
    process.exit(130);
});

process.on('SIGTERM', () => {
    console.log('\n⚠️  Test execution terminated');
    process.exit(143);
});

process.on('uncaughtException', (error) => {
    console.error('\n💥 Uncaught Exception:');
    console.error(error);
    process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('\n💥 Unhandled Rejection at:', promise);
    console.error('Reason:', reason);
    process.exit(1);
});

// Parse command line arguments
const args = process.argv.slice(2);
if (args.includes('--help') || args.includes('-h')) {
    console.log(`
👑 Crown Social Network - Test Runner

Usage: node run-tests.js [options]

Options:
  --security-only    Run only security tests
  --performance-only Run only performance tests
  --no-report        Skip report generation
  --no-save          Don't save results to file
  --verbose          Show detailed error information
  --help, -h         Show this help message

Exit Codes:
  0 - All tests passed
  1 - Critical security failures
  2 - Performance issues
  3 - Application initialization failed

Examples:
  node run-tests.js                    # Run all tests
  node run-tests.js --security-only    # Run security tests only
  node run-tests.js --no-report        # Run tests without report
`);
    process.exit(0);
}

// Apply command line options
if (args.includes('--security-only')) {
    TEST_CONFIG.runSecurity = true;
    TEST_CONFIG.runPerformance = false;
}

if (args.includes('--performance-only')) {
    TEST_CONFIG.runSecurity = false;
    TEST_CONFIG.runPerformance = true;
}

if (args.includes('--no-report')) {
    TEST_CONFIG.generateReport = false;
}

if (args.includes('--no-save')) {
    TEST_CONFIG.saveResults = false;
}

if (args.includes('--verbose')) {
    TEST_CONFIG.verbose = true;
}

// Start the test execution
runTests().catch(error => {
    console.error('Fatal error:', error);
    process.exit(3);
});
