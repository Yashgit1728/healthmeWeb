import { Router, Request, Response } from 'express';
import { ENV } from '../env';
import db from '../db';

const router = Router();

// Health check endpoint
router.get('/health', async (req: Request, res: Response) => {
  try {
    // Test database connection
    let dbStatus = 'unknown';
    let dbError = null;
    
    try {
      // Try to get a user count or simple query
      const users = await db.getAllUsers?.() || [];
      dbStatus = 'connected';
    } catch (error: any) {
      dbStatus = 'error';
      dbError = error.message;
    }

    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      environment: {
        nodeEnv: ENV.NODE_ENV,
        port: ENV.PORT,
        hasGoogleApiKey: !!ENV.GOOGLE_API_KEY,
        hasJwtSecret: !!ENV.JWT_SECRET,
        hasDatabaseUrl: !!ENV.DATABASE_URL,
        databaseType: ENV.NODE_ENV === 'production' && ENV.DATABASE_URL ? 'PostgreSQL' : 'JSON'
      },
      database: {
        status: dbStatus,
        error: dbError
      },
      cors: {
        origin: process.env.NODE_ENV === 'production' 
          ? ['https://healthmeweb.netlify.app', 'http://localhost:5173', 'http://localhost:5174']
          : ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:3000'],
        credentials: true
      },
      request: {
        userAgent: req.headers['user-agent'],
        origin: req.headers.origin,
        referer: req.headers.referer,
        host: req.headers.host,
        hasAuthHeader: !!req.headers.authorization,
        hasCookie: !!req.headers.cookie,
        cookies: req.cookies
      }
    });
  } catch (error: any) {
    console.error('Health check error:', error);
    res.status(500).json({ 
      status: 'error', 
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Environment check endpoint
router.get('/env-check', async (req: Request, res: Response) => {
  try {
    res.json({
      environment: {
        NODE_ENV: process.env.NODE_ENV,
        PORT: process.env.PORT,
        GOOGLE_API_KEY: process.env.GOOGLE_API_KEY ? '[SET]' : '[NOT SET]',
        JWT_SECRET: process.env.JWT_SECRET ? '[SET]' : '[NOT SET]',
        DATABASE_URL: process.env.DATABASE_URL ? '[SET]' : '[NOT SET]'
      },
      computed: {
        port: ENV.PORT,
        nodeEnv: ENV.NODE_ENV,
        hasGoogleKey: !!ENV.GOOGLE_API_KEY,
        hasJwtSecret: !!ENV.JWT_SECRET,
        hasDatabaseUrl: !!ENV.DATABASE_URL
      }
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Users check endpoint (no auth required for debugging)
router.get('/users', async (req: Request, res: Response) => {
  try {
    const allUsers = await db.getAllUsers?.() || [];
    
    // Debug: Check database path and file existence
    const fs = require('fs');
    const path = require('path');
    
    let dbPath = 'unknown';
    let dbExists = false;
    let dbSize = 0;
    
    try {
      if (process.env.NODE_ENV === 'production') {
        dbPath = path.join('/opt/render/project/src/server/data', 'healthme-db.json');
      } else {
        dbPath = path.join(__dirname, '../data/db.json');
      }
      
      dbExists = fs.existsSync(dbPath);
      if (dbExists) {
        const stats = fs.statSync(dbPath);
        dbSize = stats.size;
      }
    } catch (error) {
      console.error('Path check error:', error);
    }
    
    res.json({
      totalUsers: allUsers.length,
      users: allUsers.map(u => ({
        id: u.id,
        email: u.email,
        name: u.name,
        createdAt: (u as any).createdAt
      })),
      debug: {
        databasePath: dbPath,
        databaseExists: dbExists,
        databaseSize: dbSize,
        nodeEnv: process.env.NODE_ENV,
        hasDatabaseUrl: !!process.env.DATABASE_URL
      },
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('Users check error:', error);
    res.status(500).json({ 
      error: 'Users check failed', 
      details: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

export default router;
