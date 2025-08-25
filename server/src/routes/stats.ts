import { Router, Request, Response } from 'express';
import db from '../db';

const router = Router();

// Cache for stats (in production, use Redis)
const statsCache = new Map<string, { data: any; timestamp: number }>();
const STATS_CACHE_TTL = 10 * 60 * 1000; // 10 minutes

// GET /stats - Get user's statistics with caching
router.get('/', async (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ 
      error: 'Not authenticated',
      code: 'AUTH_REQUIRED'
    });
  }

  try {
    const userId = req.user.id;
    const range = (req.query.range as '7d' | '30d') || '7d';
    
    // Check cache first
    const cacheKey = `${userId}:stats:${range}`;
    const cached = statsCache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < STATS_CACHE_TTL) {
      return res.json({
        ...cached.data,
        meta: {
          ...cached.data.meta,
          cached: true,
          cacheAge: Date.now() - cached.timestamp
        }
      });
    }

    const startTime = Date.now();
    const stats = await db.getStats(userId, range);
    const duration = Date.now() - startTime;

    // Log slow stats queries
    if (duration > 1000) {
      console.warn(`⚠️  Slow stats query for user ${userId} (${range}): ${duration}ms`);
    }

    const responseData = {
      ...stats,
      meta: {
        range,
        queryTime: duration,
        cached: false,
        generatedAt: new Date().toISOString()
      }
    };

    // Cache the response
    statsCache.set(cacheKey, {
      data: responseData,
      timestamp: Date.now()
    });

    res.json(responseData);

  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ 
      error: 'Failed to get statistics',
      code: 'STATS_ERROR',
      retryAfter: '1 minute'
    });
  }
});

// POST /stats/clear-cache - Clear user's stats cache (admin only)
router.post('/clear-cache', async (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ 
      error: 'Not authenticated',
      code: 'AUTH_REQUIRED'
    });
  }

  try {
    const userId = req.user.id;
    
    // Clear all cache entries for this user
    const cacheKeys = Array.from(statsCache.keys())
      .filter(key => key.startsWith(`${userId}:`));
    
    cacheKeys.forEach(key => statsCache.delete(key));
    
    res.json({
      message: 'Cache cleared successfully',
      clearedEntries: cacheKeys.length,
      userId
    });
  } catch (error) {
    console.error('Clear cache error:', error);
    res.status(500).json({ 
      error: 'Failed to clear cache',
      code: 'CACHE_CLEAR_ERROR'
    });
  }
});

export default router;