const SecurityTestSuite = require('./SecurityTestSuite');
const PerformanceTestSuite = require('./PerformanceTestSuite');

/**
 * Comprehensive Test Runner
 * Orchestrates all testing suites for Crown Social Network
 */
class TestRunner {
    constructor(app) {
        this.app = app;
        this.securityTests = new SecurityTestSuite(app);
        this.performanceTests = new PerformanceTestSuite(app);
        this.results = {
            security: null,
            performance: null,
            overall: null
        };
        
        console.log('🧪 Crown Social Network Test Runner initialized');
    }

    /**
     * Run all test suites
     */
    async runAllTests(options = {}) {
        const {
            runSecurity = true,
            runPerformance = true,
            generateReport = true
        } = options;

        console.log('🚀 Starting comprehensive testing suite...\n');
        const startTime = Date.now();

        try {
            // Run security tests
            if (runSecurity) {
                console.log('🔒 PHASE 1: SECURITY TESTING');
                console.log('===============================');
                this.results.security = await this.securityTests.runAllTests();
                console.log('\n');
            }

            // Run performance tests
            if (runPerformance) {
                console.log('⚡ PHASE 2: PERFORMANCE TESTING');
                console.log('================================');
                this.results.performance = await this.performanceTests.runAllTests();
                console.log('\n');
            }

            const endTime = Date.now();
            const totalDuration = (endTime - startTime) / 1000;

            // Generate overall report
            if (generateReport) {
                this.results.overall = this.generateOverallReport(totalDuration);
                this.displayOverallReport();
            }

            return this.results;

        } catch (error) {
            console.error('❌ Test suite execution failed:', error);
            throw error;
        }
    }

    /**
     * Run only security tests
     */
    async runSecurityTests() {
        console.log('🔒 Running Security Tests Only...\n');
        
        try {
            this.results.security = await this.securityTests.runAllTests();
            return this.results.security;
        } catch (error) {
            console.error('❌ Security tests failed:', error);
            throw error;
        }
    }

    /**
     * Run only performance tests
     */
    async runPerformanceTests() {
        console.log('⚡ Running Performance Tests Only...\n');
        
        try {
            this.results.performance = await this.performanceTests.runAllTests();
            return this.results.performance;
        } catch (error) {
            console.error('❌ Performance tests failed:', error);
            throw error;
        }
    }

    /**
     * Generate overall report combining all test results
     */
    generateOverallReport(duration) {
        const report = {
            testExecutionSummary: {
                totalDuration: `${duration.toFixed(2)}s`,
                timestamp: new Date().toISOString(),
                testSuitesRun: []
            },
            securityAssessment: null,
            performanceAssessment: null,
            overallHealthScore: 0,
            productionReadiness: {
                status: 'NOT_READY',
                blockers: [],
                warnings: [],
                readinessScore: 0
            },
            recommendations: {
                critical: [],
                important: [],
                optional: []
            }
        };

        // Process security results
        if (this.results.security) {
            report.testExecutionSummary.testSuitesRun.push('Security');
            report.securityAssessment = {
                status: this.results.security.summary.status,
                successRate: this.results.security.summary.successRate,
                passedTests: this.results.security.summary.passed,
                totalTests: this.results.security.summary.total,
                criticalIssues: this.results.security.failedTests.length
            };

            // Add security recommendations
            if (this.results.security.recommendations) {
                report.recommendations.critical.push(...this.results.security.recommendations.map(r => `Security: ${r}`));
            }
        }

        // Process performance results
        if (this.results.performance) {
            report.testExecutionSummary.testSuitesRun.push('Performance');
            report.performanceAssessment = {
                status: this.results.performance.summary.status,
                successRate: this.results.performance.summary.successRate,
                passedTests: this.results.performance.summary.passedTests,
                totalTests: this.results.performance.summary.totalTests,
                averageResponseTime: this.results.performance.metrics.averageResponseTime,
                throughput: this.results.performance.metrics.throughput
            };

            // Add performance recommendations
            if (this.results.performance.recommendations) {
                report.recommendations.important.push(...this.results.performance.recommendations.map(r => `Performance: ${r}`));
            }
        }

        // Calculate overall health score
        report.overallHealthScore = this.calculateHealthScore();

        // Assess production readiness
        report.productionReadiness = this.assessProductionReadiness();

        return report;
    }

    /**
     * Calculate overall health score (0-100)
     */
    calculateHealthScore() {
        let totalScore = 0;
        let weights = 0;

        // Security score (weight: 60%)
        if (this.results.security) {
            const securityScore = parseFloat(this.results.security.summary.successRate);
            totalScore += securityScore * 0.6;
            weights += 0.6;
        }

        // Performance score (weight: 40%)
        if (this.results.performance) {
            const performanceScore = parseFloat(this.results.performance.summary.successRate);
            totalScore += performanceScore * 0.4;
            weights += 0.4;
        }

        return weights > 0 ? Math.round(totalScore / weights) : 0;
    }

    /**
     * Assess production readiness
     */
    assessProductionReadiness() {
        const assessment = {
            status: 'READY',
            blockers: [],
            warnings: [],
            readinessScore: 100
        };

        // Check security readiness
        if (this.results.security) {
            const securityRate = parseFloat(this.results.security.summary.successRate);
            
            if (securityRate < 85) {
                assessment.blockers.push('Security test success rate below 85%');
                assessment.status = 'NOT_READY';
                assessment.readinessScore -= 30;
            } else if (securityRate < 95) {
                assessment.warnings.push('Security test success rate below optimal (95%)');
                assessment.readinessScore -= 10;
            }

            // Check for critical security failures
            if (this.results.security.failedTests.some(test => 
                test.name.includes('Authentication') || 
                test.name.includes('SQL Injection') || 
                test.name.includes('XSS')
            )) {
                assessment.blockers.push('Critical security vulnerabilities detected');
                assessment.status = 'NOT_READY';
                assessment.readinessScore -= 40;
            }
        }

        // Check performance readiness
        if (this.results.performance) {
            const performanceRate = parseFloat(this.results.performance.summary.successRate);
            const avgResponseTime = this.results.performance.metrics.averageResponseTime;
            const throughput = this.results.performance.metrics.throughput;

            if (performanceRate < 80) {
                assessment.warnings.push('Performance test success rate below 80%');
                assessment.readinessScore -= 15;
            }

            if (avgResponseTime > 1000) {
                assessment.blockers.push('Average response time exceeds 1 second');
                assessment.status = 'NOT_READY';
                assessment.readinessScore -= 25;
            } else if (avgResponseTime > 500) {
                assessment.warnings.push('Average response time exceeds 500ms');
                assessment.readinessScore -= 10;
            }

            if (throughput < 5) {
                assessment.warnings.push('Throughput below 5 requests/second');
                assessment.readinessScore -= 15;
            }
        }

        // Final status determination
        if (assessment.readinessScore < 70) {
            assessment.status = 'NOT_READY';
        } else if (assessment.readinessScore < 85) {
            assessment.status = 'NEEDS_IMPROVEMENT';
        }

        assessment.readinessScore = Math.max(0, assessment.readinessScore);

        return assessment;
    }

    /**
     * Display comprehensive overall report
     */
    displayOverallReport() {
        const report = this.results.overall;

        console.log('🎯 CROWN SOCIAL NETWORK - COMPREHENSIVE TEST REPORT');
        console.log('====================================================');
        console.log(`📅 Executed: ${new Date(report.testExecutionSummary.timestamp).toLocaleString()}`);
        console.log(`⏱️  Duration: ${report.testExecutionSummary.totalDuration}`);
        console.log(`🧪 Test Suites: ${report.testExecutionSummary.testSuitesRun.join(', ')}`);
        console.log('');

        // Security Assessment
        if (report.securityAssessment) {
            console.log('🔒 SECURITY ASSESSMENT');
            console.log('----------------------');
            console.log(`Status: ${this.getStatusEmoji(report.securityAssessment.status)} ${report.securityAssessment.status}`);
            console.log(`Success Rate: ${report.securityAssessment.successRate}`);
            console.log(`Tests: ${report.securityAssessment.passedTests}/${report.securityAssessment.totalTests} passed`);
            console.log(`Critical Issues: ${report.securityAssessment.criticalIssues}`);
            console.log('');
        }

        // Performance Assessment
        if (report.performanceAssessment) {
            console.log('⚡ PERFORMANCE ASSESSMENT');
            console.log('-------------------------');
            console.log(`Status: ${this.getStatusEmoji(report.performanceAssessment.status)} ${report.performanceAssessment.status}`);
            console.log(`Success Rate: ${report.performanceAssessment.successRate}`);
            console.log(`Tests: ${report.performanceAssessment.passedTests}/${report.performanceAssessment.totalTests} passed`);
            console.log(`Avg Response Time: ${report.performanceAssessment.averageResponseTime}ms`);
            console.log(`Throughput: ${report.performanceAssessment.throughput} req/sec`);
            console.log('');
        }

        // Overall Health Score
        console.log('🏥 OVERALL HEALTH SCORE');
        console.log('------------------------');
        console.log(`Score: ${this.getHealthEmoji(report.overallHealthScore)} ${report.overallHealthScore}/100`);
        console.log(`Grade: ${this.getHealthGrade(report.overallHealthScore)}`);
        console.log('');

        // Production Readiness
        console.log('🚀 PRODUCTION READINESS');
        console.log('------------------------');
        console.log(`Status: ${this.getReadinessEmoji(report.productionReadiness.status)} ${report.productionReadiness.status}`);
        console.log(`Readiness Score: ${report.productionReadiness.readinessScore}/100`);
        
        if (report.productionReadiness.blockers.length > 0) {
            console.log('🚫 Blockers:');
            report.productionReadiness.blockers.forEach(blocker => {
                console.log(`   - ${blocker}`);
            });
        }

        if (report.productionReadiness.warnings.length > 0) {
            console.log('⚠️  Warnings:');
            report.productionReadiness.warnings.forEach(warning => {
                console.log(`   - ${warning}`);
            });
        }

        // Recommendations
        if (report.recommendations.critical.length > 0 || 
            report.recommendations.important.length > 0 || 
            report.recommendations.optional.length > 0) {
            
            console.log('\n💡 RECOMMENDATIONS');
            console.log('-------------------');
            
            if (report.recommendations.critical.length > 0) {
                console.log('🔴 Critical:');
                report.recommendations.critical.forEach(rec => {
                    console.log(`   - ${rec}`);
                });
            }

            if (report.recommendations.important.length > 0) {
                console.log('🟡 Important:');
                report.recommendations.important.forEach(rec => {
                    console.log(`   - ${rec}`);
                });
            }

            if (report.recommendations.optional.length > 0) {
                console.log('🔵 Optional:');
                report.recommendations.optional.forEach(rec => {
                    console.log(`   - ${rec}`);
                });
            }
        }

        console.log('\n' + '='.repeat(52));
        console.log(`🎉 Testing Complete - Overall Score: ${report.overallHealthScore}/100`);
    }

    /**
     * Helper methods for display formatting
     */
    getStatusEmoji(status) {
        const emojis = {
            'EXCELLENT': '🟢',
            'GOOD': '🟡',
            'ACCEPTABLE': '🟠',
            'NEEDS_IMPROVEMENT': '🔴',
            'NEEDS_OPTIMIZATION': '🔴'
        };
        return emojis[status] || '⚫';
    }

    getHealthEmoji(score) {
        if (score >= 95) return '💚';
        if (score >= 85) return '💛';
        if (score >= 70) return '🧡';
        return '❤️';
    }

    getHealthGrade(score) {
        if (score >= 95) return 'A+';
        if (score >= 90) return 'A';
        if (score >= 85) return 'B+';
        if (score >= 80) return 'B';
        if (score >= 70) return 'C';
        return 'D';
    }

    getReadinessEmoji(status) {
        const emojis = {
            'READY': '✅',
            'NEEDS_IMPROVEMENT': '⚠️',
            'NOT_READY': '❌'
        };
        return emojis[status] || '⚫';
    }

    /**
     * Save test results to file
     */
    async saveResults(filePath = './test-results.json') {
        const fs = require('fs').promises;
        
        try {
            await fs.writeFile(filePath, JSON.stringify(this.results, null, 2));
            console.log(`📄 Test results saved to ${filePath}`);
        } catch (error) {
            console.error('❌ Failed to save test results:', error);
        }
    }
}

module.exports = TestRunner;
