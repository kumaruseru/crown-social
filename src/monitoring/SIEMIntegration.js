const EventEmitter = require('events');
const crypto = require('crypto');

/**
 * Security Information and Event Management (SIEM) Integration
 * Tích hợp SIEM cho monitoring và threat detection
 */
class SIEMIntegration extends EventEmitter {
    constructor() {
        super();
        this.alerts = [];
        this.threatIntelligence = new Map();
        this.anomalyDetector = new AnomalyDetector();
        this.eventBuffer = [];
        this.bufferSize = 1000;
        this.flushInterval = 5000; // 5 seconds
        
        this.initializeSIEM();
        this.loadThreatIntelligence();
        this.startEventProcessing();
    }

    /**
     * Initialize SIEM components
     */
    initializeSIEM() {
        console.log('🔍 Initializing SIEM Integration...');
        
        // SIEM providers configuration
        this.providers = {
            splunk: {
                enabled: process.env.SPLUNK_ENABLED === 'true',
                endpoint: process.env.SPLUNK_ENDPOINT,
                token: process.env.SPLUNK_TOKEN
            },
            elastic: {
                enabled: process.env.ELASTIC_ENABLED === 'true',
                endpoint: process.env.ELASTIC_ENDPOINT,
                apiKey: process.env.ELASTIC_API_KEY
            },
            datadog: {
                enabled: process.env.DATADOG_ENABLED === 'true',
                apiKey: process.env.DATADOG_API_KEY,
                appKey: process.env.DATADOG_APP_KEY
            },
            customSiem: {
                enabled: process.env.CUSTOM_SIEM_ENABLED === 'true',
                webhook: process.env.CUSTOM_SIEM_WEBHOOK
            }
        };

        // Event categories for correlation
        this.eventCategories = {
            AUTHENTICATION: 'authentication',
            AUTHORIZATION: 'authorization',
            DATA_ACCESS: 'data_access',
            SYSTEM_EVENT: 'system_event',
            SECURITY_EVENT: 'security_event',
            NETWORK_EVENT: 'network_event',
            APPLICATION_ERROR: 'application_error'
        };

        // Severity levels
        this.severityLevels = {
            INFO: 1,
            LOW: 2,
            MEDIUM: 3,
            HIGH: 4,
            CRITICAL: 5
        };
    }

    /**
     * Load threat intelligence feeds
     */
    async loadThreatIntelligence() {
        console.log('🛡️ Loading threat intelligence feeds...');
        
        try {
            // Load from various threat intelligence sources
            await Promise.all([
                this.loadMaliciousIPs(),
                this.loadMaliciousDomains(),
                this.loadAttackSignatures(),
                this.loadBotNetworks()
            ]);
            
            console.log(`✅ Loaded ${this.threatIntelligence.size} threat indicators`);
        } catch (error) {
            console.error('❌ Failed to load threat intelligence:', error.message);
        }
    }

    /**
     * Load malicious IP addresses
     */
    async loadMaliciousIPs() {
        // In production, load from threat intelligence APIs
        const maliciousIPs = [
            // Example malicious IPs (placeholder)
            '192.168.1.100', // Example internal scanning IP
            '10.0.0.50'      // Example suspicious internal IP
        ];

        maliciousIPs.forEach(ip => {
            this.threatIntelligence.set(`ip:${ip}`, {
                type: 'malicious_ip',
                severity: 'high',
                description: 'Known malicious IP address',
                source: 'threat_feed',
                updatedAt: new Date()
            });
        });
    }

    /**
     * Load malicious domains
     */
    async loadMaliciousDomains() {
        const maliciousDomains = [
            'malware-c2.example.com',
            'phishing-site.fake'
        ];

        maliciousDomains.forEach(domain => {
            this.threatIntelligence.set(`domain:${domain}`, {
                type: 'malicious_domain',
                severity: 'high',
                description: 'Known malicious domain',
                source: 'threat_feed',
                updatedAt: new Date()
            });
        });
    }

    /**
     * Load attack signatures
     */
    async loadAttackSignatures() {
        const signatures = [
            {
                pattern: /union.*select.*from/i,
                type: 'sql_injection',
                severity: 'high'
            },
            {
                pattern: /<script.*>.*<\/script>/i,
                type: 'xss_attack',
                severity: 'medium'
            }
        ];

        signatures.forEach((sig, index) => {
            this.threatIntelligence.set(`signature:${index}`, {
                type: 'attack_signature',
                pattern: sig.pattern,
                attackType: sig.type,
                severity: sig.severity,
                source: 'internal',
                updatedAt: new Date()
            });
        });
    }

    /**
     * Load botnet indicators
     */
    async loadBotNetworks() {
        // Placeholder for botnet IP ranges and user agents
        console.log('Loading botnet indicators...');
    }

    /**
     * Start event processing
     */
    startEventProcessing() {
        // Flush events periodically
        setInterval(() => {
            this.flushEvents();
        }, this.flushInterval);

        console.log('✅ SIEM event processing started');
    }

    /**
     * Log security event
     */
    logSecurityEvent(eventData) {
        const event = {
            id: crypto.randomUUID(),
            timestamp: new Date(),
            hostname: require('os').hostname(),
            application: 'crown-social',
            version: '1.0.0',
            ...eventData
        };

        // Add to buffer
        this.eventBuffer.push(event);

        // Immediate processing for critical events
        if (event.severity >= this.severityLevels.HIGH) {
            this.processEventImmediate(event);
        }

        // Threat correlation
        this.correlateWithThreatIntel(event);

        // Anomaly detection
        this.anomalyDetector.analyzeEvent(event);

        // Emit event for other components
        this.emit('security_event', event);

        // Auto-flush if buffer is full
        if (this.eventBuffer.length >= this.bufferSize) {
            this.flushEvents();
        }
    }

    /**
     * Process critical events immediately
     */
    async processEventImmediate(event) {
        console.log('🚨 Processing critical security event:', event.id);

        // Send immediate alert
        await this.sendImmediateAlert(event);

        // Update threat landscape
        this.updateThreatLandscape(event);
    }

    /**
     * Correlate event with threat intelligence
     */
    correlateWithThreatIntel(event) {
        let threatMatches = [];

        // Check IP addresses
        if (event.sourceIP) {
            const ipThreat = this.threatIntelligence.get(`ip:${event.sourceIP}`);
            if (ipThreat) {
                threatMatches.push({
                    type: 'ip_match',
                    threat: ipThreat,
                    indicator: event.sourceIP
                });
            }
        }

        // Check domains
        if (event.domain || event.url) {
            const domain = event.domain || new URL(event.url || 'http://localhost').hostname;
            const domainThreat = this.threatIntelligence.get(`domain:${domain}`);
            if (domainThreat) {
                threatMatches.push({
                    type: 'domain_match',
                    threat: domainThreat,
                    indicator: domain
                });
            }
        }

        // Check against attack signatures
        if (event.userInput || event.payload) {
            const input = event.userInput || event.payload;
            
            for (const [key, threat] of this.threatIntelligence.entries()) {
                if (threat.type === 'attack_signature' && threat.pattern.test(input)) {
                    threatMatches.push({
                        type: 'signature_match',
                        threat: threat,
                        indicator: input.substring(0, 100) // First 100 chars
                    });
                }
            }
        }

        // Enrich event with threat intelligence
        if (threatMatches.length > 0) {
            event.threatIntelligence = threatMatches;
            event.severity = Math.max(event.severity || 1, this.severityLevels.HIGH);
            
            console.warn(`⚠️ Threat intelligence match for event ${event.id}:`, threatMatches);
        }
    }

    /**
     * Flush events to SIEM providers
     */
    async flushEvents() {
        if (this.eventBuffer.length === 0) return;

        const events = [...this.eventBuffer];
        this.eventBuffer = [];

        console.log(`📤 Flushing ${events.length} events to SIEM providers`);

        try {
            await Promise.all([
                this.sendToSplunk(events),
                this.sendToElastic(events),
                this.sendToDatadog(events),
                this.sendToCustomSIEM(events)
            ]);
        } catch (error) {
            console.error('❌ Failed to flush events to SIEM:', error.message);
            
            // Re-add events to buffer for retry (with limit)
            if (this.eventBuffer.length < this.bufferSize) {
                this.eventBuffer.unshift(...events.slice(0, this.bufferSize - this.eventBuffer.length));
            }
        }
    }

    /**
     * Send events to Splunk
     */
    async sendToSplunk(events) {
        if (!this.providers.splunk.enabled) return;

        try {
            const axios = require('axios');
            
            for (const event of events) {
                await axios.post(`${this.providers.splunk.endpoint}/services/collector/event`, {
                    event: event,
                    sourcetype: 'crown_social_security'
                }, {
                    headers: {
                        'Authorization': `Splunk ${this.providers.splunk.token}`,
                        'Content-Type': 'application/json'
                    },
                    timeout: 5000
                });
            }
            
            console.log(`✅ Sent ${events.length} events to Splunk`);
        } catch (error) {
            console.error('❌ Splunk integration error:', error.message);
        }
    }

    /**
     * Send events to Elasticsearch
     */
    async sendToElastic(events) {
        if (!this.providers.elastic.enabled) return;

        try {
            const { Client } = require('@elastic/elasticsearch');
            const client = new Client({
                node: this.providers.elastic.endpoint,
                auth: {
                    apiKey: this.providers.elastic.apiKey
                }
            });

            const body = [];
            events.forEach(event => {
                body.push({
                    index: {
                        _index: `crown-security-${new Date().toISOString().split('T')[0]}`
                    }
                });
                body.push(event);
            });

            await client.bulk({ body });
            console.log(`✅ Sent ${events.length} events to Elasticsearch`);
        } catch (error) {
            console.error('❌ Elasticsearch integration error:', error.message);
        }
    }

    /**
     * Send events to Datadog
     */
    async sendToDatadog(events) {
        if (!this.providers.datadog.enabled) return;

        try {
            const axios = require('axios');
            
            const logs = events.map(event => ({
                ddsource: 'crown-social',
                ddtags: `env:${process.env.NODE_ENV || 'development'},app:crown-social`,
                hostname: event.hostname,
                message: JSON.stringify(event),
                timestamp: event.timestamp.getTime()
            }));

            await axios.post('https://http-intake.logs.datadoghq.com/v1/input/' + this.providers.datadog.apiKey, {
                logs: logs
            }, {
                headers: {
                    'Content-Type': 'application/json'
                },
                timeout: 5000
            });

            console.log(`✅ Sent ${events.length} events to Datadog`);
        } catch (error) {
            console.error('❌ Datadog integration error:', error.message);
        }
    }

    /**
     * Send events to custom SIEM
     */
    async sendToCustomSIEM(events) {
        if (!this.providers.customSiem.enabled) return;

        try {
            const axios = require('axios');
            
            await axios.post(this.providers.customSiem.webhook, {
                events: events,
                metadata: {
                    application: 'crown-social',
                    version: '1.0.0',
                    timestamp: new Date()
                }
            }, {
                timeout: 5000
            });

            console.log(`✅ Sent ${events.length} events to Custom SIEM`);
        } catch (error) {
            console.error('❌ Custom SIEM integration error:', error.message);
        }
    }

    /**
     * Send immediate alert for critical events
     */
    async sendImmediateAlert(event) {
        const alert = {
            id: crypto.randomUUID(),
            timestamp: new Date(),
            severity: 'CRITICAL',
            title: `Security Alert: ${event.eventType}`,
            description: event.description,
            sourceEvent: event.id,
            recommendedActions: this.getRecommendedActions(event)
        };

        // Store alert
        this.alerts.push(alert);

        // Send to alerting systems (Slack, PagerDuty, email, etc.)
        await Promise.all([
            this.sendSlackAlert(alert),
            this.sendEmailAlert(alert),
            this.sendPagerDutyAlert(alert)
        ]);

        console.log(`🚨 Critical alert sent: ${alert.id}`);
    }

    /**
     * Get recommended actions for security events
     */
    getRecommendedActions(event) {
        const actions = [];

        switch (event.eventType) {
            case 'brute_force_attack':
                actions.push('Block source IP address');
                actions.push('Review user account security');
                actions.push('Enable additional authentication factors');
                break;
            
            case 'sql_injection_attempt':
                actions.push('Review and sanitize input validation');
                actions.push('Check database logs for successful injections');
                actions.push('Update WAF rules');
                break;
            
            case 'privilege_escalation':
                actions.push('Review user permissions');
                actions.push('Audit recent privilege changes');
                actions.push('Check for compromised accounts');
                break;
            
            default:
                actions.push('Investigate the security event');
                actions.push('Review system logs');
                actions.push('Consider temporary access restrictions');
        }

        return actions;
    }

    /**
     * Send Slack alert
     */
    async sendSlackAlert(alert) {
        if (!process.env.SLACK_WEBHOOK_URL) return;

        try {
            const axios = require('axios');
            
            await axios.post(process.env.SLACK_WEBHOOK_URL, {
                text: `🚨 Crown Social Security Alert`,
                attachments: [{
                    color: 'danger',
                    title: alert.title,
                    text: alert.description,
                    fields: [
                        {
                            title: 'Severity',
                            value: alert.severity,
                            short: true
                        },
                        {
                            title: 'Alert ID',
                            value: alert.id,
                            short: true
                        }
                    ],
                    footer: 'Crown Social SIEM',
                    ts: Math.floor(alert.timestamp.getTime() / 1000)
                }]
            });
        } catch (error) {
            console.error('❌ Slack alert error:', error.message);
        }
    }

    /**
     * Send email alert
     */
    async sendEmailAlert(alert) {
        // Implementation depends on email service
        console.log('📧 Email alert would be sent:', alert.title);
    }

    /**
     * Send PagerDuty alert
     */
    async sendPagerDutyAlert(alert) {
        // Implementation for PagerDuty integration
        console.log('📟 PagerDuty alert would be sent:', alert.title);
    }

    /**
     * Update threat landscape based on new events
     */
    updateThreatLandscape(event) {
        // Add new threat indicators from confirmed attacks
        if (event.confirmed === true && event.sourceIP) {
            this.threatIntelligence.set(`ip:${event.sourceIP}`, {
                type: 'malicious_ip',
                severity: 'high',
                description: 'IP confirmed as malicious through attack',
                source: 'internal_detection',
                updatedAt: new Date(),
                eventId: event.id
            });
        }
    }

    /**
     * Get security dashboard data
     */
    getSecurityDashboard() {
        const now = new Date();
        const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        
        return {
            threatIntelligence: {
                totalIndicators: this.threatIntelligence.size,
                lastUpdated: new Date()
            },
            recentAlerts: this.alerts.filter(alert => 
                alert.timestamp >= last24Hours
            ).length,
            eventStats: {
                buffered: this.eventBuffer.length,
                bufferSize: this.bufferSize
            },
            siemProviders: Object.entries(this.providers).map(([name, config]) => ({
                name,
                enabled: config.enabled,
                status: 'connected' // In production, check actual connectivity
            })),
            anomalyDetection: this.anomalyDetector.getStats()
        };
    }

    /**
     * Health check for SIEM integration
     */
    async healthCheck() {
        const health = {
            status: 'healthy',
            components: {},
            threatIntelligence: {
                indicators: this.threatIntelligence.size,
                lastUpdate: new Date()
            },
            eventBuffer: {
                size: this.eventBuffer.length,
                capacity: this.bufferSize
            }
        };

        // Check each SIEM provider
        for (const [name, provider] of Object.entries(this.providers)) {
            if (provider.enabled) {
                try {
                    // Test connectivity (implementation varies by provider)
                    health.components[name] = { status: 'connected' };
                } catch (error) {
                    health.components[name] = { status: 'error', error: error.message };
                    health.status = 'degraded';
                }
            } else {
                health.components[name] = { status: 'disabled' };
            }
        }

        return health;
    }
}

/**
 * Anomaly Detection Engine
 */
class AnomalyDetector {
    constructor() {
        this.baselines = new Map();
        this.anomalies = [];
        this.learningPeriod = 7 * 24 * 60 * 60 * 1000; // 7 days
    }

    analyzeEvent(event) {
        // Simple anomaly detection based on frequency and patterns
        const key = this.getEventKey(event);
        const baseline = this.baselines.get(key) || { count: 0, timestamps: [] };
        
        baseline.count++;
        baseline.timestamps.push(event.timestamp);
        
        // Keep only recent timestamps
        const cutoff = new Date(Date.now() - this.learningPeriod);
        baseline.timestamps = baseline.timestamps.filter(ts => ts >= cutoff);
        
        this.baselines.set(key, baseline);
        
        // Detect anomalies
        if (this.isAnomalous(event, baseline)) {
            this.anomalies.push({
                event: event,
                detectedAt: new Date(),
                type: 'frequency_anomaly',
                baseline: { ...baseline }
            });
        }
    }

    getEventKey(event) {
        return `${event.eventType}:${event.sourceIP || 'unknown'}`;
    }

    isAnomalous(event, baseline) {
        // Simple threshold-based detection
        const recentEvents = baseline.timestamps.filter(
            ts => ts >= new Date(Date.now() - 60 * 60 * 1000) // Last hour
        );
        
        return recentEvents.length > 50; // More than 50 events per hour
    }

    getStats() {
        return {
            baselines: this.baselines.size,
            anomalies: this.anomalies.length,
            recentAnomalies: this.anomalies.filter(
                a => a.detectedAt >= new Date(Date.now() - 24 * 60 * 60 * 1000)
            ).length
        };
    }
}

module.exports = SIEMIntegration;
