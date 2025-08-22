import { Router } from 'express';
import { z } from 'zod';
import db from '../db';

const router = Router();

const StatsRangeSchema = z.object({
  range: z.enum(['7d', '30d']).default('7d')
});

router.get('/', async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  const parsed = StatsRangeSchema.safeParse(req.query);
  if (!parsed.success) {
    return res.status(400).json({
      errors: parsed.error.issues.map(issue => ({
        path: issue.path.join('.'),
        message: issue.message
      }))
    });
  }

  try {
    const stats = await db.getStats(req.user.id, parsed.data.range);
    res.json(stats);
  } catch (error) {
    console.error('Stats error:', error);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

export default router;