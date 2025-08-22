import { ENV } from './env'; // Must be first import
import express, { Request, Response } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { z } from 'zod';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { genAI } from './gemini';
import { counselorPrompt } from './prompts';
import reflectionsRouter from './routes/reflections';
import statsRouter from './routes/stats';
import authRouter from './routes/auth';
import { authMiddleware } from './middleware/auth';

const app = express();

// Middleware
app.use(cors({ 
  origin: 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());

// Request validation schema
const ReflectRequestSchema = z.object({
  entry: z.string().min(1, "Journal entry is required"),
  type: z.enum(['feeling', 'reflection']).default('reflection')
});

// Status endpoint to check API configuration
app.get('/status', (_req: Request, res: Response) => {
  res.json({
    geminiApiConfigured: true,
    environment: ENV.NODE_ENV,
    message: 'Server is running'
  });
});

// Test Gemini API and list available models
app.get('/test-gemini', async (_req: Request, res: Response) => {
  try {
    const genAI = new GoogleGenerativeAI(ENV.GOOGLE_API_KEY);
    
    // Test with a simple prompt
    const testModel = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await testModel.generateContent("Say hello in one word");
    const response = result.response.text();
    
    res.json({
      success: true,
      testResponse: response,
      message: 'Gemini API is working!'
    });
  } catch (error) {
    console.error('Gemini test error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    res.status(500).json({
      success: false,
      error: errorMessage,
      message: 'Gemini API test failed'
    });
  }
});

// Routes
app.use('/auth', authRouter);
app.use('/reflections', authMiddleware, reflectionsRouter);
app.use('/stats', authMiddleware, statsRouter);

app.listen(Number(ENV.PORT), () => {
  console.log(`Server running on port ${ENV.PORT}`);
});