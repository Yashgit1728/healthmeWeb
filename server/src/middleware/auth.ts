import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { ENV } from '../env';

const COOKIE_NAME = process.env.COOKIE_NAME || 'accessToken';

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        name: string;
      };
    }
  }
}

export function authMiddleware(req: Request, res: Response, next: NextFunction) {
  // Check for token in cookies first (HTTP-only cookies)
  let token = req.cookies[COOKIE_NAME];
  let tokenSource = 'cookie';
  
  // If no cookie token, check Authorization header (for backward compatibility)
  if (!token) {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7); // Remove 'Bearer ' prefix
      tokenSource = 'header';
    }
  }

  if (!token) {
    console.log('🔒 No token provided in request:', {
      hasCookies: !!req.cookies,
      cookieKeys: req.cookies ? Object.keys(req.cookies) : [],
      hasAuthHeader: !!req.headers.authorization,
      userAgent: req.headers['user-agent'],
      origin: req.headers.origin,
      cookieName: COOKIE_NAME
    });
    return res.status(401).json({ 
      error: 'No token provided',
      code: 'NO_TOKEN'
    });
  }

  try {
    // Log token details for debugging (remove sensitive parts)
    console.log('🔍 Verifying token:', {
      source: tokenSource,
      tokenLength: token.length,
      tokenStart: token.substring(0, 10) + '...',
      jwtSecretLength: ENV.JWT_SECRET.length,
      nodeEnv: ENV.NODE_ENV,
      cookieName: COOKIE_NAME
    });

    const decoded = jwt.verify(token, ENV.JWT_SECRET, { clockTolerance: 5 }) as {
      sub: string;
      email: string;
      name: string;
      iat?: number;
      exp?: number;
    };

    // Log successful verification
    console.log('✅ Token verified successfully:', {
      userId: decoded.sub,
      email: decoded.email,
      name: decoded.name,
      issuedAt: decoded.iat ? new Date(decoded.iat * 1000).toISOString() : 'unknown',
      expiresAt: decoded.exp ? new Date(decoded.exp * 1000).toISOString() : 'unknown',
      currentTime: new Date().toISOString()
    });

    req.user = {
      id: decoded.sub,
      email: decoded.email,
      name: decoded.name
    };

    next();
  } catch (error) {
    console.error('❌ Auth error:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      tokenLength: token.length,
      tokenStart: token.substring(0, 10) + '...',
      jwtSecretLength: ENV.JWT_SECRET.length,
      nodeEnv: ENV.NODE_ENV,
      tokenSource,
      cookieName: COOKIE_NAME
    });
    
    // Provide more specific error messages
    if (error instanceof jwt.TokenExpiredError) {
      return res.status(401).json({ 
        error: 'Token expired',
        code: 'TOKEN_EXPIRED'
      });
    } else if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({ 
        error: 'Invalid token format',
        code: 'INVALID_TOKEN'
      });
    } else {
      return res.status(401).json({ 
        error: 'Invalid token',
        code: 'AUTH_FAILED'
      });
    }
  }
}