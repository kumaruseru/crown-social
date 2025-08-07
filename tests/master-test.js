#!/usr/bin/env node

/**
 * Crown Social Network - Master Test Suite
 * Runs comprehensive conflict detection and stress testing
 */

const ConflictChecker = require('./conflict-checker');
const StressTest = require('./stress-test');
const { execSync } = require('child_process');

class MasterTestSuite {
    constructor() {
        this.results = {
            conflicts: null,
            stressTest: null,
            overall: 'PENDING'
        };
    }

    async runFullTestSuite() {
        console.log('🏆 Crown Social Network - Master Test Suite');
        console.log('🚀 Running comprehensive system analysis...');
        console.log('═'.repeat(70));
        
        const startTime = Date.now();
        
        try {
            // Phase 1: Pre-flight checks
            await this.preflightChecks();
            
            // Phase 2: Conflict Detection
            console.log('\n🔍 PHASE 1: CONFLICT DETECTION');
            console.log('─'.repeat(50));
            await this.runConflictDetection();
            
            // Phase 3: Stress Testing (only if no critical conflicts)
            if (this.shouldRunStressTest()) {
                console.log('\n🔥 PHASE 2: STRESS TESTING');
                console.log('─'.repeat(50));
                await this.runStressTest();
            } else {
                console.log('\n⚠️ PHASE 2: STRESS TESTING SKIPPED');
                console.log('   Reason: Critical conflicts must be resolved first');
            }
            
            // Phase 4: Generate comprehensive report
            const duration = Date.now() - startTime;
            this.generateMasterReport(duration);
            
        } catch (error) {
            console.error('💥 Master test suite failed:', error);
            this.results.overall = 'FAILED';
            throw error;
        }
    }

    async preflightChecks() {
        console.log('✈️ Pre-flight System Checks');
        console.log('─'.repeat(30));
        
        // Check Node.js version
        try {
            const nodeVersion = process.version;
            console.log(`📦 Node.js: ${nodeVersion}`);
            
            if (parseInt(nodeVersion.slice(1)) < 16) {
                console.log('⚠️ Warning: Node.js 16+ recommended');
            }
        } catch (error) {
            console.log('❌ Could not check Node.js version');
        }
        
        // Check if server is running
        try {
            const processes = execSync('netstat -ano | findstr :3000', { encoding: 'utf8' });
            if (processes.trim()) {
                console.log('🟢 Server: Running on port 3000');
            } else {
                console.log('🟡 Server: Not running (some tests may fail)');
            }
        } catch (error) {
            console.log('🟡 Server: Status unknown');
        }
        
        // Check memory availability
        const memoryUsage = process.memoryUsage();
        const freeMemory = (memoryUsage.external / 1024 / 1024).toFixed(2);
        console.log(`🧠 Memory: ${freeMemory}MB external`);
        
        // Check disk space (simplified)
        try {
            const stats = require('fs').statSync(process.cwd());
            console.log('💾 Disk: Accessible');
        } catch (error) {
            console.log('❌ Disk: Access error');
        }
        
        console.log('✅ Pre-flight checks completed\n');
    }

    async runConflictDetection() {
        try {
            const conflictChecker = new ConflictChecker();
            await conflictChecker.checkAllConflicts();
            
            this.results.conflicts = {
                criticalIssues: conflictChecker.criticalIssues.length,
                conflicts: conflictChecker.conflicts.length,
                warnings: conflictChecker.warnings.length,
                status: this.getConflictStatus(conflictChecker)
            };
            
            console.log(`\n📊 Conflict Detection Summary:
   🚨 Critical: ${this.results.conflicts.criticalIssues}
   ⚔️ Conflicts: ${this.results.conflicts.conflicts}
   ⚠️ Warnings: ${this.results.conflicts.warnings}
   📈 Status: ${this.results.conflicts.status}`);
            
        } catch (error) {
            console.error('❌ Conflict detection failed:', error.message);
            this.results.conflicts = { status: 'FAILED', error: error.message };
        }
    }

    async runStressTest() {
        try {
            const stressTest = new StressTest();
            const results = await stressTest.runAllTests();
            
            this.results.stressTest = {
                passed: results.passed,
                failed: results.failed,
                successRate: results.successRate,
                concurrentUserRate: results.concurrentUserRate,
                totalTime: results.totalTime,
                status: this.getStressTestStatus(results.successRate)
            };
            
            console.log(`\n📊 Stress Test Summary:
   ✅ Passed: ${this.results.stressTest.passed}
   ❌ Failed: ${this.results.stressTest.failed}
   📈 Success Rate: ${this.results.stressTest.successRate}%
   🎯 Status: ${this.results.stressTest.status}`);
            
        } catch (error) {
            console.error('❌ Stress test failed:', error.message);
            this.results.stressTest = { status: 'FAILED', error: error.message };
        }
    }

    shouldRunStressTest() {
        if (!this.results.conflicts) return false;
        return this.results.conflicts.criticalIssues === 0 && 
               this.results.conflicts.conflicts === 0;
    }

    getConflictStatus(checker) {
        const totalCritical = checker.criticalIssues.length;
        const totalConflicts = checker.conflicts.length;
        const totalWarnings = checker.warnings.length;
        
        if (totalCritical > 0) return 'CRITICAL';
        if (totalConflicts > 0) return 'CONFLICTS';
        if (totalWarnings > 5) return 'WARNINGS';
        if (totalWarnings > 0) return 'MINOR_ISSUES';
        return 'CLEAN';
    }

    getStressTestStatus(successRate) {
        if (successRate >= 95) return 'EXCELLENT';
        if (successRate >= 85) return 'GOOD';
        if (successRate >= 70) return 'MODERATE';
        if (successRate >= 50) return 'POOR';
        return 'CRITICAL';
    }

    generateMasterReport(duration) {
        console.log('\n🏆 MASTER TEST SUITE REPORT');
        console.log('═'.repeat(70));
        
        // Overall status
        this.results.overall = this.calculateOverallStatus();
        
        console.log(`⏱️ Total Duration: ${(duration / 1000).toFixed(2)} seconds`);
        console.log(`🎯 Overall Status: ${this.getStatusEmoji(this.results.overall)} ${this.results.overall}`);
        
        console.log('\n📋 DETAILED RESULTS:');
        console.log('─'.repeat(40));
        
        // Conflict Results
        if (this.results.conflicts) {
            console.log(`🔍 Conflict Detection: ${this.getStatusEmoji(this.results.conflicts.status)} ${this.results.conflicts.status}`);
            console.log(`   Critical Issues: ${this.results.conflicts.criticalIssues || 0}`);
            console.log(`   Conflicts: ${this.results.conflicts.conflicts || 0}`);
            console.log(`   Warnings: ${this.results.conflicts.warnings || 0}`);
        }
        
        // Stress Test Results
        if (this.results.stressTest) {
            console.log(`🔥 Stress Test: ${this.getStatusEmoji(this.results.stressTest.status)} ${this.results.stressTest.status}`);
            console.log(`   Success Rate: ${this.results.stressTest.successRate}%`);
            console.log(`   Tests Passed: ${this.results.stressTest.passed}`);
            console.log(`   Tests Failed: ${this.results.stressTest.failed}`);
            
            if (this.results.stressTest.performance) {
                console.log('   Key Performance Metrics:');
                Object.entries(this.results.stressTest.performance).slice(0, 5).forEach(([key, value]) => {
                    console.log(`     ${key}: ${value}${typeof value === 'number' ? 'ms' : ''}`);
                });
            }
        } else {
            console.log('🔥 Stress Test: ⏭️ SKIPPED (Due to conflicts)');
        }
        
        console.log('\n🎯 DEPLOYMENT READINESS:');
        console.log('─'.repeat(30));
        
        const deploymentReadiness = this.assessDeploymentReadiness();
        console.log(`📊 Readiness Score: ${deploymentReadiness.score}%`);
        console.log(`🚦 Deployment Status: ${this.getStatusEmoji(deploymentReadiness.status)} ${deploymentReadiness.status}`);
        
        console.log('\n💡 RECOMMENDATIONS:');
        console.log('─'.repeat(25));
        
        const recommendations = this.generateRecommendations();
        recommendations.forEach((rec, index) => {
            console.log(`${index + 1}. ${rec}`);
        });
        
        console.log('\n🔧 NEXT ACTIONS:');
        console.log('─'.repeat(20));
        
        const nextActions = this.generateNextActions();
        nextActions.forEach((action, index) => {
            console.log(`${index + 1}. ${action}`);
        });
        
        console.log('\n📈 SYSTEM HEALTH SUMMARY:');
        console.log('─'.repeat(30));
        
        const healthSummary = this.generateHealthSummary();
        console.log(healthSummary);
        
        console.log('═'.repeat(70));
        console.log('🎉 Master Test Suite Complete!');
        console.log(`📊 Final Status: ${this.getStatusEmoji(this.results.overall)} ${this.results.overall}`);
        console.log('═'.repeat(70));
    }

    calculateOverallStatus() {
        if (this.results.conflicts && this.results.conflicts.status === 'CRITICAL') {
            return 'CRITICAL';
        }
        
        if (this.results.conflicts && this.results.conflicts.status === 'CONFLICTS') {
            return 'NEEDS_ATTENTION';
        }
        
        if (this.results.stressTest) {
            if (this.results.stressTest.status === 'EXCELLENT') {
                return this.results.conflicts.status === 'CLEAN' ? 'EXCELLENT' : 'GOOD';
            }
            if (this.results.stressTest.status === 'GOOD') {
                return 'GOOD';
            }
            if (this.results.stressTest.status === 'MODERATE') {
                return 'MODERATE';
            }
            return 'NEEDS_IMPROVEMENT';
        }
        
        return this.results.conflicts.status === 'CLEAN' ? 'GOOD' : 'MODERATE';
    }

    assessDeploymentReadiness() {
        let score = 100;
        let status = 'READY';
        
        if (this.results.conflicts) {
            score -= this.results.conflicts.criticalIssues * 30;
            score -= this.results.conflicts.conflicts * 15;
            score -= this.results.conflicts.warnings * 2;
        }
        
        if (this.results.stressTest) {
            const successRate = this.results.stressTest.successRate;
            if (successRate < 50) score -= 40;
            else if (successRate < 70) score -= 25;
            else if (successRate < 85) score -= 15;
            else if (successRate < 95) score -= 5;
        }
        
        score = Math.max(0, score);
        
        if (score >= 90) status = 'READY';
        else if (score >= 75) status = 'ALMOST_READY';
        else if (score >= 60) status = 'NEEDS_WORK';
        else if (score >= 40) status = 'NOT_READY';
        else status = 'CRITICAL_ISSUES';
        
        return { score, status };
    }

    generateRecommendations() {
        const recommendations = [];
        
        if (this.results.conflicts) {
            if (this.results.conflicts.criticalIssues > 0) {
                recommendations.push('🚨 Address all critical issues immediately before deployment');
            }
            if (this.results.conflicts.conflicts > 0) {
                recommendations.push('⚔️ Resolve conflicts to ensure system stability');
            }
            if (this.results.conflicts.warnings > 10) {
                recommendations.push('⚠️ Review and address high number of warnings');
            }
        }
        
        if (this.results.stressTest) {
            if (this.results.stressTest.successRate < 85) {
                recommendations.push('🔥 Optimize system performance for better stress test results');
            }
            if (this.results.stressTest.errors > 10) {
                recommendations.push('🐛 Debug and fix errors causing test failures');
            }
        }
        
        if (recommendations.length === 0) {
            recommendations.push('✅ System is in good shape! Consider additional load testing.');
        }
        
        return recommendations;
    }

    generateNextActions() {
        const actions = [];
        
        if (this.results.conflicts && this.results.conflicts.criticalIssues > 0) {
            actions.push('Fix critical issues identified in conflict detection');
        }
        
        if (this.results.conflicts && this.results.conflicts.conflicts > 0) {
            actions.push('Resolve service and dependency conflicts');
        }
        
        if (!this.results.stressTest) {
            actions.push('Run stress test after resolving conflicts');
        }
        
        if (this.results.stressTest && this.results.stressTest.successRate < 90) {
            actions.push('Optimize performance based on stress test results');
        }
        
        actions.push('Review all warnings and implement fixes');
        actions.push('Test deployment in staging environment');
        actions.push('Monitor system performance in production');
        
        return actions;
    }

    generateHealthSummary() {
        let summary = '';
        
        const deploymentReadiness = this.assessDeploymentReadiness();
        
        if (deploymentReadiness.score >= 90) {
            summary = `🟢 HEALTHY - Your Crown Social Network is performing excellently!
   The system passed comprehensive testing with flying colors.
   Ready for production deployment with confidence.`;
        } else if (deploymentReadiness.score >= 75) {
            summary = `🟡 GOOD - System is mostly healthy with minor issues.
   Address remaining warnings for optimal performance.
   Suitable for staging deployment and testing.`;
        } else if (deploymentReadiness.score >= 60) {
            summary = `🟠 MODERATE - System needs attention before deployment.
   Several issues require resolution for production readiness.
   Recommended to fix conflicts and optimize performance.`;
        } else {
            summary = `🔴 NEEDS WORK - Critical issues require immediate attention.
   System is not ready for production deployment.
   Focus on resolving critical issues and conflicts first.`;
        }
        
        return summary;
    }

    getStatusEmoji(status) {
        const emojiMap = {
            'EXCELLENT': '🟢',
            'GOOD': '🟢',
            'CLEAN': '🟢',
            'READY': '🟢',
            'MODERATE': '🟡',
            'ALMOST_READY': '🟡',
            'MINOR_ISSUES': '🟡',
            'WARNINGS': '🟡',
            'NEEDS_WORK': '🟠',
            'NEEDS_ATTENTION': '🟠',
            'NEEDS_IMPROVEMENT': '🟠',
            'CONFLICTS': '🟠',
            'POOR': '🔴',
            'CRITICAL': '🔴',
            'CRITICAL_ISSUES': '🔴',
            'NOT_READY': '🔴',
            'FAILED': '🔴'
        };
        
        return emojiMap[status] || '⚪';
    }
}

// Export for use in other modules
module.exports = MasterTestSuite;

// Run master test suite if called directly
if (require.main === module) {
    const masterTest = new MasterTestSuite();
    masterTest.runFullTestSuite()
        .then(() => {
            const exitCode = masterTest.results.overall === 'CRITICAL' ? 1 : 0;
            process.exit(exitCode);
        })
        .catch((error) => {
            console.error('\n💥 Master test suite execution failed:', error);
            process.exit(1);
        });
}
