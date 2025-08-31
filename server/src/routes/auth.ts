import { Router } from 'express';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import db from '../db';
import { sendResetEmail } from '../services/mailer';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret';
const COOKIE_NAME = process.env.COOKIE_NAME || 'accessToken';

// Validate JWT secret
if (!process.env.JWT_SECRET) {
  console.warn('⚠️  JWT_SECRET not set, using default secret. This is not secure for production!');
}

// helper: only true in dev
const isDev = () => process.env.NODE_ENV !== 'production';

const UserSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  name: z.string().min(2, 'Name must be at least 2 characters')
});

const LoginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required')
});

const ForgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address')
});

const ResetPasswordSchema = z.object({
  token: z.string().min(1, 'Reset token is required'),
  password: z.string().min(6, 'Password must be at least 6 characters')
});

router.post('/register', async (req, res) => {
  const parsed = UserSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      errors: parsed.error.issues.map(issue => ({
        path: issue.path.join("."),
        message: issue.message,
        code: issue.code
      }))
    });
  }

  try {
    const { email, password, name } = parsed.data;
    
    console.log(`🔐 Attempting to register user: ${email}`);
    
    const existingUser = await db.getUserByEmail(email);
    if (existingUser) {
      console.log(`❌ Registration failed: Email ${email} already registered`);
      return res.status(400).json({ error: 'Email already registered' });
    }

    const hash = await bcrypt.hash(password, 10);
    const user = await db.createUser({
      email,
      name,
      passwordHash: hash
    });

    console.log(`✅ User registered successfully: ${user.email}`);

    // Create JWT token
    const payload = { 
      sub: user.id,
      email: user.email,
      name: user.name
    };
    
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });

    // Set secure cookie
    res.cookie(COOKIE_NAME, token, {
      httpOnly: true,
      secure: !isDev(), // true in production
      sameSite: isDev() ? 'lax' : 'none',
      path: '/',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    // Return user data (no token in response body for security)
    res.status(201).json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name
      }
    });
  } catch (error) {
    console.error('❌ Registration error:', error);
    res.status(500).json({ error: 'Failed to register user' });
  }
});

router.post('/login', async (req, res) => {
  const parsed = LoginSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      errors: parsed.error.issues.map(issue => ({
        path: issue.path.join("."),
        message: issue.message,
        code: issue.code
      }))
    });
  }

  try {
    const { email, password } = parsed.data;
    
    console.log(`🔐 Attempting login for user: ${email}`);
    console.log(`🔑 JWT Secret info:`, {
      hasSecret: !!JWT_SECRET,
      secretLength: JWT_SECRET.length,
      nodeEnv: process.env.NODE_ENV,
      cookieName: COOKIE_NAME
    });
    
    const user = await db.getUserByEmail(email);
    if (!user) {
      console.log(`❌ Login failed: User ${email} not found`);
      return res.status(401).json({ 
        error: 'Invalid credentials',
        code: 'INVALID_CREDENTIALS'
      });
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      console.log(`❌ Login failed: Invalid password for user ${email}`);
      return res.status(401).json({ 
        error: 'Invalid credentials',
        code: 'INVALID_CREDENTIALS'
      });
    }

    console.log(`✅ User logged in successfully: ${user.email}`);

    // Create JWT token
    const payload = { 
      sub: user.id,
      email: user.email,
      name: user.name
    };
    
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });

    console.log(`🎫 JWT Token generated:`, {
      tokenLength: token.length,
      tokenStart: token.substring(0, 10) + '...',
      userId: user.id,
      expiresIn: '7d'
    });

    // Set secure cookie
    res.cookie(COOKIE_NAME, token, {
      httpOnly: true,
      secure: !isDev(), // true in production
      sameSite: isDev() ? 'lax' : 'none',
      path: '/',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    // Return user data (no token in response body for security)
    res.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name
      }
    });
  } catch (error) {
    console.error('❌ Login error:', error);
    res.status(500).json({ error: 'Failed to log in' });
  }
});

router.post('/logout', (req, res) => {
  console.log('🚪 User logging out');
  
  // Clear the cookie
  res.clearCookie(COOKIE_NAME, {
    httpOnly: true,
    secure: !isDev(),
    sameSite: isDev() ? 'lax' : 'none',
    path: '/'
  });
  
  res.json({ message: 'Logged out successfully' });
});

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({ 
    ok: true, 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Whoami endpoint to test authentication
router.get('/me', async (req, res) => {
  try {
    // Get token from cookie
    const token = req.cookies[COOKIE_NAME];
    
    if (!token) {
      return res.status(401).json({ 
        error: 'No token provided',
        code: 'NO_TOKEN'
      });
    }

    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET) as {
      sub: string;
      email: string;
      name: string;
    };

    // Get fresh user data from database
    const user = await db.getUserByEmail(decoded.email);
    if (!user) {
      return res.status(401).json({ 
        error: 'User not found',
        code: 'USER_NOT_FOUND'
      });
    }

    res.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name
      }
    });
  } catch (error) {
    console.error('❌ /me endpoint error:', error);
    
    if (error instanceof jwt.TokenExpiredError) {
      return res.status(401).json({ 
        error: 'Token expired',
        code: 'TOKEN_EXPIRED'
      });
    } else if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({ 
        error: 'Invalid token',
        code: 'INVALID_TOKEN'
      });
    }
    
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/forgot-password', async (req, res) => {
  const parsed = ForgotPasswordSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      errors: parsed.error.issues.map(issue => ({
        path: issue.path.join("."),
        message: issue.message,
        code: issue.code
      }))
    });
  }

  try {
    const { email } = parsed.data;
    
    // Normalize email
    const normalized = String(email || '').trim().toLowerCase();
    
    console.log(`\n🔐 Processing forgot password request for: ${normalized}`);
    
    // Lookup user
    const user = await db.getUserByEmail(normalized);
    
    // Always return a generic message to prevent enumeration
    const genericOk = { 
      message: 'If that email exists, we\'ve sent a reset link.',
      success: true
    };

    // ---- Dev-only debug header to help YOU see what's happening ----
    // We'll set one of: "unknown_email", "token_saved", "email_sent", "email_failed"
    let debugReason = 'unknown_email';

    if (!user) {
      // ✅ Do NOT send email when user not found
      console.log(`❌ Forgot password request for non-existent email: ${normalized}`);
      if (isDev()) res.set('X-Reset-Debug', debugReason);
      return res.status(200).json(genericOk);
    }

    console.log(`✅ User found: ${user.name} (${user.id})`);

    // Generate token + expiry
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now
    
    console.log(`🔑 Generated reset token: ${resetToken.substring(0, 8)}...`);
    console.log(`⏰ Token expires at: ${resetTokenExpiry.toISOString()}`);
    
    // Persist token onto user
    try {
      console.log(`💾 Attempting to save reset token to database...`);
      await db.updateUserResetToken(user.id, resetToken, resetTokenExpiry);
      console.log(`✅ Reset token saved to database for user: ${user.id}`);
      debugReason = 'token_saved';
    } catch (dbError: any) {
      console.error(`❌ Failed to save reset token to database:`, dbError);
      console.error(`❌ Database error details:`, {
        error: dbError?.message || 'Unknown error',
        stack: dbError?.stack || 'No stack trace',
        userId: user.id
      });
      // Still return generic message to prevent enumeration
      debugReason = 'db_error';
      if (isDev()) res.set('X-Reset-Debug', debugReason);
      return res.status(200).json(genericOk);
    }
    
    // Build reset URL for your frontend
    const baseUrl = process.env.FRONTEND_BASE_URL || 'http://localhost:5173';
    const resetUrl = `${baseUrl}/reset-password?token=${resetToken}`;
    console.log(`🔗 Reset URL created: ${resetUrl}`);
    
    try {
      // Try sending the real email
      const { previewUrl } = await sendResetEmail({
        to: normalized,
        name: user.name || 'there',
        resetUrl,
        minutes: 60,
      });

      if (previewUrl) {
        console.log(`📧 Ethereal preview: ${previewUrl}`);
        console.log(`🔗 Reset URL for testing: ${resetUrl}`);
        debugReason = 'email_sent';
      } else {
        console.log(`📧 Password reset email sent successfully to: ${normalized}`);
        debugReason = 'email_sent';
      }
      
      // Always generic outwardly
      if (isDev()) res.set('X-Reset-Debug', debugReason);
      return res.status(200).json(genericOk);
    } catch (err: any) {
      // Log internally; don't leak to client
      console.error('❌ Password reset email failed:', err?.message || 'Unknown error');
      debugReason = 'email_failed';
      if (isDev()) res.set('X-Reset-Debug', debugReason);
      return res.status(200).json(genericOk);
    }
    
  } catch (error: any) {
    console.error('❌ Forgot password error:', error);
    console.error('❌ Full error details:', {
      error: error?.message || 'Unknown error',
      stack: error?.stack || 'No stack trace',
      email: parsed?.data?.email
    });
    // Even on unexpected errors, return generic message
    if (isDev()) res.set('X-Reset-Debug', 'unexpected_error');
    res.status(200).json({ 
      message: 'If that email exists, we\'ve sent a reset link.',
      success: true
    });
  }
});

router.post('/reset-password', async (req, res) => {
  const parsed = ResetPasswordSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      errors: parsed.error.issues.map(issue => ({
        path: issue.path.join("."),
        message: issue.message,
        code: issue.code
      }))
    });
  }

  try {
    const { token, password } = parsed.data;
    
    console.log(`Processing password reset with token: ${token.substring(0, 8)}...`);
    
    // Find user by reset token
    const user = await db.getUserByResetToken(token);
    if (!user) {
      console.log(`Invalid or expired reset token: ${token.substring(0, 8)}...`);
      return res.status(400).json({ error: 'Invalid or expired reset token' });
    }

    // Hash new password
    const newPasswordHash = await bcrypt.hash(password, 10);
    
    // Update user password and clear reset token
    await db.updateUserPassword(user.id, newPasswordHash);
    
    console.log(`Password successfully reset for user: ${user.email}`);
    
    res.json({ message: 'Password has been successfully reset' });
    
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ error: 'Failed to reset password' });
  }
});

export default router;