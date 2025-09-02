import { Router, Request, Response } from 'express';
import db from '../db';

const router = Router();

// Debug endpoint to check database and user isolation
router.get('/debug/database', async (req: Request, res: Response) => {
  try {
    // Check what database type we're using
    const dbType = process.env.NODE_ENV === 'production' && process.env.DATABASE_URL ? 'PostgreSQL' : 'JSON';
    
    // Get all users (for debugging - remove in production)
    const allUsers = await db.getAllUsers?.() || [];
    
    // Get all reflections (for debugging - remove in production)
    const allReflections = await db.getAllReflections?.() || [];
    
    // Get all messages (for debugging - remove in production)
    const allMessages = await db.getAllMessages?.() || [];
    
    res.json({
      databaseType: dbType,
      environment: process.env.NODE_ENV,
      hasDatabaseUrl: !!process.env.DATABASE_URL,
      currentUser: req.user ? {
        id: req.user.id,
        email: req.user.email
      } : null,
      stats: {
        totalUsers: allUsers.length,
        totalReflections: allReflections.length,
        totalMessages: allMessages.length
      },
      userIsolation: {
        userReflections: req.user ? allReflections.filter((r: any) => r.userId === (req.user as any).id).length : 0,
        userMessages: req.user ? allMessages.filter((m: any) => m.userId === (req.user as any).id).length : 0
      },
      sampleData: {
        users: allUsers.slice(0, 3).map((u: any) => ({ id: u.id, email: u.email, name: u.name })),
        reflections: allReflections.slice(0, 3).map((r: any) => ({ id: r.id, userId: r.userId, text: r.text?.substring(0, 50) })),
        messages: allMessages.slice(0, 3).map((m: any) => ({ id: m.id, userId: m.userId, text: m.text?.substring(0, 50), isUser: m.isUser }))
      }
    });
  } catch (error: any) {
    console.error('Debug error:', error);
    res.status(500).json({ error: 'Debug failed', details: error.message });
  }
});

// Debug endpoint to check specific user's data
router.get('/debug/user/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    
    // Get user's reflections
    const userReflections = await db.getReflections(userId);
    
    // Get user's recent messages
    const userMessages = await db.getRecentMessages(userId, 10);
    
    // Get user info
    const user = await db.getUserById?.(userId);
    
    res.json({
      userId,
      user: user ? { id: user.id, email: user.email, name: user.name } : null,
      reflections: userReflections.map(r => ({
        id: r.id,
        text: r.text?.substring(0, 100),
        mood: r.mood,
        createdAt: r.createdAt
      })),
      messages: userMessages.map(m => ({
        id: m.id,
        text: m.text?.substring(0, 100),
        isUser: m.isUser,
        chatSessionId: m.chatSessionId,
        createdAt: m.createdAt
      })),
      counts: {
        reflections: userReflections.length,
        messages: userMessages.length
      }
    });
  } catch (error: any) {
    console.error('User debug error:', error);
    res.status(500).json({ error: 'User debug failed', details: error.message });
  }
});

// Debug endpoint to check authentication
router.get('/debug/auth', async (req: Request, res: Response) => {
  try {
    const token = req.cookies.token || req.headers.authorization?.replace('Bearer ', '');
    
    res.json({
      hasToken: !!token,
      tokenLength: token?.length || 0,
      tokenStart: token ? token.substring(0, 20) + '...' : null,
      user: req.user ? {
        id: req.user.id,
        email: req.user.email
      } : null,
      cookies: req.cookies,
      headers: {
        authorization: req.headers.authorization ? 'Bearer [HIDDEN]' : null,
        cookie: req.headers.cookie ? '[HIDDEN]' : null
      }
    });
  } catch (error: any) {
    console.error('Auth debug error:', error);
    res.status(500).json({ error: 'Auth debug failed', details: error.message });
  }
});

export default router;
