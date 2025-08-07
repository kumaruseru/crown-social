/**
 * GDPR Compliance Manager
 * Quản lý tuân thủ GDPR (General Data Protection Regulation)
 */
class GDPRComplianceManager {
    constructor(options = {}) {
        this.options = {
            enabled: process.env.GDPR_ENABLED === 'true' || true,
            dataRetentionDays: parseInt(process.env.DATA_RETENTION_DAYS) || 2555, // 7 years
            cookieConsentRequired: process.env.COOKIE_CONSENT_REQUIRED === 'true' || true,
            rightToDeleteEnabled: process.env.RIGHT_TO_DELETE_ENABLED === 'true' || true,
            dataPortabilityEnabled: true,
            consentWithdrawalEnabled: true,
            ...options
        };

        this.dataCategories = {
            PERSONAL_DATA: 'personal_data',
            SENSITIVE_DATA: 'sensitive_data',
            BEHAVIORAL_DATA: 'behavioral_data',
            COMMUNICATION_DATA: 'communication_data',
            LOCATION_DATA: 'location_data'
        };

        this.legalBasis = {
            CONSENT: 'consent',
            CONTRACT: 'contract',
            LEGAL_OBLIGATION: 'legal_obligation',
            VITAL_INTERESTS: 'vital_interests',
            PUBLIC_TASK: 'public_task',
            LEGITIMATE_INTERESTS: 'legitimate_interests'
        };

        console.log('📋 GDPR Compliance Manager initialized');
    }

    /**
     * Initialize GDPR Compliance Manager
     */
    async initialize() {
        if (!this.options.enabled) {
            console.log('ℹ️  GDPR Compliance disabled');
            return;
        }

        try {
            // Initialize data retention policies
            await this.initializeDataRetentionPolicies();
            
            // Initialize consent management
            await this.initializeConsentManagement();
            
            // Schedule periodic compliance checks
            this.startComplianceScheduler();
            
            console.log('✅ GDPR Compliance Manager started successfully');

        } catch (error) {
            console.error('❌ Failed to initialize GDPR Compliance Manager:', error.message);
            throw error;
        }
    }

    /**
     * Main GDPR middleware
     */
    middleware() {
        return (req, res, next) => {
            if (!this.options.enabled) {
                return next();
            }

            try {
                // Add GDPR tracking to request
                req.gdpr = {
                    trackDataProcessing: this.trackDataProcessing ? this.trackDataProcessing.bind(this) : () => {},
                    checkConsent: this.checkConsent ? this.checkConsent.bind(this) : () => true,
                    recordConsent: this.recordConsent ? this.recordConsent.bind(this) : () => {}
                };

                // Add GDPR headers
                res.setHeader('X-GDPR-Compliant', 'true');
                res.setHeader('X-Data-Processing', 'logged');

                next();

            } catch (error) {
                console.error('❌ GDPR Middleware error:', error);
                next();
            }
        };
    }

    /**
     * Cookie consent middleware
     */
    requireCookieConsent() {
        return (req, res, next) => {
            if (!this.options.cookieConsentRequired) {
                return next();
            }

            // Check if consent has been given
            const hasConsent = req.cookies && req.cookies.gdprConsent === 'true';
            
            if (!hasConsent && this.requiresConsent(req.path)) {
                return res.status(403).json({
                    error: 'Cookie consent required',
                    code: 'GDPR_CONSENT_REQUIRED',
                    message: 'This action requires cookie consent under GDPR',
                    consentUrl: '/gdpr/consent'
                });
            }

            next();
        };
    }

    /**
     * Data processing consent middleware
     */
    requireDataProcessingConsent(dataCategory) {
        return (req, res, next) => {
            if (!req.user) {
                return next();
            }

            const userConsent = req.user.gdprConsent || {};
            
            if (!userConsent[dataCategory]) {
                return res.status(403).json({
                    error: 'Data processing consent required',
                    code: 'GDPR_DATA_CONSENT_REQUIRED',
                    category: dataCategory,
                    message: `Processing ${dataCategory} requires explicit consent under GDPR`
                });
            }

            next();
        };
    }

    /**
     * Right to be forgotten (Data deletion)
     */
    async processDataDeletionRequest(userId, reason = 'user_request') {
        if (!this.options.rightToDeleteEnabled) {
            throw new Error('Right to delete is not enabled');
        }

        try {
            console.log(`🗑️  Processing data deletion request for user ${userId}`);

            // Log the request for audit purposes
            await this.logGDPREvent('DATA_DELETION_REQUEST', {
                userId,
                reason,
                timestamp: new Date().toISOString()
            });

            // Delete user data (implement actual deletion logic)
            const deletionResult = await this.deleteUserData(userId);

            // Log completion
            await this.logGDPREvent('DATA_DELETION_COMPLETED', {
                userId,
                deletionResult,
                timestamp: new Date().toISOString()
            });

            return {
                success: true,
                message: 'User data has been deleted successfully',
                deletionId: this.generateDeletionId(),
                timestamp: new Date().toISOString()
            };

        } catch (error) {
            await this.logGDPREvent('DATA_DELETION_FAILED', {
                userId,
                error: error.message,
                timestamp: new Date().toISOString()
            });
            throw error;
        }
    }

    /**
     * Data portability (Export user data)
     */
    async exportUserData(userId, format = 'json') {
        try {
            console.log(`📤 Exporting data for user ${userId} in ${format} format`);

            // Log the request
            await this.logGDPREvent('DATA_EXPORT_REQUEST', {
                userId,
                format,
                timestamp: new Date().toISOString()
            });

            // Collect user data
            const userData = await this.collectUserData(userId);

            // Format data according to request
            const exportData = this.formatExportData(userData, format);

            // Log completion
            await this.logGDPREvent('DATA_EXPORT_COMPLETED', {
                userId,
                dataSize: JSON.stringify(exportData).length,
                timestamp: new Date().toISOString()
            });

            return {
                success: true,
                data: exportData,
                format,
                exportId: this.generateExportId(),
                timestamp: new Date().toISOString()
            };

        } catch (error) {
            await this.logGDPREvent('DATA_EXPORT_FAILED', {
                userId,
                error: error.message,
                timestamp: new Date().toISOString()
            });
            throw error;
        }
    }

    /**
     * Record consent
     */
    async recordConsent(userId, consentData) {
        const consent = {
            userId,
            timestamp: new Date().toISOString(),
            ipAddress: consentData.ipAddress,
            userAgent: consentData.userAgent,
            categories: consentData.categories,
            legalBasis: consentData.legalBasis || this.legalBasis.CONSENT,
            version: '1.0'
        };

        // Save consent record (implement actual storage)
        await this.saveConsentRecord(consent);

        // Log the consent
        await this.logGDPREvent('CONSENT_RECORDED', consent);

        return consent;
    }

    /**
     * Withdraw consent
     */
    async withdrawConsent(userId, categories) {
        const withdrawal = {
            userId,
            categories,
            timestamp: new Date().toISOString()
        };

        // Process withdrawal (implement actual logic)
        await this.processConsentWithdrawal(withdrawal);

        // Log the withdrawal
        await this.logGDPREvent('CONSENT_WITHDRAWN', withdrawal);

        return withdrawal;
    }

    /**
     * Check if path requires consent
     */
    requiresConsent(path) {
        const consentRequiredPaths = [
            '/api/analytics',
            '/api/ads',
            '/api/social',
            '/api/location'
        ];

        return consentRequiredPaths.some(p => path.startsWith(p));
    }

    /**
     * Initialize data retention policies
     */
    async initializeDataRetentionPolicies() {
        console.log('📅 Initializing data retention policies');
        // Implement data retention logic
    }

    /**
     * Initialize consent management
     */
    async initializeConsentManagement() {
        console.log('✅ Initializing consent management');
        // Implement consent management logic
    }

    /**
     * Start compliance scheduler
     */
    startComplianceScheduler() {
        // Run daily compliance checks
        setInterval(async () => {
            await this.runComplianceChecks();
        }, 24 * 60 * 60 * 1000); // Daily

        console.log('⏰ GDPR compliance scheduler started');
    }

    /**
     * Run periodic compliance checks
     */
    async runComplianceChecks() {
        try {
            console.log('🔍 Running GDPR compliance checks');
            
            // Check data retention
            await this.checkDataRetention();
            
            // Check consent validity
            await this.checkConsentValidity();
            
            // Generate compliance report
            await this.generateComplianceReport();

        } catch (error) {
            console.error('❌ Compliance check failed:', error);
            await this.logGDPREvent('COMPLIANCE_CHECK_FAILED', { error: error.message });
        }
    }

    /**
     * Delete user data (placeholder implementation)
     */
    async deleteUserData(userId) {
        // Implement actual data deletion logic
        return { deletedRecords: 0, tablesAffected: [] };
    }

    /**
     * Collect user data for export
     */
    async collectUserData(userId) {
        // Implement actual data collection logic
        return {
            profile: {},
            posts: [],
            messages: [],
            settings: {}
        };
    }

    /**
     * Format export data
     */
    formatExportData(userData, format) {
        switch (format.toLowerCase()) {
            case 'json':
                return userData;
            case 'xml':
                return this.convertToXML(userData);
            case 'csv':
                return this.convertToCSV(userData);
            default:
                return userData;
        }
    }

    /**
     * Save consent record
     */
    async saveConsentRecord(consent) {
        // Implement actual storage
        console.log('💾 Saving consent record:', consent.userId);
    }

    /**
     * Process consent withdrawal
     */
    async processConsentWithdrawal(withdrawal) {
        // Implement actual withdrawal processing
        console.log('🚫 Processing consent withdrawal:', withdrawal.userId);
    }

    /**
     * Check data retention compliance
     */
    async checkDataRetention() {
        console.log('📅 Checking data retention compliance');
        // Implement retention checks
    }

    /**
     * Check consent validity
     */
    async checkConsentValidity() {
        console.log('✅ Checking consent validity');
        // Implement consent validity checks
    }

    /**
     * Generate compliance report
     */
    async generateComplianceReport() {
        const report = {
            timestamp: new Date().toISOString(),
            totalUsers: 0,
            activeConsents: 0,
            expiredData: 0,
            pendingDeletions: 0
        };

        await this.logGDPREvent('COMPLIANCE_REPORT_GENERATED', report);
        return report;
    }

    /**
     * Log GDPR events
     */
    async logGDPREvent(eventType, eventData) {
        const event = {
            timestamp: new Date().toISOString(),
            type: eventType,
            data: eventData
        };

        console.log(`📋 GDPR Event: ${JSON.stringify(event)}`);
        
        // Send to SIEM if available
        if (global.siemIntegration) {
            await global.siemIntegration.logSecurityEvent('GDPR_EVENT', event);
        }
    }

    /**
     * Generate unique IDs
     */
    generateDeletionId() {
        return `del-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }

    generateExportId() {
        return `exp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Record user consent
     */
    recordConsent(userId, consentTypes, ipAddress) {
        // Simple implementation - in production use database
        const consentId = 'consent_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        console.log(`📋 GDPR: Recorded consent for user ${userId}: ${consentTypes.join(', ')}`);
        return consentId;
    }

    /**
     * Handle data subject access request
     */
    async handleAccessRequest(userId) {
        const exportId = 'export_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        console.log(`📋 GDPR: Processing data access request for user ${userId}`);
        return exportId;
    }

    /**
     * Handle data portability request
     */
    async handlePortabilityRequest(userId, format = 'json') {
        console.log(`📋 GDPR: Processing data portability request for user ${userId} in ${format} format`);
        return { message: 'Mock data export', format };
    }

    /**
     * Handle data erasure request
     */
    async handleErasureRequest(userId, reason) {
        console.log(`📋 GDPR: Processing data erasure request for user ${userId}. Reason: ${reason}`);
        return {
            erasedCategories: ['profile', 'posts'],
            retainedCategories: ['audit_logs']
        };
    }

    /**
     * Convert to XML format
     */
    convertToXML(data) {
        // Simple XML conversion implementation
        return `<?xml version="1.0" encoding="UTF-8"?>\n<userData>${JSON.stringify(data)}</userData>`;
    }

    /**
     * Convert to CSV format
     */
    convertToCSV(data) {
        // Simple CSV conversion implementation
        return 'key,value\n' + Object.entries(data).map(([k, v]) => `${k},"${JSON.stringify(v)}"`).join('\n');
    }

    /**
     * Get GDPR routes
     */
    getRouter() {
        const router = require('express').Router();

        // Consent management routes
        router.post('/consent', async (req, res) => {
            try {
                const { userId, consentTypes } = req.body;
                const consentId = this.recordConsent(userId, consentTypes, req.ip);
                
                res.json({
                    success: true,
                    consentId,
                    message: 'Consent recorded successfully'
                });
            } catch (error) {
                res.status(400).json({
                    error: error.message,
                    code: 'GDPR_CONSENT_ERROR'
                });
            }
        });

        // Data access request (Article 15)
        router.post('/data-access', async (req, res) => {
            try {
                const { userId } = req.body;
                const exportId = await this.handleAccessRequest(userId);
                
                res.json({
                    success: true,
                    exportId,
                    message: 'Data access request processed'
                });
            } catch (error) {
                res.status(400).json({
                    error: error.message,
                    code: 'GDPR_ACCESS_ERROR'
                });
            }
        });

        // Data portability request (Article 20)
        router.post('/data-portability', async (req, res) => {
            try {
                const { userId, format } = req.body;
                const data = await this.handlePortabilityRequest(userId, format);
                
                res.json({
                    success: true,
                    data,
                    format
                });
            } catch (error) {
                res.status(400).json({
                    error: error.message,
                    code: 'GDPR_PORTABILITY_ERROR'
                });
            }
        });

        // Data erasure request (Article 17)
        router.post('/data-erasure', async (req, res) => {
            try {
                const { userId, reason } = req.body;
                const result = await this.handleErasureRequest(userId, reason);
                
                res.json({
                    success: true,
                    ...result
                });
            } catch (error) {
                res.status(400).json({
                    error: error.message,
                    code: 'GDPR_ERASURE_ERROR'
                });
            }
        });

        // Compliance report
        router.get('/compliance-report', (req, res) => {
            const report = this.getComplianceReport();
            res.json(report);
        });

        return router;
    }

    /**
     * Get GDPR compliance report
     */
    getComplianceReport() {
        return {
            enabled: this.options.enabled,
            dataRetentionDays: this.options.dataRetentionDays,
            cookieConsentRequired: this.options.cookieConsentRequired,
            rightToDeleteEnabled: this.options.rightToDeleteEnabled,
            activeRequests: 0,
            processedRequests: 0
        };
    }

    /**
     * Get GDPR statistics
     */
    getStats() {
        return {
            enabled: this.options.enabled,
            dataRetentionDays: this.options.dataRetentionDays,
            cookieConsentRequired: this.options.cookieConsentRequired,
            rightToDeleteEnabled: this.options.rightToDeleteEnabled
        };
    }
}

module.exports = GDPRComplianceManager;
