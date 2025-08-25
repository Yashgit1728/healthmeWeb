"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const env_1 = require("./env"); // Must be first import
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const compression_1 = __importDefault(require("compression"));
const helmet_1 = __importDefault(require("helmet"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const zod_1 = require("zod");
const generative_ai_1 = require("@google/generative-ai");
const reflections_1 = __importDefault(require("./routes/reflections"));
const stats_1 = __importDefault(require("./routes/stats"));
const auth_1 = __importDefault(require("./routes/auth"));
const auth_2 = require("./middleware/auth");
const app = (0, express_1.default)();
// Security middleware
app.use((0, helmet_1.default)({
    contentSecurityPolicy: false, // Disable for development
    crossOriginEmbedderPolicy: false
}));
// Compression middleware
app.use((0, compression_1.default)());
// Rate limiting
const limiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: {
        error: 'Too many requests from this IP, please try again later.',
        retryAfter: '15 minutes'
    },
    standardHeaders: true,
    legacyHeaders: false,
});
// Apply rate limiting to all routes
app.use(limiter);
// Stricter rate limiting for AI endpoints
const aiLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 20, // limit each IP to 20 AI requests per windowMs
    message: {
        error: 'Too many AI requests from this IP, please try again later.',
        retryAfter: '15 minutes'
    },
});
// Middleware
app.use((0, cors_1.default)({
    origin: process.env.NODE_ENV === 'production'
        ? ['https://yourdomain.com'] // Update with your production domain
        : ['http://localhost:5173', 'http://localhost:3000'],
    credentials: true
}));
app.use(express_1.default.json({ limit: '10mb' })); // Limit request body size
app.use(express_1.default.urlencoded({ extended: true, limit: '10mb' }));
app.use((0, cookie_parser_1.default)());
// Performance monitoring middleware
app.use((req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
        const duration = Date.now() - start;
        console.log(`${req.method} ${req.path} - ${res.statusCode} - ${duration}ms`);
        // Log slow requests
        if (duration > 1000) {
            console.warn(`⚠️  Slow request: ${req.method} ${req.path} took ${duration}ms`);
        }
    });
    next();
});
// Request validation schema
const ReflectRequestSchema = zod_1.z.object({
    entry: zod_1.z.string().min(1, "Journal entry is required").max(10000, "Entry too long"),
    type: zod_1.z.enum(['feeling', 'reflection']).default('reflection')
});
// Global error handling middleware
app.use((error, req, res, next) => {
    console.error('Global error handler:', error);
    if (error.name === 'ValidationError') {
        return res.status(400).json({
            error: 'Validation failed',
            details: error.message
        });
    }
    if (error.name === 'UnauthorizedError') {
        return res.status(401).json({
            error: 'Authentication required'
        });
    }
    res.status(500).json({
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
    });
});
// Health check endpoint
app.get('/health', (_req, res) => {
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: env_1.ENV.NODE_ENV
    });
});
// Status endpoint to check API configuration
app.get('/status', (_req, res) => {
    res.json({
        geminiApiConfigured: true,
        environment: env_1.ENV.NODE_ENV,
        message: 'Server is running',
        version: '1.0.0',
        timestamp: new Date().toISOString()
    });
});
// Test Gemini API and list available models
app.get('/test-gemini', aiLimiter, async (_req, res) => {
    try {
        const genAI = new generative_ai_1.GoogleGenerativeAI(env_1.ENV.GOOGLE_API_KEY);
        // Test with a simple prompt
        const testModel = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const result = await testModel.generateContent("Say hello in one word");
        const response = result.response.text();
        res.json({
            success: true,
            testResponse: response,
            message: 'Gemini API is working!',
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        console.error('Gemini test error:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        res.status(500).json({
            success: false,
            error: errorMessage,
            message: 'Gemini API test failed',
            timestamp: new Date().toISOString()
        });
    }
});
// Routes
app.use('/auth', auth_1.default);
app.use('/reflections', auth_2.authMiddleware, reflections_1.default);
app.use('/stats', auth_2.authMiddleware, stats_1.default);
// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({
        error: 'Endpoint not found',
        path: req.originalUrl,
        method: req.method,
        availableEndpoints: [
            'GET /health',
            'GET /status',
            'GET /test-gemini',
            'POST /auth/login',
            'POST /auth/register',
            'GET /reflections',
            'POST /reflections',
            'GET /stats'
        ]
    });
});
app.listen(Number(env_1.ENV.PORT), () => {
    console.log(`🚀 Server running on port ${env_1.ENV.PORT}`);
    console.log(`📊 Health check: http://localhost:${env_1.ENV.PORT}/health`);
    console.log(`🔍 Status: http://localhost:${env_1.ENV.PORT}/status`);
});
