import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { getOptimizedReply, getAISuggestions } from '../gemini-optimized';
import db from '../db';
import { userRateLimit } from '../middleware/optimization';

const router = Router();

// Enhanced validation schema with better error messages
const ReflectionSchema = z.object({
  text: z.string()
    .min(1, 'Text is required')
    .max(10000, 'Text must be less than 10,000 characters')
    .trim(),
  mood: z.number()
    .min(0, 'Mood must be between 0 and 10')
    .max(10, 'Mood must be between 0 and 10')
    .optional(),
  tags: z.array(z.string().max(50, 'Tag too long'))
    .max(10, 'Maximum 10 tags allowed')
    .optional()
});

// Simple in-memory cache for reflections (in production, use Redis)
const reflectionsCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// Cache middleware
const cacheMiddleware = (duration: number = CACHE_TTL) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (req.method !== 'GET') {
      return next();
    }

    const userId = (req.user as any)?.id;
    if (!userId) {
      return next();
    }

    const cacheKey = `${userId}:${req.originalUrl}`;
    const cached = reflectionsCache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < duration) {
      return res.json(cached.data);
    }
    
    // Store original send method
    const originalSend = res.json;
    
    // Override send method to cache response
    res.json = function(data: any) {
      reflectionsCache.set(cacheKey, {
        data,
        timestamp: Date.now()
      });
      return originalSend.call(this, data);
    };
    
    next();
  };
};

// Input sanitization middleware
const sanitizeInput = (req: Request, res: Response, next: NextFunction) => {
  if (req.body.text) {
    req.body.text = req.body.text.trim().replace(/\s+/g, ' ');
  }
  if (req.body.tags) {
    req.body.tags = req.body.tags
      .map((tag: string) => tag.trim().toLowerCase())
      .filter((tag: string) => tag.length > 0)
      .slice(0, 10); // Limit to 10 tags
  }
  next();
};

// GET /reflections - Get user's reflections with caching
router.get('/', cacheMiddleware(), async (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ 
      error: 'Not authenticated',
      code: 'AUTH_REQUIRED'
    });
  }

  try {
    const startTime = Date.now();
    const reflections = await db.getReflections(req.user.id);
    const duration = Date.now() - startTime;
    
    // Log slow database queries
    if (duration > 500) {
      console.warn(`⚠️  Slow reflections query for user ${req.user.id}: ${duration}ms`);
    }

    res.json({
      reflections,
      meta: {
        count: reflections.length,
        queryTime: duration,
        cached: false
      }
    });
  } catch (error) {
    console.error('Get reflections error:', error);
    res.status(500).json({ 
      error: 'Failed to get reflections',
      code: 'DB_ERROR',
      retryAfter: '30 seconds'
    });
  }
});

// POST /reflections - Create new reflection with optimization
router.post('/', sanitizeInput, async (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ 
      error: 'Not authenticated',
      code: 'AUTH_REQUIRED'
    });
  }

  const parsed = ReflectionSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      error: 'Validation failed',
      code: 'VALIDATION_ERROR',
      details: parsed.error.issues.map(issue => ({
        field: issue.path.join('.'),
        message: issue.message,
        code: issue.code
      }))
    });
  }

  try {
    const { text, mood, tags } = parsed.data;
    const userId = req.user.id;

    console.log(`Processing reflection for user ${userId}:`, { 
      textLength: text.length, 
      mood, 
      tagsCount: tags?.length || 0 
    });

    // Clear cache for this user
    const cacheKeys = Array.from(reflectionsCache.keys())
      .filter(key => key.startsWith(`${userId}:`));
    cacheKeys.forEach(key => reflectionsCache.delete(key));

    // Get recent messages for conversation context (limit to last 6)
    const startTime = Date.now();
    const recentMessages = await db.getRecentMessages(userId, 6);
    const contextTime = Date.now() - startTime;

    const conversationContext = recentMessages.map(msg => ({
      role: msg.isUser ? 'user' as const : 'assistant' as const,
      text: msg.text
    }));

    // Generate AI response using optimized Gemini integration
    const aiStartTime = Date.now();
    const aiResponse = await getOptimizedReply(text, mood, tags, conversationContext);
    const aiTime = Date.now() - aiStartTime;
    
    console.log('Generated optimized AI response:', {
      messageLength: aiResponse.message.length,
      followUpQuestion: aiResponse.followUpQuestion,
      processingTime: aiTime
    });

    // Store the conversation messages for context (parallel operations)
    const messagePromises = [
      db.addMessage(userId, text, true), // User message
      db.addMessage(userId, aiResponse.message, false) // Assistant response
    ];

    try {
      await Promise.all(messagePromises);
      console.log('Messages stored successfully');
    } catch (messageError) {
      console.error('Failed to store conversation messages:', messageError);
      // Continue with reflection creation even if message storage fails
    }

    // Store the reflection with optimized response format
    const reflectionStartTime = Date.now();
    const reflection = await db.createReflection({
      userId,
      text,
      mood,
      tags,
      response: aiResponse.message
    });
    const reflectionTime = Date.now() - reflectionStartTime;

    console.log('Stored reflection:', {
      id: reflection.id,
      storageTime: reflectionTime
    });

    // Get updated stats (parallel with reflection creation)
    const statsStartTime = Date.now();
    const stats = await db.getStats(userId, '7d');
    const statsTime = Date.now() - statsStartTime;

    // Return the expected format for the frontend with performance metrics
    const responseData = {
      reflection: {
        id: reflection.id,
        userId: reflection.userId,
        text: reflection.text,
        mood: reflection.mood,
        tags: reflection.tags,
        createdAt: reflection.createdAt
      },
      ai: {
        response: aiResponse.message,
        followUpQuestion: aiResponse.followUpQuestion
      },
      stats,
      performance: {
        totalTime: Date.now() - startTime,
        aiProcessing: aiTime,
        contextRetrieval: contextTime,
        reflectionStorage: reflectionTime,
        statsGeneration: statsTime
      }
    };

    console.log('Response generated successfully:', {
      totalTime: responseData.performance.totalTime,
      aiTime,
      contextTime,
      reflectionTime,
      statsTime
    });

    res.json(responseData);

  } catch (error) {
    console.error('Reflection error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    
    // Provide more specific error responses
    if (errorMessage.includes('rate limit') || errorMessage.includes('quota')) {
      return res.status(429).json({
        error: 'AI service temporarily unavailable',
        code: 'AI_RATE_LIMIT',
        retryAfter: '1 minute',
        details: 'Please try again in a moment'
      });
    }
    
    res.status(500).json({ 
      error: 'Failed to process reflection', 
      code: 'PROCESSING_ERROR',
      details: process.env.NODE_ENV === 'development' ? errorMessage : 'Internal error',
      retryAfter: '30 seconds'
    });
  }
});

// New endpoint for AI-powered suggestions and resolutions
router.post('/suggestions', userRateLimit(10, 15 * 60 * 1000), async (req, res) => {
  try {
    const { problem, category = 'emotional' } = req.body;
    
    if (!problem || typeof problem !== 'string') {
      return res.status(400).json({
        error: 'Problem description is required',
        code: 'MISSING_PROBLEM'
      });
    }
    
    if (!['emotional', 'mental', 'physical'].includes(category)) {
      return res.status(400).json({
        error: 'Category must be emotional, mental, or physical',
        code: 'INVALID_CATEGORY'
      });
    }
    
    console.log('Generating suggestions for:', { problem, category });
    
    const startTime = Date.now();
    const suggestions = await getAISuggestions(problem, category);
    const processingTime = Date.now() - startTime;
    
    console.log('Generated AI suggestions:', {
      suggestionsCount: suggestions.suggestions.length,
      processingTime
    });
    
    res.json({
      success: true,
      suggestions: suggestions.suggestions,
      summary: suggestions.summary,
      category,
      processingTime
    });
    
  } catch (error) {
    console.error('Suggestions error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    
    res.status(500).json({ 
      error: 'Failed to generate suggestions', 
      code: 'SUGGESTIONS_ERROR',
      details: process.env.NODE_ENV === 'development' ? errorMessage : 'Internal error'
    });
  }
});

export default router;