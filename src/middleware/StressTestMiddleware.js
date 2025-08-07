/**
 * Stress Testing Middleware - Bypass authentication for stress tests
 */

const isStressTestUser = (req) => {
    const userAgent = req.get('User-Agent') || '';
    const isStressTest = userAgent.includes('Crown-Stress-Test');
    const isTestMode = process.env.NODE_ENV === 'test';
    return isStressTest || isTestMode;
};

const stressTestBypass = (req, res, next) => {
    if (isStressTestUser(req)) {
        // Create mock user for stress testing
        req.user = {
            _id: 'stress_test_user',
            email: 'stresstest@crown.local',
            firstName: 'Stress',
            lastName: 'Test',
            username: 'stresstest'
        };
        req.isAuthenticated = () => true;
    }
    next();
};

const publicEndpointsForTesting = [
    '/health',
    '/api/posts/status',
    '/api/news/status', 
    '/api/auth/status',
    '/api/users/status',
    '/api/settings/status',
    '/api/gdpr/status',
    '/api/integration',
    '/api/native',
    '/api/orchestrator'
];

const isPublicEndpoint = (path) => {
    return publicEndpointsForTesting.some(endpoint => path.startsWith(endpoint));
};

const conditionalAuth = (req, res, next) => {
    // Always allow public endpoints
    if (isPublicEndpoint(req.path)) {
        return next();
    }
    
    // Bypass auth for stress testing on specific endpoints
    if (isStressTestUser(req)) {
        const testableEndpoints = [
            '/api/posts',
            '/api/news',
            '/login.html',
            '/register.html'
        ];
        
        if (testableEndpoints.some(endpoint => req.path.startsWith(endpoint))) {
            req.user = {
                _id: 'stress_test_user',
                email: 'stresstest@crown.local', 
                firstName: 'Stress',
                lastName: 'Test',
                username: 'stresstest'
            };
            req.isAuthenticated = () => true;
            return next();
        }
    }
    
    next();
};

module.exports = {
    stressTestBypass,
    conditionalAuth,
    isStressTestUser,
    isPublicEndpoint
};
