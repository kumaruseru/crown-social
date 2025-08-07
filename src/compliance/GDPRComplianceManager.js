const crypto = require('crypto');
const User = require('../models/User');

/**
 * GDPR Compliance Manager
 * Quản lý tuân thủ GDPR và các quy định bảo vệ dữ liệu
 */
class GDPRComplianceManager {
    constructor() {
        this.dataRetentionPeriods = {
            user_data: 7 * 365 * 24 * 60 * 60 * 1000, // 7 years
            log_data: 365 * 24 * 60 * 60 * 1000, // 1 year
            session_data: 30 * 24 * 60 * 60 * 1000, // 30 days
            analytics_data: 26 * 30 * 24 * 60 * 60 * 1000, // 26 months
            marketing_data: 3 * 365 * 24 * 60 * 60 * 1000 // 3 years
        };
        
        this.legalBasisTypes = {
            CONSENT: 'consent',
            CONTRACT: 'contract',
            LEGAL_OBLIGATION: 'legal_obligation',
            VITAL_INTERESTS: 'vital_interests',
            PUBLIC_TASK: 'public_task',
            LEGITIMATE_INTERESTS: 'legitimate_interests'
        };
        
        this.initializeGDPRComponents();
    }

    /**
     * Initialize GDPR components
     */
    initializeGDPRComponents() {
        this.consentManager = new ConsentManager();
        this.dataProcessor = new PersonalDataProcessor();
        this.auditLogger = new GDPRAuditLogger();
        this.rightsFulfillment = new DataSubjectRightsFulfillment();
    }

    /**
     * Record consent with detailed tracking
     */
    async recordConsent(userId, consentType, details = {}) {
        const consentRecord = {
            userId: userId,
            consentType: consentType,
            timestamp: new Date(),
            ipAddress: details.ipAddress,
            userAgent: details.userAgent,
            version: details.privacyPolicyVersion || '1.0',
            method: details.method || 'explicit', // explicit, implicit, pre-ticked
            granularity: details.granularity || 'general', // general, specific, granular
            withdrawable: true,
            consentId: crypto.randomUUID()
        };

        // Store consent in database
        await this.consentManager.storeConsent(consentRecord);
        
        // Log for audit
        await this.auditLogger.logConsentAction('CONSENT_GIVEN', consentRecord);
        
        console.log(`✅ GDPR: Consent recorded for user ${userId} - ${consentType}`);
        return consentRecord.consentId;
    }

    /**
     * Withdraw consent
     */
    async withdrawConsent(userId, consentType, details = {}) {
        const withdrawalRecord = {
            userId: userId,
            consentType: consentType,
            timestamp: new Date(),
            ipAddress: details.ipAddress,
            reason: details.reason || 'user_request',
            withdrawalId: crypto.randomUUID()
        };

        await this.consentManager.withdrawConsent(userId, consentType);
        await this.auditLogger.logConsentAction('CONSENT_WITHDRAWN', withdrawalRecord);
        
        // Trigger data processing restrictions
        await this.restrictDataProcessing(userId, consentType);
        
        console.log(`🚫 GDPR: Consent withdrawn for user ${userId} - ${consentType}`);
        return withdrawalRecord.withdrawalId;
    }

    /**
     * Handle Right of Access (Article 15)
     */
    async handleDataAccessRequest(userId, requestDetails = {}) {
        const requestId = crypto.randomUUID();
        
        try {
            // Log the request
            await this.auditLogger.logRightRequest('ACCESS_REQUEST', {
                userId: userId,
                requestId: requestId,
                timestamp: new Date(),
                ...requestDetails
            });

            // Collect all personal data
            const personalData = await this.rightsFulfillment.collectPersonalData(userId);
            
            // Generate access report
            const accessReport = {
                requestId: requestId,
                userId: userId,
                generatedAt: new Date(),
                dataCategories: personalData.categories,
                processingPurposes: personalData.purposes,
                dataRecipients: personalData.recipients,
                retentionPeriods: personalData.retentionPeriods,
                userRights: this.getUserRights(),
                data: personalData.data
            };

            // Store the report (temporarily, with auto-deletion)
            await this.storeAccessReport(accessReport);
            
            console.log(`📋 GDPR: Access request processed - Request ID: ${requestId}`);
            return accessReport;
            
        } catch (error) {
            await this.auditLogger.logError('ACCESS_REQUEST_FAILED', {
                userId: userId,
                requestId: requestId,
                error: error.message
            });
            throw error;
        }
    }

    /**
     * Handle Right to Rectification (Article 16)
     */
    async handleRectificationRequest(userId, corrections, requestDetails = {}) {
        const requestId = crypto.randomUUID();
        
        try {
            await this.auditLogger.logRightRequest('RECTIFICATION_REQUEST', {
                userId: userId,
                requestId: requestId,
                corrections: corrections,
                timestamp: new Date(),
                ...requestDetails
            });

            // Apply corrections
            const updatedFields = await this.rightsFulfillment.applyCorrections(userId, corrections);
            
            // Notify third parties if data was shared
            await this.notifyThirdPartiesOfChanges(userId, updatedFields);
            
            console.log(`✏️ GDPR: Data rectification completed - Request ID: ${requestId}`);
            return { requestId, updatedFields };
            
        } catch (error) {
            await this.auditLogger.logError('RECTIFICATION_FAILED', {
                userId: userId,
                requestId: requestId,
                error: error.message
            });
            throw error;
        }
    }

    /**
     * Handle Right to Erasure (Article 17) - "Right to be Forgotten"
     */
    async handleErasureRequest(userId, requestDetails = {}) {
        const requestId = crypto.randomUUID();
        
        try {
            await this.auditLogger.logRightRequest('ERASURE_REQUEST', {
                userId: userId,
                requestId: requestId,
                timestamp: new Date(),
                ...requestDetails
            });

            // Check if erasure is possible (legal grounds, etc.)
            const erasureCheck = await this.checkErasureEligibility(userId);
            
            if (!erasureCheck.eligible) {
                throw new Error(`Erasure not possible: ${erasureCheck.reason}`);
            }

            // Perform erasure
            const erasureResult = await this.rightsFulfillment.erasePersonalData(userId);
            
            // Notify third parties
            await this.notifyThirdPartiesOfErasure(userId);
            
            console.log(`🗑️ GDPR: Data erasure completed - Request ID: ${requestId}`);
            return { requestId, erasureResult };
            
        } catch (error) {
            await this.auditLogger.logError('ERASURE_FAILED', {
                userId: userId,
                requestId: requestId,
                error: error.message
            });
            throw error;
        }
    }

    /**
     * Handle Right to Data Portability (Article 20)
     */
    async handlePortabilityRequest(userId, format = 'json', requestDetails = {}) {
        const requestId = crypto.randomUUID();
        
        try {
            await this.auditLogger.logRightRequest('PORTABILITY_REQUEST', {
                userId: userId,
                requestId: requestId,
                format: format,
                timestamp: new Date(),
                ...requestDetails
            });

            // Export data in requested format
            const exportData = await this.rightsFulfillment.exportPortableData(userId, format);
            
            // Generate secure download link
            const downloadToken = await this.generateSecureDownloadToken(requestId, userId);
            
            console.log(`📦 GDPR: Data portability request processed - Request ID: ${requestId}`);
            return { requestId, downloadToken, expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) };
            
        } catch (error) {
            await this.auditLogger.logError('PORTABILITY_FAILED', {
                userId: userId,
                requestId: requestId,
                error: error.message
            });
            throw error;
        }
    }

    /**
     * Handle Right to Restrict Processing (Article 18)
     */
    async handleRestrictionRequest(userId, restriction, requestDetails = {}) {
        const requestId = crypto.randomUUID();
        
        try {
            await this.auditLogger.logRightRequest('RESTRICTION_REQUEST', {
                userId: userId,
                requestId: requestId,
                restriction: restriction,
                timestamp: new Date(),
                ...requestDetails
            });

            // Apply processing restrictions
            await this.applyProcessingRestrictions(userId, restriction);
            
            console.log(`🚫 GDPR: Processing restriction applied - Request ID: ${requestId}`);
            return { requestId };
            
        } catch (error) {
            await this.auditLogger.logError('RESTRICTION_FAILED', {
                userId: userId,
                requestId: requestId,
                error: error.message
            });
            throw error;
        }
    }

    /**
     * Check data retention and cleanup
     */
    async performDataRetentionCleanup() {
        console.log('🧹 GDPR: Starting data retention cleanup...');
        
        const cleanupResults = {
            users: 0,
            logs: 0,
            sessions: 0,
            analytics: 0,
            marketing: 0
        };

        try {
            // Cleanup expired user data
            const expiredUsers = await this.findExpiredData('user_data');
            for (const user of expiredUsers) {
                if (await this.canDeleteUser(user.id)) {
                    await this.rightsFulfillment.erasePersonalData(user.id);
                    cleanupResults.users++;
                }
            }

            // Cleanup logs
            const expiredLogs = await this.findExpiredData('log_data');
            await this.deleteExpiredLogs(expiredLogs);
            cleanupResults.logs = expiredLogs.length;

            // Continue for other data types...
            
            await this.auditLogger.logDataRetentionCleanup(cleanupResults);
            console.log('✅ GDPR: Data retention cleanup completed', cleanupResults);
            
        } catch (error) {
            console.error('❌ GDPR: Data retention cleanup failed:', error);
            await this.auditLogger.logError('RETENTION_CLEANUP_FAILED', { error: error.message });
        }
    }

    /**
     * Generate privacy report for DPO
     */
    async generatePrivacyReport(startDate, endDate) {
        const report = {
            period: { startDate, endDate },
            generatedAt: new Date(),
            consentMetrics: await this.consentManager.getMetrics(startDate, endDate),
            requestsHandled: await this.auditLogger.getRightsRequestMetrics(startDate, endDate),
            dataBreaches: await this.auditLogger.getBreachMetrics(startDate, endDate),
            retentionCleanup: await this.auditLogger.getRetentionMetrics(startDate, endDate),
            complianceScore: await this.calculateComplianceScore()
        };

        return report;
    }

    /**
     * Data breach notification (Article 33-34)
     */
    async handleDataBreach(breachDetails) {
        const breachId = crypto.randomUUID();
        const breach = {
            breachId: breachId,
            timestamp: new Date(),
            severity: breachDetails.severity, // low, medium, high, critical
            affectedUsers: breachDetails.affectedUsers,
            dataTypes: breachDetails.dataTypes,
            cause: breachDetails.cause,
            containmentMeasures: breachDetails.containmentMeasures,
            reportedBy: breachDetails.reportedBy
        };

        // Log breach immediately
        await this.auditLogger.logDataBreach(breach);

        // Assess if notification is required (72 hours to supervisory authority)
        if (await this.requiresSupervisoryNotification(breach)) {
            await this.notifySupervisoryAuthority(breach);
        }

        // Assess if individual notification is required
        if (await this.requiresIndividualNotification(breach)) {
            await this.notifyAffectedIndividuals(breach);
        }

        console.log(`🚨 GDPR: Data breach handled - Breach ID: ${breachId}`);
        return breachId;
    }

    /**
     * Get user rights information
     */
    getUserRights() {
        return {
            access: 'Right to access personal data (Article 15)',
            rectification: 'Right to rectification (Article 16)',
            erasure: 'Right to erasure - "Right to be forgotten" (Article 17)',
            restriction: 'Right to restrict processing (Article 18)',
            portability: 'Right to data portability (Article 20)',
            object: 'Right to object to processing (Article 21)',
            withdraw_consent: 'Right to withdraw consent (Article 7)',
            complaint: 'Right to lodge a complaint with supervisory authority (Article 77)'
        };
    }

    /**
     * Middleware for GDPR consent checking
     */
    static consentCheckMiddleware() {
        return async (req, res, next) => {
            if (!req.user) {
                return next();
            }

            // Check if user has valid consent for current processing
            const gdprManager = new GDPRComplianceManager();
            const hasValidConsent = await gdprManager.consentManager.hasValidConsent(
                req.user.id,
                req.route?.path
            );

            if (!hasValidConsent && !req.path.includes('/consent')) {
                return res.status(451).json({
                    error: 'Legal compliance required',
                    message: 'Valid consent required for this operation',
                    consentRequired: true,
                    redirectTo: '/consent'
                });
            }

            next();
        };
    }
}

/**
 * Consent Manager - Handle consent records
 */
class ConsentManager {
    async storeConsent(consentRecord) {
        // Store in database with proper indexing
        // Implementation depends on database choice
        console.log('Storing consent:', consentRecord.consentId);
    }

    async withdrawConsent(userId, consentType) {
        // Mark consent as withdrawn in database
        console.log('Withdrawing consent:', userId, consentType);
    }

    async hasValidConsent(userId, context) {
        // Check if user has valid consent for specific context
        return true; // Placeholder
    }

    async getMetrics(startDate, endDate) {
        // Return consent metrics for reporting
        return {
            totalConsents: 0,
            consentsByType: {},
            withdrawalRate: 0
        };
    }
}

/**
 * Personal Data Processor - Handle data operations
 */
class PersonalDataProcessor {
    async collectPersonalData(userId) {
        // Collect all personal data for access request
        return {
            categories: [],
            purposes: [],
            recipients: [],
            retentionPeriods: {},
            data: {}
        };
    }

    async applyCorrections(userId, corrections) {
        // Apply data corrections
        return [];
    }

    async erasePersonalData(userId) {
        // Perform data erasure
        return { deletedRecords: 0 };
    }

    async exportPortableData(userId, format) {
        // Export data in portable format
        return {};
    }
}

/**
 * Data Subject Rights Fulfillment
 */
class DataSubjectRightsFulfillment extends PersonalDataProcessor {
    // Inherit methods from PersonalDataProcessor
}

/**
 * GDPR Audit Logger
 */
class GDPRAuditLogger {
    async logConsentAction(action, details) {
        console.log(`GDPR Audit: ${action}`, details);
    }

    async logRightRequest(requestType, details) {
        console.log(`GDPR Audit: ${requestType}`, details);
    }

    async logError(errorType, details) {
        console.error(`GDPR Error: ${errorType}`, details);
    }

    async logDataBreach(breach) {
        console.error('GDPR Data Breach:', breach);
    }

    async logDataRetentionCleanup(results) {
        console.log('GDPR Retention Cleanup:', results);
    }

    async getRightsRequestMetrics(startDate, endDate) {
        return { totalRequests: 0, requestsByType: {} };
    }

    async getBreachMetrics(startDate, endDate) {
        return { totalBreaches: 0, breachesBySeverity: {} };
    }

    async getRetentionMetrics(startDate, endDate) {
        return { deletedRecords: 0, retentionPoliciesApplied: 0 };
    }
}

module.exports = GDPRComplianceManager;
