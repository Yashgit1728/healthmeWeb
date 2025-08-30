import { ENV } from './env'; // Must be first import
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import compression from 'compression';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { z } from 'zod';
import { GoogleGenerativeAI } from '@google/generative-ai';
import reflectionsRouter from './routes/reflections';
import statsRouter from './routes/stats';
import authRouter from './routes/auth';
import { authMiddleware } from './middleware/auth';

const app = express();

// Security middleware
app.use(helmet({
  contentSecurityPolicy: false, // Disable for development
  crossOriginEmbedderPolicy: false
}));

// Compression middleware
app.use(compression());

// Rate limiting
const limiter = rateLimit({
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
const aiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // limit each IP to 20 AI requests per windowMs
  message: {
    error: 'Too many AI requests from this IP, please try again later.',
    retryAfter: '15 minutes'
  },
});

// Middleware
app.use(cors({ 
  origin: process.env.NODE_ENV === 'production' 
    ? [process.env.FRONTEND_URL || 'https://your-frontend-domain.com']
    : ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:3000'],
  credentials: true
}));
app.use(express.json({ limit: '10mb' })); // Limit request body size
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Performance monitoring middleware
app.use((req: Request, res: Response, next: NextFunction) => {
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
const ReflectRequestSchema = z.object({
  entry: z.string().min(1, "Journal entry is required").max(10000, "Entry too long"),
  type: z.enum(['feeling', 'reflection']).default('reflection')
});

// Global error handling middleware
app.use((error: Error, req: Request, res: Response, next: NextFunction) => {
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
app.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: ENV.NODE_ENV
  });
});

// Status endpoint to check API configuration
app.get('/status', (_req: Request, res: Response) => {
  res.json({
    geminiApiConfigured: true,
    environment: ENV.NODE_ENV,
    message: 'Server is running',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// Test Gemini API and list available models
app.get('/test-gemini', aiLimiter, async (_req: Request, res: Response) => {
  try {
    const genAI = new GoogleGenerativeAI(ENV.GOOGLE_API_KEY);
    
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
  } catch (error) {
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
app.use('/auth', authRouter);
app.use('/reflections', authMiddleware, reflectionsRouter);
app.use('/stats', authMiddleware, statsRouter);
// server/src/index.ts
app.head('/', (_req, res) => res.sendStatus(200));        // quiet probes
app.get('/', (_req, res) => res.redirect('/health'));     // or send JSON
// app.get('/', (_req, res) => res.json({ ok: true, tip: 'See /health' }));

// 404 handler
app.use('*', (req: Request, res: Response) => {
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

app.listen(Number(ENV.PORT), () => {
  console.log(`🚀 Server running on port ${ENV.PORT}`);
  console.log(`📊 Health check: http://localhost:${ENV.PORT}/health`);
  console.log(`🔍 Status: http://localhost:${ENV.PORT}/status`);
});