const axios = require('axios');

/**
 * SIEM (Security Information and Event Management) Integration
 * Tích hợp với hệ thống SIEM để giám sát bảo mật
 */
class SIEMIntegration {
    constructor(options = {}) {
        this.options = {
            enabled: process.env.SIEM_ENABLED === 'true' || true,
            serverUrl: process.env.SIEM_SERVER_URL || 'https://localhost:8080/api/siem',
            apiKey: process.env.SIEM_API_KEY || 'demo-siem-api-key',
            logLevel: process.env.LOG_LEVEL || 'info',
            batchSize: parseInt(process.env.SIEM_BATCH_SIZE) || 10,
            flushInterval: parseInt(process.env.SIEM_FLUSH_INTERVAL) || 30000, // 30 seconds
            ...options
        };

        this.eventQueue = [];
        this.isInitialized = false;
        this.flushTimer = null;

        console.log('🚨 SIEM Integration initialized');
    }

    /**
     * Initialize SIEM Integration
     */
    async initialize() {
        if (!this.options.enabled) {
            console.log('ℹ️  SIEM Integration disabled');
            return;
        }

        try {
            // Test SIEM server connection
            await this.testConnection();
            
            // Start batch processing
            this.startBatchProcessor();
            
            this.isInitialized = true;
            console.log('✅ SIEM Integration started successfully');

            // Send initial health check
            this.logSecurityEvent('SIEM_INITIALIZED', {
                system: 'Crown Social Network',
                version: '1.0.0',
                timestamp: new Date().toISOString()
            });

        } catch (error) {
            console.error('❌ Failed to initialize SIEM Integration:', error.message);
            // Continue without SIEM if connection fails
            this.options.enabled = false;
        }
    }

    /**
     * Log security event to SIEM
     */
    async logSecurityEvent(eventType, eventData = {}) {
        if (!this.options.enabled) {
            return;
        }

        const event = {
            id: this.generateEventId(),
            timestamp: new Date().toISOString(),
            type: eventType,
            severity: this.getSeverity(eventType),
            source: 'Crown Social Network',
            data: eventData
        };

        // Add to queue for batch processing
        this.eventQueue.push(event);

        // If queue is full, flush immediately
        if (this.eventQueue.length >= this.options.batchSize) {
            await this.flushEvents();
        }
    }

    /**
     * Log authentication events
     */
    async logAuthEvent(eventType, userData = {}) {
        await this.logSecurityEvent(`AUTH_${eventType}`, {
            category: 'authentication',
            ...userData
        });
    }

    /**
     * Log access events
     */
    async logAccessEvent(eventType, accessData = {}) {
        await this.logSecurityEvent(`ACCESS_${eventType}`, {
            category: 'access_control',
            ...accessData
        });
    }

    /**
     * Log system events
     */
    async logSystemEvent(eventType, systemData = {}) {
        await this.logSecurityEvent(`SYSTEM_${eventType}`, {
            category: 'system',
            ...systemData
        });
    }

    /**
     * Start batch processor
     */
    startBatchProcessor() {
        if (this.flushTimer) {
            clearInterval(this.flushTimer);
        }

        this.flushTimer = setInterval(async () => {
            if (this.eventQueue.length > 0) {
                await this.flushEvents();
            }
        }, this.options.flushInterval);
    }

    /**
     * Flush events to SIEM server
     */
    async flushEvents() {
        if (!this.options.enabled || this.eventQueue.length === 0) {
            return;
        }

        const eventsToSend = this.eventQueue.splice(0, this.options.batchSize);

        try {
            if (this.options.serverUrl.includes('localhost')) {
                // Local development - just log to console
                console.log(`📊 SIEM Events (${eventsToSend.length}):`, 
                    eventsToSend.map(e => `${e.type}:${e.severity}`).join(', '));
                return;
            }

            const response = await axios.post(`${this.options.serverUrl}/events`, {
                events: eventsToSend
            }, {
                headers: {
                    'Authorization': `Bearer ${this.options.apiKey}`,
                    'Content-Type': 'application/json'
                },
                timeout: 10000
            });

            if (response.status === 200) {
                console.log(`📊 Successfully sent ${eventsToSend.length} events to SIEM`);
            } else {
                throw new Error(`SIEM server responded with status: ${response.status}`);
            }

        } catch (error) {
            console.error('❌ Failed to send events to SIEM:', error.message);
            
            // Re-add events to queue if not a permanent failure
            if (error.response && error.response.status < 500) {
                // Client error, don't retry
                console.log('⚠️  Discarding events due to client error');
            } else {
                // Server error or network issue, retry later
                this.eventQueue.unshift(...eventsToSend);
            }
        }
    }

    /**
     * Test SIEM server connection
     */
    async testConnection() {
        if (this.options.serverUrl.includes('localhost')) {
            // Skip connection test for localhost
            return;
        }

        try {
            const response = await axios.get(`${this.options.serverUrl}/health`, {
                headers: {
                    'Authorization': `Bearer ${this.options.apiKey}`
                },
                timeout: 5000
            });

            if (response.status !== 200) {
                throw new Error(`Health check failed: ${response.status}`);
            }

        } catch (error) {
            throw new Error(`SIEM connection failed: ${error.message}`);
        }
    }

    /**
     * Generate unique event ID
     */
    generateEventId() {
        return `crown-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Get event severity level
     */
    getSeverity(eventType) {
        const severityMap = {
            'AUTH_LOGIN_FAILED': 'MEDIUM',
            'AUTH_MULTIPLE_FAILURES': 'HIGH',
            'AUTH_ACCOUNT_LOCKED': 'HIGH',
            'ACCESS_DENIED': 'MEDIUM',
            'ACCESS_PRIVILEGE_ESCALATION': 'CRITICAL',
            'SYSTEM_ERROR': 'LOW',
            'SYSTEM_STARTUP': 'INFO',
            'SYSTEM_SHUTDOWN': 'INFO',
            'WAF_ATTACK_BLOCKED': 'HIGH',
            'WAF_IP_BLOCKED': 'MEDIUM',
            'GDPR_DATA_REQUEST': 'INFO',
            'GDPR_DATA_BREACH': 'CRITICAL',
            'SIEM_INITIALIZED': 'INFO'
        };

        return severityMap[eventType] || 'LOW';
    }

    /**
     * Get SIEM statistics
     */
    getStats() {
        return {
            enabled: this.options.enabled,
            initialized: this.isInitialized,
            queueSize: this.eventQueue.length,
            serverUrl: this.options.serverUrl,
            batchSize: this.options.batchSize,
            flushInterval: this.options.flushInterval
        };
    }

    /**
     * Stop SIEM integration
     */
    async stop() {
        if (this.flushTimer) {
            clearInterval(this.flushTimer);
            this.flushTimer = null;
        }

        // Flush remaining events
        if (this.eventQueue.length > 0) {
            await this.flushEvents();
        }

        console.log('🚨 SIEM Integration stopped');
    }
}

module.exports = SIEMIntegration;
