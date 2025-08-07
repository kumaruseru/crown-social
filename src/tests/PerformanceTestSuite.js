const jest = require('jest');
const supertest = require('supertest');

/**
 * Performance Test Suite
 * Comprehensive performance testing for Crown Social Network
 */
class PerformanceTestSuite {
    constructor(app) {
        this.app = app;
        this.request = supertest(app);
        this.results = {
            tests: [],
            metrics: {
                averageResponseTime: 0,
                maxResponseTime: 0,
                minResponseTime: Infinity,
                throughput: 0,
                errorRate: 0
            }
        };
        
        console.log('⚡ Performance Test Suite initialized');
    }

    /**
     * Run all performance tests
     */
    async runAllTests() {
        console.log('🚀 Starting performance tests...\n');

        try {
            await this.testResponseTimes();
            await this.testThroughput();
            await this.testLoadHandling();
            await this.testMemoryUsage();
            await this.testDatabasePerformance();
            await this.testCachingEfficiency();
            
            return this.generateReport();

        } catch (error) {
            console.error('❌ Performance test suite failed:', error);
            throw error;
        }
    }

    /**
     * Test response times for different endpoints
     */
    async testResponseTimes() {
        console.log('⏱️  Testing Response Times...');

        const endpoints = [
            { method: 'GET', path: '/', name: 'Home Page' },
            { method: 'GET', path: '/api/news', name: 'News API' },
            { method: 'GET', path: '/login', name: 'Login Page' },
            { method: 'GET', path: '/api/health', name: 'Health Check' },
            { method: 'GET', path: '/explore', name: 'Explore Page' }
        ];

        for (const endpoint of endpoints) {
            await this.measureResponseTime(endpoint.name, async () => {
                const response = await this.request[endpoint.method.toLowerCase()](endpoint.path);
                return response;
            });
        }

        console.log('');
    }

    /**
     * Test system throughput under concurrent requests
     */
    async testThroughput() {
        console.log('🔄 Testing Throughput...');

        const concurrentRequests = 50;
        const startTime = Date.now();
        const promises = [];

        for (let i = 0; i < concurrentRequests; i++) {
            promises.push(this.request.get('/api/health'));
        }

        try {
            const responses = await Promise.all(promises);
            const endTime = Date.now();
            const duration = (endTime - startTime) / 1000; // seconds
            
            const successfulRequests = responses.filter(r => r.status < 400).length;
            const throughput = successfulRequests / duration;
            const errorRate = (responses.length - successfulRequests) / responses.length;

            this.results.metrics.throughput = throughput;
            this.results.metrics.errorRate = errorRate;

            console.log(`✅ Throughput Test: ${throughput.toFixed(2)} req/sec`);
            console.log(`📊 Error Rate: ${(errorRate * 100).toFixed(2)}%`);

            this.results.tests.push({
                name: 'Throughput Test',
                metric: 'requests/second',
                value: throughput,
                benchmark: 10, // Target: 10 req/sec minimum
                passed: throughput >= 10
            });

        } catch (error) {
            console.log(`❌ Throughput Test Failed: ${error.message}`);
            this.results.tests.push({
                name: 'Throughput Test',
                metric: 'requests/second',
                value: 0,
                benchmark: 10,
                passed: false,
                error: error.message
            });
        }

        console.log('');
    }

    /**
     * Test load handling capabilities
     */
    async testLoadHandling() {
        console.log('🏋️  Testing Load Handling...');

        const testScenarios = [
            { name: 'Light Load', concurrent: 10, duration: 5000 },
            { name: 'Medium Load', concurrent: 25, duration: 3000 },
            { name: 'Heavy Load', concurrent: 50, duration: 2000 }
        ];

        for (const scenario of testScenarios) {
            await this.runLoadTest(scenario);
        }

        console.log('');
    }

    /**
     * Test memory usage patterns
     */
    async testMemoryUsage() {
        console.log('🧠 Testing Memory Usage...');

        const initialMemory = process.memoryUsage();
        
        // Simulate memory-intensive operations
        const promises = [];
        for (let i = 0; i < 20; i++) {
            promises.push(this.request.get('/api/news'));
        }

        await Promise.all(promises);
        
        // Force garbage collection if available
        if (global.gc) {
            global.gc();
        }

        const finalMemory = process.memoryUsage();
        const memoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed;
        const memoryMB = memoryIncrease / 1024 / 1024;

        console.log(`📊 Memory Usage Increase: ${memoryMB.toFixed(2)} MB`);

        this.results.tests.push({
            name: 'Memory Usage Test',
            metric: 'MB increase',
            value: memoryMB,
            benchmark: 50, // Target: Less than 50MB increase
            passed: memoryMB < 50
        });

        console.log('');
    }

    /**
     * Test database performance
     */
    async testDatabasePerformance() {
        console.log('🗄️  Testing Database Performance...');

        // Test database-heavy endpoints
        const dbEndpoints = [
            { path: '/api/news', name: 'News Query' },
            { path: '/api/search?q=test', name: 'Search Query' }
        ];

        for (const endpoint of dbEndpoints) {
            await this.measureResponseTime(endpoint.name, async () => {
                const response = await this.request.get(endpoint.path);
                return response;
            }, 1000); // 1 second benchmark for DB queries
        }

        console.log('');
    }

    /**
     * Test caching efficiency
     */
    async testCachingEfficiency() {
        console.log('🗂️  Testing Caching Efficiency...');

        const testEndpoint = '/api/news';
        
        // First request (cache miss)
        const firstResponse = await this.measureResponseTime('First Request (Cache Miss)', async () => {
            return await this.request.get(testEndpoint);
        });

        // Second request (should be cached)
        const secondResponse = await this.measureResponseTime('Second Request (Cache Hit)', async () => {
            return await this.request.get(testEndpoint);
        });

        // Calculate cache efficiency
        const firstTime = firstResponse.responseTime;
        const secondTime = secondResponse.responseTime;
        const improvement = ((firstTime - secondTime) / firstTime) * 100;

        console.log(`📈 Cache Improvement: ${improvement.toFixed(1)}%`);

        this.results.tests.push({
            name: 'Cache Efficiency',
            metric: 'improvement %',
            value: improvement,
            benchmark: 20, // Target: 20% improvement
            passed: improvement >= 20
        });

        console.log('');
    }

    /**
     * Run load test scenario
     */
    async runLoadTest(scenario) {
        console.log(`🎯 Testing ${scenario.name} (${scenario.concurrent} concurrent users)...`);

        const startTime = Date.now();
        let completedRequests = 0;
        let errorCount = 0;

        const interval = setInterval(async () => {
            const promises = [];
            for (let i = 0; i < scenario.concurrent; i++) {
                promises.push(
                    this.request.get('/api/health')
                        .then(response => {
                            completedRequests++;
                            if (response.status >= 400) errorCount++;
                        })
                        .catch(error => {
                            errorCount++;
                            completedRequests++;
                        })
                );
            }
            await Promise.all(promises);
        }, 500); // Send requests every 500ms

        // Wait for test duration
        await new Promise(resolve => setTimeout(resolve, scenario.duration));
        clearInterval(interval);

        const endTime = Date.now();
        const duration = (endTime - startTime) / 1000;
        const throughput = completedRequests / duration;
        const errorRate = errorCount / completedRequests;

        console.log(`   📊 Throughput: ${throughput.toFixed(2)} req/sec`);
        console.log(`   ❌ Error Rate: ${(errorRate * 100).toFixed(2)}%`);

        this.results.tests.push({
            name: scenario.name,
            metric: 'requests/second',
            value: throughput,
            benchmark: scenario.concurrent * 0.5, // Target: 50% of concurrent users per second
            passed: throughput >= (scenario.concurrent * 0.5) && errorRate < 0.05
        });
    }

    /**
     * Measure response time for a request
     */
    async measureResponseTime(testName, requestFunction, benchmark = 500) {
        const startTime = Date.now();
        
        try {
            const response = await requestFunction();
            const endTime = Date.now();
            const responseTime = endTime - startTime;

            // Update metrics
            this.results.metrics.maxResponseTime = Math.max(this.results.metrics.maxResponseTime, responseTime);
            this.results.metrics.minResponseTime = Math.min(this.results.metrics.minResponseTime, responseTime);

            console.log(`   ⏱️  ${testName}: ${responseTime}ms`);

            this.results.tests.push({
                name: testName,
                metric: 'response time (ms)',
                value: responseTime,
                benchmark: benchmark,
                passed: responseTime <= benchmark
            });

            return { response, responseTime };

        } catch (error) {
            console.log(`   ❌ ${testName}: ERROR - ${error.message}`);
            
            this.results.tests.push({
                name: testName,
                metric: 'response time (ms)',
                value: 0,
                benchmark: benchmark,
                passed: false,
                error: error.message
            });

            return { response: null, responseTime: 0 };
        }
    }

    /**
     * Generate performance report
     */
    generateReport() {
        const responseTimes = this.results.tests
            .filter(test => test.metric === 'response time (ms)' && test.value > 0)
            .map(test => test.value);

        if (responseTimes.length > 0) {
            this.results.metrics.averageResponseTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
        }

        const passedTests = this.results.tests.filter(test => test.passed).length;
        const totalTests = this.results.tests.length;
        const successRate = (passedTests / totalTests * 100).toFixed(1);

        const report = {
            summary: {
                totalTests: totalTests,
                passedTests: passedTests,
                successRate: `${successRate}%`,
                status: this.getPerformanceStatus(successRate)
            },
            metrics: {
                averageResponseTime: Math.round(this.results.metrics.averageResponseTime),
                maxResponseTime: this.results.metrics.maxResponseTime,
                minResponseTime: this.results.metrics.minResponseTime === Infinity ? 0 : this.results.metrics.minResponseTime,
                throughput: Math.round(this.results.metrics.throughput * 100) / 100,
                errorRate: `${(this.results.metrics.errorRate * 100).toFixed(2)}%`
            },
            failedTests: this.results.tests.filter(test => !test.passed),
            recommendations: this.generatePerformanceRecommendations(),
            timestamp: new Date().toISOString()
        };

        console.log('\n⚡ PERFORMANCE TEST RESULTS');
        console.log('============================');
        console.log(`✅ Passed: ${passedTests}/${totalTests} tests`);
        console.log(`📊 Success Rate: ${successRate}%`);
        console.log(`🏆 Status: ${report.summary.status}`);
        console.log(`⏱️  Average Response Time: ${report.metrics.averageResponseTime}ms`);
        console.log(`🚀 Throughput: ${report.metrics.throughput} req/sec`);
        console.log(`❌ Error Rate: ${report.metrics.errorRate}`);

        if (report.failedTests.length > 0) {
            console.log('\n❌ Failed Tests:');
            report.failedTests.forEach(test => {
                console.log(`   - ${test.name}: ${test.value}${test.metric.includes('ms') ? 'ms' : ''} (benchmark: ${test.benchmark}${test.metric.includes('ms') ? 'ms' : ''})`);
            });
        }

        if (report.recommendations.length > 0) {
            console.log('\n💡 Performance Recommendations:');
            report.recommendations.forEach((rec, index) => {
                console.log(`   ${index + 1}. ${rec}`);
            });
        }

        return report;
    }

    /**
     * Get performance status based on success rate
     */
    getPerformanceStatus(successRate) {
        if (successRate >= 90) return 'EXCELLENT';
        if (successRate >= 80) return 'GOOD';
        if (successRate >= 70) return 'ACCEPTABLE';
        return 'NEEDS OPTIMIZATION';
    }

    /**
     * Generate performance recommendations
     */
    generatePerformanceRecommendations() {
        const recommendations = [];
        const failedTests = this.results.tests.filter(test => !test.passed);

        if (this.results.metrics.averageResponseTime > 500) {
            recommendations.push('Optimize slow endpoints - average response time exceeds 500ms');
        }

        if (this.results.metrics.throughput < 10) {
            recommendations.push('Improve server throughput - current throughput below 10 req/sec');
        }

        if (this.results.metrics.errorRate > 0.05) {
            recommendations.push('Reduce error rate - currently above 5% threshold');
        }

        if (failedTests.some(test => test.name.includes('Cache'))) {
            recommendations.push('Optimize caching strategy - cache efficiency below target');
        }

        if (failedTests.some(test => test.name.includes('Memory'))) {
            recommendations.push('Optimize memory usage - excessive memory consumption detected');
        }

        if (failedTests.some(test => test.name.includes('Database'))) {
            recommendations.push('Optimize database queries - slow database performance detected');
        }

        return recommendations;
    }
}

module.exports = PerformanceTestSuite;
