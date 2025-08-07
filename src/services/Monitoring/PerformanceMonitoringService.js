/**
 * Performance Monitoring Service - Real-time performance tracking
 * Phase 1 Completion - Multi-language Performance Integration
 * 
 * Features:
 * - Real-time performance metrics
 * - Application monitoring
 * - Resource usage tracking
 * - Response time analysis
 * - Error rate monitoring
 * - Service health checks
 */

const axios = require('axios');
const os = require('os');
const { performance } = require('perf_hooks');

class PerformanceMonitoringService {
    constructor() {
        this.services = {
            go: {
                url: process.env.GO_MONITORING_URL || 'http://localhost:8000',
                enabled: process.env.GO_MONITORING_ENABLED !== 'false'
            },
            rust: {
                url: process.env.RUST_MONITORING_URL || 'http://localhost:3030',
                enabled: process.env.RUST_MONITORING_ENABLED !== 'false'
            },
            elixir: {
                url: process.env.ELIXIR_MONITORING_URL || 'http://localhost:4000',
                enabled: process.env.ELIXIR_MONITORING_ENABLED !== 'false'
            }
        };

        this.metrics = {
            requests: new Map(),
            responses: new Map(),
            errors: new Map(),
            resources: [],
            services: new Map()
        };

        this.config = {
            metricsRetention: 24 * 60 * 60 * 1000, // 24 hours
            healthCheckInterval: 30000, // 30 seconds
            metricsFlushInterval: 60000, // 1 minute
            alertThresholds: {
                responseTime: 2000, // 2 seconds
                errorRate: 0.05, // 5%
                cpuUsage: 0.8, // 80%
                memoryUsage: 0.85 // 85%
            }
        };

        this.init();
    }

    async init() {
        console.log('📊 Initializing Performance Monitoring Service...');
        
        // Start monitoring loops
        this.startResourceMonitoring();
        this.startServiceHealthChecks();
        this.startMetricsCollection();
        
        // Test monitoring services
        await this.testMonitoringServices();
        
        console.log('✅ Performance Monitoring Service initialized');
    }

    async testMonitoringServices() {
        const testPromises = Object.entries(this.services)
            .filter(([, config]) => config.enabled)
            .map(([service, config]) => this.testServiceHealth(service, config.url));

        await Promise.allSettled(testPromises);
    }

    async testServiceHealth(service, url) {
        try {
            const startTime = performance.now();
            const response = await axios.get(`${url}/health`, { timeout: 5000 });
            const responseTime = performance.now() - startTime;

            if (response.status === 200) {
                console.log(`✅ ${service.toUpperCase()} monitoring service connected (${responseTime.toFixed(2)}ms)`);
                this.updateServiceMetrics(service, { status: 'healthy', responseTime });
                return true;
            }
        } catch (error) {
            console.log(`⚠️ ${service.toUpperCase()} monitoring service unavailable`);
            this.services[service].enabled = false;
            this.updateServiceMetrics(service, { status: 'unhealthy', error: error.message });
            return false;
        }
    }

    /**
     * Request/Response Monitoring
     */
    startRequestMonitoring() {
        return (req, res, next) => {
            const startTime = performance.now();
            const requestId = this.generateRequestId();
            
            req.performanceId = requestId;
            req.startTime = startTime;

            // Log request start
            this.logRequest(requestId, {
                method: req.method,
                url: req.url,
                userAgent: req.headers['user-agent'],
                ip: req.ip,
                startTime
            });

            // Override res.end to capture response metrics
            const originalEnd = res.end;
            res.end = (...args) => {
                const endTime = performance.now();
                const responseTime = endTime - startTime;

                this.logResponse(requestId, {
                    statusCode: res.statusCode,
                    responseTime,
                    contentLength: res.getHeader('content-length') || 0,
                    endTime
                });

                originalEnd.apply(res, args);
            };

            next();
        };
    }

    /**
     * Resource Monitoring
     */
    startResourceMonitoring() {
        setInterval(() => {
            this.collectResourceMetrics();
        }, this.config.healthCheckInterval);
    }

    async collectResourceMetrics() {
        try {
            const metrics = {
                timestamp: new Date(),
                cpu: {
                    usage: await this.getCPUUsage(),
                    loadAverage: os.loadavg()
                },
                memory: {
                    usage: this.getMemoryUsage(),
                    free: os.freemem(),
                    total: os.totalmem()
                },
                process: {
                    pid: process.pid,
                    uptime: process.uptime(),
                    memoryUsage: process.memoryUsage()
                },
                node: {
                    version: process.version,
                    platform: process.platform,
                    arch: process.arch
                }
            };

            this.metrics.resources.push(metrics);
            
            // Keep only recent metrics
            this.cleanupOldMetrics();
            
            // Check for alerts
            await this.checkResourceAlerts(metrics);
            
            // Send to monitoring services
            await this.sendMetricsToServices(metrics);

        } catch (error) {
            console.error('Resource metrics collection error:', error);
        }
    }

    /**
     * Service Health Checks
     */
    startServiceHealthChecks() {
        setInterval(() => {
            this.performHealthChecks();
        }, this.config.healthCheckInterval);
    }

    async performHealthChecks() {
        const healthCheckPromises = Object.entries(this.services)
            .filter(([, config]) => config.enabled)
            .map(([service, config]) => this.checkServiceHealth(service, config.url));

        await Promise.allSettled(healthCheckPromises);
    }

    async checkServiceHealth(service, url) {
        try {
            const startTime = performance.now();
            const response = await axios.get(`${url}/health`, { timeout: 5000 });
            const responseTime = performance.now() - startTime;

            const healthData = {
                service,
                status: response.status === 200 ? 'healthy' : 'unhealthy',
                responseTime,
                timestamp: new Date(),
                details: response.data || {}
            };

            this.updateServiceMetrics(service, healthData);
            return healthData;

        } catch (error) {
            const healthData = {
                service,
                status: 'unhealthy',
                error: error.message,
                timestamp: new Date()
            };

            this.updateServiceMetrics(service, healthData);
            return healthData;
        }
    }

    /**
     * Performance Analytics
     */
    async getPerformanceAnalytics(timeRange = '1h') {
        try {
            const now = Date.now();
            const timeRangeMs = this.parseTimeRange(timeRange);
            const cutoff = now - timeRangeMs;

            // Aggregate request/response metrics
            const requestMetrics = this.aggregateRequestMetrics(cutoff);
            
            // Get resource metrics
            const resourceMetrics = this.metrics.resources
                .filter(metric => metric.timestamp.getTime() > cutoff);

            // Calculate performance indicators
            const kpis = this.calculateKPIs(requestMetrics, resourceMetrics);

            // Service status overview
            const serviceStatus = this.getServiceStatusOverview();

            return {
                timeRange,
                kpis,
                requests: requestMetrics,
                resources: this.summarizeResourceMetrics(resourceMetrics),
                services: serviceStatus,
                alerts: await this.getActiveAlerts(),
                generatedAt: new Date()
            };

        } catch (error) {
            console.error('Performance analytics error:', error);
            return {
                error: error.message,
                generatedAt: new Date()
            };
        }
    }

    /**
     * Real-time Metrics API
     */
    async getRealTimeMetrics() {
        const currentMetrics = this.metrics.resources[this.metrics.resources.length - 1];
        const recentRequests = Array.from(this.metrics.requests.values())
            .slice(-100); // Last 100 requests

        return {
            current: {
                timestamp: new Date(),
                cpu: currentMetrics?.cpu || { usage: 0 },
                memory: currentMetrics?.memory || { usage: 0 },
                activeRequests: this.getActiveRequestsCount(),
                responseTime: this.getAverageResponseTime('5m'),
                errorRate: this.getErrorRate('5m')
            },
            recent: {
                requests: recentRequests.length,
                errors: this.getRecentErrorCount(),
                slowRequests: this.getSlowRequestsCount()
            },
            services: this.getServiceStatusOverview()
        };
    }

    /**
     * Error Tracking
     */
    async logError(error, context = {}) {
        const errorData = {
            message: error.message,
            stack: error.stack,
            timestamp: new Date(),
            context,
            severity: this.categorizeError(error)
        };

        const errorId = this.generateErrorId();
        this.metrics.errors.set(errorId, errorData);

        // Send to error tracking services
        if (this.services.elixir.enabled) {
            try {
                await axios.post(
                    `${this.services.elixir.url}/errors/track`,
                    errorData,
                    { timeout: 5000 }
                );
            } catch (err) {
                console.error('Error tracking service error:', err.message);
            }
        }

        return errorId;
    }

    /**
     * Custom Metrics
     */
    async recordCustomMetric(name, value, tags = {}) {
        const metric = {
            name,
            value,
            tags,
            timestamp: new Date()
        };

        // Store locally
        if (!this.customMetrics) {
            this.customMetrics = [];
        }
        this.customMetrics.push(metric);

        // Send to monitoring services
        if (this.services.go.enabled) {
            try {
                await axios.post(
                    `${this.services.go.url}/metrics/custom`,
                    metric,
                    { timeout: 5000 }
                );
            } catch (error) {
                console.error('Custom metrics error:', error.message);
            }
        }

        return metric;
    }

    /**
     * Alerting System
     */
    async checkResourceAlerts(metrics) {
        const alerts = [];

        // CPU usage alert
        if (metrics.cpu.usage > this.config.alertThresholds.cpuUsage) {
            alerts.push({
                type: 'cpu_high',
                severity: 'warning',
                message: `High CPU usage: ${(metrics.cpu.usage * 100).toFixed(1)}%`,
                value: metrics.cpu.usage,
                threshold: this.config.alertThresholds.cpuUsage
            });
        }

        // Memory usage alert
        if (metrics.memory.usage > this.config.alertThresholds.memoryUsage) {
            alerts.push({
                type: 'memory_high',
                severity: 'warning',
                message: `High memory usage: ${(metrics.memory.usage * 100).toFixed(1)}%`,
                value: metrics.memory.usage,
                threshold: this.config.alertThresholds.memoryUsage
            });
        }

        // Process alerts if any
        if (alerts.length > 0) {
            await this.processAlerts(alerts);
        }

        return alerts;
    }

    async processAlerts(alerts) {
        for (const alert of alerts) {
            console.warn(`🚨 PERFORMANCE ALERT: ${alert.message}`);
            
            // Send to alerting services
            if (this.services.elixir.enabled) {
                try {
                    await axios.post(
                        `${this.services.elixir.url}/alerts/send`,
                        alert,
                        { timeout: 5000 }
                    );
                } catch (error) {
                    console.error('Alert sending error:', error.message);
                }
            }
        }
    }

    /**
     * Utility Methods
     */
    getCPUUsage() {
        return new Promise((resolve) => {
            const startUsage = process.cpuUsage();
            setTimeout(() => {
                const endUsage = process.cpuUsage(startUsage);
                const totalUsage = endUsage.user + endUsage.system;
                const usage = totalUsage / 1000000 / 1000; // Convert to percentage
                resolve(Math.min(usage, 1));
            }, 100);
        });
    }

    getMemoryUsage() {
        const totalMemory = os.totalmem();
        const freeMemory = os.freemem();
        const usedMemory = totalMemory - freeMemory;
        return usedMemory / totalMemory;
    }

    generateRequestId() {
        return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    generateErrorId() {
        return `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    logRequest(id, data) {
        this.metrics.requests.set(id, { ...data, type: 'request' });
    }

    logResponse(id, data) {
        const requestData = this.metrics.requests.get(id);
        if (requestData) {
            this.metrics.responses.set(id, { ...requestData, ...data, type: 'response' });
        }
    }

    updateServiceMetrics(service, data) {
        if (!this.metrics.services.has(service)) {
            this.metrics.services.set(service, []);
        }
        
        const serviceMetrics = this.metrics.services.get(service);
        serviceMetrics.push(data);
        
        // Keep only recent metrics (last hour)
        const cutoff = Date.now() - 60 * 60 * 1000;
        const filtered = serviceMetrics.filter(metric => 
            metric.timestamp && metric.timestamp.getTime() > cutoff
        );
        
        this.metrics.services.set(service, filtered);
    }

    cleanupOldMetrics() {
        const cutoff = Date.now() - this.config.metricsRetention;

        // Cleanup resource metrics
        this.metrics.resources = this.metrics.resources.filter(
            metric => metric.timestamp.getTime() > cutoff
        );

        // Cleanup request/response metrics
        for (const [id, data] of this.metrics.requests.entries()) {
            if (data.startTime < cutoff) {
                this.metrics.requests.delete(id);
            }
        }

        for (const [id, data] of this.metrics.responses.entries()) {
            if (data.startTime < cutoff) {
                this.metrics.responses.delete(id);
            }
        }
    }

    parseTimeRange(timeRange) {
        const units = {
            's': 1000,
            'm': 60 * 1000,
            'h': 60 * 60 * 1000,
            'd': 24 * 60 * 60 * 1000
        };

        const match = timeRange.match(/^(\d+)([smhd])$/);
        if (!match) return 60 * 60 * 1000; // Default 1 hour

        const [, value, unit] = match;
        return parseInt(value) * units[unit];
    }

    // Additional utility methods for metrics calculation
    aggregateRequestMetrics(cutoff) {
        const requests = Array.from(this.metrics.responses.values())
            .filter(req => req.startTime > cutoff);

        return {
            total: requests.length,
            byStatus: this.groupByStatus(requests),
            averageResponseTime: this.calculateAverageResponseTime(requests),
            slowRequests: requests.filter(req => req.responseTime > this.config.alertThresholds.responseTime).length
        };
    }

    calculateKPIs(requests, resources) {
        return {
            totalRequests: requests.total,
            averageResponseTime: requests.averageResponseTime,
            errorRate: this.calculateErrorRate(requests),
            throughput: this.calculateThroughput(requests),
            availability: this.calculateAvailability(),
            averageCPU: this.calculateAverageMetric(resources, 'cpu.usage'),
            averageMemory: this.calculateAverageMetric(resources, 'memory.usage')
        };
    }

    getActiveRequestsCount() {
        const activeRequests = Array.from(this.metrics.requests.keys())
            .filter(id => !this.metrics.responses.has(id));
        return activeRequests.length;
    }

    getAverageResponseTime(timeRange) {
        const cutoff = Date.now() - this.parseTimeRange(timeRange);
        const responses = Array.from(this.metrics.responses.values())
            .filter(res => res.startTime > cutoff);
        
        if (responses.length === 0) return 0;
        
        const total = responses.reduce((sum, res) => sum + res.responseTime, 0);
        return total / responses.length;
    }

    getErrorRate(timeRange) {
        const cutoff = Date.now() - this.parseTimeRange(timeRange);
        const responses = Array.from(this.metrics.responses.values())
            .filter(res => res.startTime > cutoff);
        
        if (responses.length === 0) return 0;
        
        const errors = responses.filter(res => res.statusCode >= 400).length;
        return errors / responses.length;
    }

    async sendMetricsToServices(metrics) {
        const promises = Object.entries(this.services)
            .filter(([, config]) => config.enabled)
            .map(([service, config]) => this.sendMetricsToService(service, config.url, metrics));

        await Promise.allSettled(promises);
    }

    async sendMetricsToService(service, url, metrics) {
        try {
            await axios.post(
                `${url}/metrics/ingest`,
                metrics,
                { timeout: 5000 }
            );
        } catch (error) {
            // Silently fail - metrics delivery is not critical
        }
    }

    startMetricsCollection() {
        setInterval(() => {
            this.collectResourceMetrics();
        }, this.config.metricsFlushInterval);
    }

    // Placeholder methods for complex calculations
    groupByStatus(requests) { return {}; }
    calculateAverageResponseTime(requests) { return 0; }
    calculateErrorRate(requests) { return 0; }
    calculateThroughput(requests) { return 0; }
    calculateAvailability() { return 1; }
    calculateAverageMetric(resources, path) { return 0; }
    summarizeResourceMetrics(resources) { return {}; }
    getServiceStatusOverview() { return {}; }
    getActiveAlerts() { return []; }
    getRecentErrorCount() { return 0; }
    getSlowRequestsCount() { return 0; }
    categorizeError(error) { return 'error'; }
}

module.exports = new PerformanceMonitoringService();
