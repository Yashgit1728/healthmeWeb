"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.userRateLimit = exports.performanceMonitor = exports.validateRequest = exports.optimizeResponse = exports.validateRequestSize = void 0;
// Request size validation
const validateRequestSize = (maxSize = '10mb') => {
    return (req, res, next) => {
        const contentLength = parseInt(req.headers['content-length'] || '0');
        const maxSizeBytes = parseSize(maxSize);
        if (contentLength > maxSizeBytes) {
            return res.status(413).json({
                error: 'Request too large',
                code: 'PAYLOAD_TOO_LARGE',
                maxSize,
                actualSize: formatBytes(contentLength)
            });
        }
        next();
    };
};
exports.validateRequestSize = validateRequestSize;
// Response optimization middleware
const optimizeResponse = (req, res, next) => {
    // Add cache headers for GET requests
    if (req.method === 'GET') {
        res.set('Cache-Control', 'private, max-age=300'); // 5 minutes
    }
    // Add performance headers
    res.set('X-Response-Time', '0ms');
    res.set('X-Content-Type-Options', 'nosniff');
    res.set('X-Frame-Options', 'DENY');
    next();
};
exports.optimizeResponse = optimizeResponse;
// Request validation middleware
const validateRequest = (schema) => {
    return (req, res, next) => {
        const result = schema.safeParse(req.body);
        if (!result.success) {
            return res.status(400).json({
                error: 'Validation failed',
                code: 'VALIDATION_ERROR',
                details: result.error.issues.map(issue => ({
                    field: issue.path.join('.'),
                    message: issue.message,
                    code: issue.code
                }))
            });
        }
        // Replace request body with validated data
        req.body = result.data;
        next();
    };
};
exports.validateRequest = validateRequest;
// Performance monitoring middleware
const performanceMonitor = (req, res, next) => {
    const start = process.hrtime.bigint();
    res.on('finish', () => {
        const end = process.hrtime.bigint();
        const duration = Number(end - start) / 1000000; // Convert to milliseconds
        // Log performance metrics
        console.log(`📊 ${req.method} ${req.path} - ${res.statusCode} - ${duration.toFixed(2)}ms`);
        // Log slow requests
        if (duration > 1000) {
            console.warn(`⚠️  Slow request: ${req.method} ${req.path} took ${duration.toFixed(2)}ms`);
        }
        // Log very fast requests (potential caching opportunities)
        if (duration < 50) {
            console.log(`⚡ Fast request: ${req.method} ${req.path} took ${duration.toFixed(2)}ms`);
        }
    });
    next();
};
exports.performanceMonitor = performanceMonitor;
// Rate limiting per user (more granular than IP-based)
const userRequests = new Map();
const userRateLimit = (maxRequests = 100, windowMs = 15 * 60 * 1000) => {
    return (req, res, next) => {
        const userId = req.user?.id;
        if (!userId) {
            return next(); // Skip for unauthenticated requests
        }
        const now = Date.now();
        const userData = userRequests.get(userId);
        if (!userData || now > userData.resetTime) {
            userRequests.set(userId, { count: 1, resetTime: now + windowMs });
        }
        else if (userData.count >= maxRequests) {
            return res.status(429).json({
                error: 'Rate limit exceeded',
                code: 'RATE_LIMIT_EXCEEDED',
                retryAfter: Math.ceil((userData.resetTime - now) / 1000),
                limit: maxRequests,
                window: Math.ceil(windowMs / 1000)
            });
        }
        else {
            userData.count++;
        }
        // Add rate limit headers
        res.set('X-RateLimit-Limit', maxRequests.toString());
        res.set('X-RateLimit-Remaining', Math.max(0, maxRequests - (userData?.count || 0)).toString());
        res.set('X-RateLimit-Reset', (userData?.resetTime || 0).toString());
        next();
    };
};
exports.userRateLimit = userRateLimit;
// Utility functions
function parseSize(size) {
    const units = {
        'b': 1,
        'kb': 1024,
        'mb': 1024 * 1024,
        'gb': 1024 * 1024 * 1024
    };
    const match = size.toLowerCase().match(/^(\d+(?:\.\d+)?)\s*(b|kb|mb|gb)$/);
    if (!match)
        return 10 * 1024 * 1024; // Default to 10MB
    const value = parseFloat(match[1]);
    const unit = match[2];
    return value * units[unit];
}
function formatBytes(bytes) {
    if (bytes === 0)
        return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}
// Clean up old rate limit data periodically
setInterval(() => {
    const now = Date.now();
    for (const [userId, data] of userRequests.entries()) {
        if (now > data.resetTime) {
            userRequests.delete(userId);
        }
    }
}, 60 * 1000); // Clean up every minute
