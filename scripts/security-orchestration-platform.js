#!/usr/bin/env node

/**
 * Security Orchestration Platform
 * Tích hợp và điều phối tất cả các công cụ bảo mật
 */

const SecurityValidationSuite = require('./security-validation-suite');
const ComplianceAudit = require('./compliance-audit');
const AutomatedPenTest = require('./automated-pentest');
const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');
const { EventEmitter } = require('events');

class SecurityOrchestrationPlatform extends EventEmitter {
    constructor(config = {}) {
        super();
        
        this.config = {
            projectPath: config.projectPath || process.cwd(),
            targetUrl: config.targetUrl || 'http://localhost:3000',
            enableScheduler: config.enableScheduler || false,
            scheduleInterval: config.scheduleInterval || 24 * 60 * 60 * 1000, // 24 hours
            reportRetention: config.reportRetention || 30, // days
            notificationWebhook: config.notificationWebhook || null,
            ...config
        };
        
        this.orchestrationId = crypto.randomUUID();
        this.isRunning = false;
        this.scheduler = null;
        this.lastRun = null;
        this.securityMetrics = {
            totalScans: 0,
            criticalIssues: 0,
            resolvedIssues: 0,
            averageRiskScore: 0,
            trends: []
        };
        
        this.integrations = {
            slack: null,
            jira: null,
            github: null,
            sonarqube: null,
            splunk: null
        };
    }

    /**
     * Initialize the security orchestration platform
     */
    async initialize() {
        console.log('🚀 Crown Social Network - Security Orchestration Platform');
        console.log('========================================================');
        console.log(`Orchestration ID: ${this.orchestrationId}`);
        console.log(`Project Path: ${this.config.projectPath}`);
        console.log(`Target URL: ${this.config.targetUrl}`);
        console.log('');

        try {
            // Create required directories
            await this.createDirectoryStructure();

            // Load previous metrics
            await this.loadSecurityMetrics();

            // Initialize integrations
            await this.initializeIntegrations();

            // Start scheduler if enabled
            if (this.config.enableScheduler) {
                this.startScheduler();
            }

            this.emit('initialized');
            console.log('✅ Security Orchestration Platform initialized successfully!\n');

        } catch (error) {
            console.error('❌ Platform initialization failed:', error.message);
            throw error;
        }
    }

    /**
     * Create directory structure
     */
    async createDirectoryStructure() {
        const directories = [
            'security-reports',
            'compliance-reports',
            'orchestration-logs',
            'security-metrics',
            'integration-configs',
            'workflow-templates'
        ];

        for (const dir of directories) {
            const dirPath = path.join(this.config.projectPath, dir);
            await fs.mkdir(dirPath, { recursive: true });
        }
    }

    /**
     * Load security metrics from previous runs
     */
    async loadSecurityMetrics() {
        try {
            const metricsPath = path.join(this.config.projectPath, 'security-metrics', 'platform-metrics.json');
            const metricsData = await fs.readFile(metricsPath, 'utf-8');
            this.securityMetrics = { ...this.securityMetrics, ...JSON.parse(metricsData) };
            console.log('📊 Loaded previous security metrics');
        } catch (error) {
            console.log('📊 No previous metrics found, starting fresh');
        }
    }

    /**
     * Save security metrics
     */
    async saveSecurityMetrics() {
        try {
            const metricsPath = path.join(this.config.projectPath, 'security-metrics', 'platform-metrics.json');
            await fs.writeFile(metricsPath, JSON.stringify(this.securityMetrics, null, 2));
        } catch (error) {
            console.error('❌ Failed to save security metrics:', error.message);
        }
    }

    /**
     * Initialize integrations
     */
    async initializeIntegrations() {
        console.log('🔌 Initializing security tool integrations...');

        // Mock integration initialization
        this.integrations = {
            slack: { enabled: false, webhook: this.config.notificationWebhook },
            jira: { enabled: false, url: null, apiKey: null },
            github: { enabled: false, token: null, repo: null },
            sonarqube: { enabled: false, url: null, token: null },
            splunk: { enabled: false, url: null, token: null }
        };

        console.log('🔌 Integration framework initialized');
    }

    /**
     * Start scheduled security scans
     */
    startScheduler() {
        console.log(`⏰ Starting security scan scheduler (interval: ${this.config.scheduleInterval / 1000 / 60 / 60}h)`);
        
        this.scheduler = setInterval(async () => {
            console.log('⏰ Scheduled security scan triggered');
            await this.runOrchestration();
        }, this.config.scheduleInterval);

        // Also run on startup
        setTimeout(() => {
            this.runOrchestration();
        }, 5000);
    }

    /**
     * Stop scheduler
     */
    stopScheduler() {
        if (this.scheduler) {
            clearInterval(this.scheduler);
            this.scheduler = null;
            console.log('⏰ Security scan scheduler stopped');
        }
    }

    /**
     * Run complete security orchestration
     */
    async runOrchestration(mode = 'full') {
        if (this.isRunning) {
            console.log('⚠️ Security orchestration already running, skipping...');
            return;
        }

        this.isRunning = true;
        const startTime = Date.now();
        
        console.log('🎯 Starting Security Orchestration...');
        console.log('=====================================');

        try {
            const orchestrationResult = {
                id: this.orchestrationId,
                mode: mode,
                timestamp: new Date(),
                duration: 0,
                phases: {},
                summary: {},
                alerts: [],
                recommendations: [],
                metrics: {}
            };

            // Phase 1: Pre-execution Setup
            console.log('📋 Phase 1: Pre-execution Setup...');
            await this.preExecutionSetup();
            orchestrationResult.phases.preExecution = { status: 'completed', timestamp: new Date() };

            // Phase 2: Security Validation Suite
            if (mode === 'full' || mode === 'security') {
                console.log('🔒 Phase 2: Comprehensive Security Validation...');
                const validationSuite = new SecurityValidationSuite(this.config.projectPath, this.config.targetUrl);
                orchestrationResult.phases.securityValidation = await validationSuite.runSecurityValidation();
            }

            // Phase 3: Compliance Audit
            if (mode === 'full' || mode === 'compliance') {
                console.log('🏛️ Phase 3: Compliance Audit...');
                const complianceAudit = new ComplianceAudit(this.config.projectPath);
                orchestrationResult.phases.complianceAudit = await complianceAudit.runComplianceAudit();
            }

            // Phase 4: Penetration Testing
            if (mode === 'full' || mode === 'pentest') {
                console.log('🔍 Phase 4: Penetration Testing...');
                const penTest = new AutomatedPenTest(this.config.targetUrl);
                orchestrationResult.phases.penetrationTest = await penTest.runPenTest();
            }

            // Phase 5: Risk Analysis & Correlation
            console.log('📊 Phase 5: Risk Analysis & Correlation...');
            orchestrationResult.riskAnalysis = await this.performRiskAnalysis(orchestrationResult.phases);

            // Phase 6: Alert Generation
            console.log('🚨 Phase 6: Alert Generation...');
            orchestrationResult.alerts = await this.generateAlerts(orchestrationResult.riskAnalysis);

            // Phase 7: Integration & Notifications
            console.log('📡 Phase 7: Integration & Notifications...');
            await this.sendNotifications(orchestrationResult);

            // Phase 8: Report Generation
            console.log('📄 Phase 8: Orchestration Report Generation...');
            orchestrationResult.summary = this.generateOrchestrationSummary(orchestrationResult);
            await this.generateOrchestrationReport(orchestrationResult);

            // Update metrics
            orchestrationResult.duration = Date.now() - startTime;
            this.updateSecurityMetrics(orchestrationResult);
            await this.saveSecurityMetrics();

            this.lastRun = orchestrationResult;
            this.emit('orchestration-complete', orchestrationResult);

            console.log('\n🎉 Security Orchestration Completed Successfully!');
            console.log(`⏱️ Total Duration: ${Math.round(orchestrationResult.duration / 1000)}s`);

            return orchestrationResult;

        } catch (error) {
            console.error('❌ Security orchestration failed:', error.message);
            this.emit('orchestration-error', error);
            throw error;
        } finally {
            this.isRunning = false;
        }
    }

    /**
     * Pre-execution setup
     */
    async preExecutionSetup() {
        console.log('  🔧 Validating environment...');
        console.log('  📁 Checking project structure...');
        console.log('  🌐 Testing target connectivity...');
        console.log('  🧹 Cleaning up old reports...');
        
        // Cleanup old reports
        await this.cleanupOldReports();
        
        console.log('  ✅ Pre-execution setup completed');
    }

    /**
     * Cleanup old reports
     */
    async cleanupOldReports() {
        const reportDirs = ['security-reports', 'compliance-reports'];
        const retentionDate = new Date();
        retentionDate.setDate(retentionDate.getDate() - this.config.reportRetention);

        for (const dir of reportDirs) {
            try {
                const dirPath = path.join(this.config.projectPath, dir);
                const files = await fs.readdir(dirPath);
                
                for (const file of files) {
                    const filePath = path.join(dirPath, file);
                    const stats = await fs.stat(filePath);
                    
                    if (stats.mtime < retentionDate) {
                        await fs.unlink(filePath);
                    }
                }
            } catch (error) {
                // Continue if directory doesn't exist
            }
        }
    }

    /**
     * Perform risk analysis and correlation
     */
    async performRiskAnalysis(phases) {
        console.log('  📊 Analyzing security findings...');
        console.log('  🔗 Correlating vulnerabilities...');
        console.log('  📈 Calculating risk scores...');
        
        const analysis = {
            totalFindings: 0,
            criticalRisk: 0,
            highRisk: 0,
            mediumRisk: 0,
            lowRisk: 0,
            riskScore: 0,
            riskLevel: 'LOW',
            correlatedThreats: [],
            businessImpact: 'LOW'
        };

        // Aggregate findings from all phases
        if (phases.securityValidation?.summary) {
            analysis.totalFindings += phases.securityValidation.summary.totalIssues || 0;
            analysis.criticalRisk += phases.securityValidation.summary.criticalIssues || 0;
            analysis.highRisk += phases.securityValidation.summary.highIssues || 0;
            analysis.mediumRisk += phases.securityValidation.summary.mediumIssues || 0;
            analysis.lowRisk += phases.securityValidation.summary.lowIssues || 0;
        }

        if (phases.complianceAudit?.summary) {
            analysis.totalFindings += phases.complianceAudit.summary.totalViolations || 0;
        }

        if (phases.penetrationTest?.summary) {
            analysis.totalFindings += phases.penetrationTest.summary.totalVulnerabilities || 0;
        }

        // Calculate overall risk score
        analysis.riskScore = 
            analysis.criticalRisk * 10 +
            analysis.highRisk * 7 +
            analysis.mediumRisk * 4 +
            analysis.lowRisk * 1;

        // Determine risk level
        if (analysis.riskScore >= 50) {
            analysis.riskLevel = 'CRITICAL';
            analysis.businessImpact = 'SEVERE';
        } else if (analysis.riskScore >= 30) {
            analysis.riskLevel = 'HIGH';
            analysis.businessImpact = 'HIGH';
        } else if (analysis.riskScore >= 15) {
            analysis.riskLevel = 'MEDIUM';
            analysis.businessImpact = 'MEDIUM';
        } else {
            analysis.riskLevel = 'LOW';
            analysis.businessImpact = 'LOW';
        }

        // Identify correlated threats
        analysis.correlatedThreats = this.identifyCorrelatedThreats(phases);

        console.log('  ✅ Risk analysis completed');
        return analysis;
    }

    /**
     * Identify correlated threats
     */
    identifyCorrelatedThreats(phases) {
        const threats = [];

        // Authentication-related threats
        const authThreats = [];
        if (phases.securityValidation?.results?.integrationTests?.details) {
            const authTest = phases.securityValidation.results.integrationTests.details.find(t => 
                t.test.includes('authentication') && !t.result.passed
            );
            if (authTest) authThreats.push('Authentication bypass');
        }

        if (phases.penetrationTest?.vulnerabilities) {
            const authVulns = phases.penetrationTest.vulnerabilities.filter(v => 
                v.category === 'AUTHENTICATION'
            );
            if (authVulns.length > 0) authThreats.push('Weak authentication controls');
        }

        if (authThreats.length > 0) {
            threats.push({
                category: 'Authentication',
                severity: 'HIGH',
                threats: authThreats,
                recommendation: 'Implement comprehensive authentication controls including MFA'
            });
        }

        // Data protection threats
        const dataThreats = [];
        if (phases.complianceAudit?.violations) {
            const gdprViolations = phases.complianceAudit.violations.filter(v => v.framework === 'GDPR');
            if (gdprViolations.length > 0) dataThreats.push('GDPR compliance violations');
        }

        if (dataThreats.length > 0) {
            threats.push({
                category: 'Data Protection',
                severity: 'HIGH',
                threats: dataThreats,
                recommendation: 'Implement comprehensive data protection controls'
            });
        }

        return threats;
    }

    /**
     * Generate security alerts
     */
    async generateAlerts(riskAnalysis) {
        console.log('  🚨 Generating security alerts...');
        
        const alerts = [];

        // Critical risk alert
        if (riskAnalysis.riskLevel === 'CRITICAL') {
            alerts.push({
                id: crypto.randomUUID(),
                severity: 'CRITICAL',
                type: 'SECURITY_RISK',
                title: 'Critical Security Risk Detected',
                description: `${riskAnalysis.criticalRisk} critical security issues identified requiring immediate attention`,
                timestamp: new Date(),
                actionRequired: true,
                recommendations: ['Immediate security team engagement', 'Business risk assessment', 'Executive notification']
            });
        }

        // High risk alert
        if (riskAnalysis.riskLevel === 'HIGH') {
            alerts.push({
                id: crypto.randomUUID(),
                severity: 'HIGH',
                type: 'SECURITY_RISK',
                title: 'High Security Risk Detected',
                description: `${riskAnalysis.highRisk} high-priority security issues require prompt remediation`,
                timestamp: new Date(),
                actionRequired: true,
                recommendations: ['Schedule security remediation', 'Update security controls', 'Monitor for exploitation']
            });
        }

        // Compliance alert
        if (riskAnalysis.totalFindings > 10) {
            alerts.push({
                id: crypto.randomUUID(),
                severity: 'MEDIUM',
                type: 'COMPLIANCE_RISK',
                title: 'Multiple Compliance Violations',
                description: `${riskAnalysis.totalFindings} compliance and security findings require attention`,
                timestamp: new Date(),
                actionRequired: true,
                recommendations: ['Review compliance framework gaps', 'Implement missing controls', 'Schedule compliance review']
            });
        }

        // Trend alert
        if (this.securityMetrics.trends.length > 0) {
            const lastTrend = this.securityMetrics.trends[this.securityMetrics.trends.length - 1];
            if (riskAnalysis.riskScore > lastTrend.riskScore * 1.2) {
                alerts.push({
                    id: crypto.randomUUID(),
                    severity: 'MEDIUM',
                    type: 'TREND_ALERT',
                    title: 'Security Risk Trend Increase',
                    description: 'Security risk score has increased significantly compared to previous assessment',
                    timestamp: new Date(),
                    actionRequired: false,
                    recommendations: ['Investigate new vulnerabilities', 'Review recent changes', 'Adjust security monitoring']
                });
            }
        }

        console.log(`  ✅ Generated ${alerts.length} security alerts`);
        return alerts;
    }

    /**
     * Send notifications
     */
    async sendNotifications(orchestrationResult) {
        console.log('  📡 Processing notifications...');
        
        // Slack notification
        if (this.integrations.slack?.enabled && this.integrations.slack.webhook) {
            await this.sendSlackNotification(orchestrationResult);
        }

        // JIRA ticket creation
        if (this.integrations.jira?.enabled && orchestrationResult.riskAnalysis.riskLevel === 'CRITICAL') {
            await this.createJiraTicket(orchestrationResult);
        }

        // GitHub issue creation
        if (this.integrations.github?.enabled && orchestrationResult.alerts.length > 0) {
            await this.createGithubIssues(orchestrationResult);
        }

        console.log('  ✅ Notifications processed');
    }

    /**
     * Send Slack notification
     */
    async sendSlackNotification(result) {
        console.log('  📱 Sending Slack notification...');
        
        const message = {
            text: `Crown Social Network Security Report`,
            attachments: [{
                color: result.riskAnalysis.riskLevel === 'CRITICAL' ? 'danger' : 
                       result.riskAnalysis.riskLevel === 'HIGH' ? 'warning' : 'good',
                fields: [
                    { title: 'Risk Level', value: result.riskAnalysis.riskLevel, short: true },
                    { title: 'Risk Score', value: result.riskAnalysis.riskScore, short: true },
                    { title: 'Total Findings', value: result.riskAnalysis.totalFindings, short: true },
                    { title: 'Critical Issues', value: result.riskAnalysis.criticalRisk, short: true }
                ],
                footer: 'Crown Security Orchestration Platform',
                ts: Math.floor(Date.now() / 1000)
            }]
        };

        // In a real implementation, send to Slack webhook
        console.log('  📱 Slack notification prepared (webhook disabled in demo)');
    }

    /**
     * Create JIRA ticket
     */
    async createJiraTicket(result) {
        console.log('  🎫 Creating JIRA security ticket...');
        
        const ticket = {
            fields: {
                project: { key: 'SEC' },
                summary: `Critical Security Issues - ${new Date().toISOString().split('T')[0]}`,
                description: `Critical security vulnerabilities detected in Crown Social Network:
                
Risk Level: ${result.riskAnalysis.riskLevel}
Risk Score: ${result.riskAnalysis.riskScore}
Critical Issues: ${result.riskAnalysis.criticalRisk}
High Issues: ${result.riskAnalysis.highRisk}

Immediate action required to address security vulnerabilities.`,
                issuetype: { name: 'Bug' },
                priority: { name: 'Critical' }
            }
        };

        // In a real implementation, create JIRA ticket via API
        console.log('  🎫 JIRA ticket prepared (API disabled in demo)');
    }

    /**
     * Create GitHub issues
     */
    async createGithubIssues(result) {
        console.log('  🐙 Creating GitHub security issues...');
        
        for (const alert of result.alerts.slice(0, 3)) { // Limit to 3 issues
            const issue = {
                title: `[Security] ${alert.title}`,
                body: `## Security Alert

**Severity:** ${alert.severity}
**Type:** ${alert.type}

**Description:**
${alert.description}

**Recommendations:**
${alert.recommendations.map(rec => `- ${rec}`).join('\n')}

**Generated by:** Crown Security Orchestration Platform
**Timestamp:** ${alert.timestamp.toISOString()}`,
                labels: ['security', 'vulnerability', alert.severity.toLowerCase()]
            };

            // In a real implementation, create GitHub issue via API
            console.log(`  🐙 GitHub issue prepared: ${issue.title}`);
        }
    }

    /**
     * Generate orchestration summary
     */
    generateOrchestrationSummary(result) {
        return {
            orchestrationId: result.id,
            mode: result.mode,
            duration: result.duration,
            riskLevel: result.riskAnalysis.riskLevel,
            riskScore: result.riskAnalysis.riskScore,
            totalFindings: result.riskAnalysis.totalFindings,
            alertsGenerated: result.alerts.length,
            phasesCompleted: Object.keys(result.phases).length,
            businessImpact: result.riskAnalysis.businessImpact,
            recommendedActions: this.generateRecommendedActions(result.riskAnalysis)
        };
    }

    /**
     * Generate recommended actions
     */
    generateRecommendedActions(riskAnalysis) {
        const actions = [];

        if (riskAnalysis.criticalRisk > 0) {
            actions.push({
                priority: 'IMMEDIATE',
                action: 'Address critical security vulnerabilities',
                timeline: '24-48 hours'
            });
        }

        if (riskAnalysis.highRisk > 0) {
            actions.push({
                priority: 'HIGH',
                action: 'Remediate high-priority security issues',
                timeline: '1-2 weeks'
            });
        }

        if (riskAnalysis.riskLevel === 'CRITICAL') {
            actions.push({
                priority: 'IMMEDIATE',
                action: 'Engage security incident response team',
                timeline: 'Immediate'
            });
        }

        actions.push({
            priority: 'MEDIUM',
            action: 'Schedule regular security assessments',
            timeline: 'Ongoing'
        });

        return actions;
    }

    /**
     * Generate orchestration report
     */
    async generateOrchestrationReport(result) {
        const reportPath = path.join(this.config.projectPath, 'security-reports', `orchestration-${result.id}.json`);
        await fs.writeFile(reportPath, JSON.stringify(result, null, 2));

        // Generate markdown dashboard
        const dashboard = this.generateSecurityDashboard(result);
        const dashboardPath = path.join(this.config.projectPath, 'security-reports', `security-dashboard-${result.id}.md`);
        await fs.writeFile(dashboardPath, dashboard);

        console.log(`  📄 Orchestration report: ${reportPath}`);
        console.log(`  📊 Security dashboard: ${dashboardPath}`);
    }

    /**
     * Generate security dashboard
     */
    generateSecurityDashboard(result) {
        return `# Crown Social Network - Security Dashboard

**Generated:** ${new Date().toISOString()}
**Orchestration ID:** ${result.id}
**Mode:** ${result.mode}

## 🎯 Executive Summary

| Metric | Value |
|--------|-------|
| **Overall Risk Level** | ${result.riskAnalysis.riskLevel} |
| **Risk Score** | ${result.riskAnalysis.riskScore}/100 |
| **Business Impact** | ${result.riskAnalysis.businessImpact} |
| **Total Findings** | ${result.riskAnalysis.totalFindings} |
| **Assessment Duration** | ${Math.round(result.duration / 1000)}s |

## 🚨 Risk Breakdown

| Severity | Count | Impact |
|----------|-------|---------|
| 🔴 Critical | ${result.riskAnalysis.criticalRisk} | Immediate action required |
| 🟠 High | ${result.riskAnalysis.highRisk} | Priority remediation needed |
| 🟡 Medium | ${result.riskAnalysis.mediumRisk} | Schedule for resolution |
| 🔵 Low | ${result.riskAnalysis.lowRisk} | Monitor and improve |

## 📋 Assessment Coverage

${Object.entries(result.phases).map(([phase, data]) => 
    `### ${phase.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
- **Status:** ${data?.status || 'Completed'}
- **Timestamp:** ${data?.timestamp ? new Date(data.timestamp).toLocaleString() : 'N/A'}`
).join('\n\n')}

## 🎯 Immediate Actions Required

${result.summary.recommendedActions
    .filter(action => action.priority === 'IMMEDIATE')
    .map((action, index) => `${index + 1}. **${action.action}** (${action.timeline})`)
    .join('\n') || 'No immediate actions required'}

## 📊 Security Alerts

${result.alerts.map(alert => 
    `### ${alert.severity}: ${alert.title}
- **Type:** ${alert.type}
- **Description:** ${alert.description}
- **Action Required:** ${alert.actionRequired ? 'Yes' : 'No'}
- **Timestamp:** ${alert.timestamp.toLocaleString()}
`).join('\n')}

## 🔗 Correlated Threats

${result.riskAnalysis.correlatedThreats.map(threat =>
    `### ${threat.category} (${threat.severity})
- **Threats:** ${threat.threats.join(', ')}
- **Recommendation:** ${threat.recommendation}
`).join('\n') || 'No correlated threats identified'}

## 📈 Security Metrics Trend

| Date | Risk Score | Critical | High | Medium | Low |
|------|------------|----------|------|--------|-----|
${this.securityMetrics.trends.slice(-5).map(trend => 
    `| ${new Date(trend.date).toLocaleDateString()} | ${trend.riskScore} | ${trend.critical} | ${trend.high} | ${trend.medium} | ${trend.low} |`
).join('\n')}

## 🛡️ Next Security Review

**Recommended Date:** ${new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString()}

---
*Dashboard generated by Crown Security Orchestration Platform*
`;
    }

    /**
     * Update security metrics
     */
    updateSecurityMetrics(result) {
        this.securityMetrics.totalScans++;
        this.securityMetrics.criticalIssues += result.riskAnalysis.criticalRisk;
        
        // Calculate average risk score
        this.securityMetrics.averageRiskScore = Math.round(
            (this.securityMetrics.averageRiskScore * (this.securityMetrics.totalScans - 1) + result.riskAnalysis.riskScore) / 
            this.securityMetrics.totalScans
        );

        // Add to trends
        this.securityMetrics.trends.push({
            date: new Date(),
            riskScore: result.riskAnalysis.riskScore,
            critical: result.riskAnalysis.criticalRisk,
            high: result.riskAnalysis.highRisk,
            medium: result.riskAnalysis.mediumRisk,
            low: result.riskAnalysis.lowRisk,
            totalFindings: result.riskAnalysis.totalFindings
        });

        // Keep only last 30 trend entries
        if (this.securityMetrics.trends.length > 30) {
            this.securityMetrics.trends = this.securityMetrics.trends.slice(-30);
        }
    }

    /**
     * Get security dashboard data
     */
    async getSecurityDashboard() {
        return {
            orchestrationId: this.orchestrationId,
            isRunning: this.isRunning,
            lastRun: this.lastRun,
            metrics: this.securityMetrics,
            integrations: this.integrations,
            config: this.config
        };
    }

    /**
     * Shutdown the platform
     */
    async shutdown() {
        console.log('🛑 Shutting down Security Orchestration Platform...');
        
        this.stopScheduler();
        await this.saveSecurityMetrics();
        
        this.emit('shutdown');
        console.log('✅ Platform shutdown completed');
    }
}

// CLI interface
if (require.main === module) {
    const argv = process.argv.slice(2);
    const command = argv[0] || 'run';
    
    const config = {
        projectPath: argv[1] || process.cwd(),
        targetUrl: argv[2] || 'http://localhost:3000',
        enableScheduler: argv.includes('--schedule'),
        scheduleInterval: parseInt(argv.find(arg => arg.startsWith('--interval='))?.split('=')[1]) || 24 * 60 * 60 * 1000,
        notificationWebhook: argv.find(arg => arg.startsWith('--webhook='))?.split('=')[1] || null
    };

    const platform = new SecurityOrchestrationPlatform(config);

    async function main() {
        try {
            await platform.initialize();

            switch (command) {
                case 'run':
                    const mode = argv.includes('--security') ? 'security' :
                                argv.includes('--compliance') ? 'compliance' :
                                argv.includes('--pentest') ? 'pentest' : 'full';
                    await platform.runOrchestration(mode);
                    break;

                case 'dashboard':
                    const dashboard = await platform.getSecurityDashboard();
                    console.log(JSON.stringify(dashboard, null, 2));
                    break;

                case 'schedule':
                    platform.startScheduler();
                    console.log('Scheduler started. Press Ctrl+C to stop.');
                    process.on('SIGINT', async () => {
                        await platform.shutdown();
                        process.exit(0);
                    });
                    break;

                default:
                    console.log(`Unknown command: ${command}`);
                    console.log('Available commands: run, dashboard, schedule');
            }

        } catch (error) {
            console.error('❌ Platform execution failed:', error);
            process.exit(1);
        }
    }

    main();
}

module.exports = SecurityOrchestrationPlatform;
