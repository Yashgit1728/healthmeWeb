import { Router, Request, Response } from 'express';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import db from '../db';
import { sendResetEmail } from '../services/mailer';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret';

// Validate JWT secret
if (!process.env.JWT_SECRET) {
  console.warn('⚠️  JWT_SECRET not set, using default secret. This is not secure for production!');
}

// helper: only true in dev
const isDev = () => process.env.NODE_ENV !== 'production';

const UserSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  name: z.string().min(1, 'Name is required')
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

router.post('/register', async (req: Request, res: Response) => {
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
    
    console.log(`📝 Attempting to register user: ${email}`);
    
    // Debug: Check all users before registration
    const allUsersBefore = await db.getAllUsers?.() || [];
    console.log(`📊 Users before registration: ${allUsersBefore.length}`);
    console.log(`👥 Existing users:`, allUsersBefore.map(u => ({ id: u.id, email: u.email, name: u.name })));
    
    const existingUser = await db.getUserByEmail(email);
    console.log(`🔍 Existing user check for ${email}:`, existingUser ? 'FOUND' : 'NOT FOUND');
    
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
    
    // Debug: Check all users after registration
    const allUsersAfter = await db.getAllUsers?.() || [];
    console.log(`📊 Users after registration: ${allUsersAfter.length}`);
    console.log(`👥 All users now:`, allUsersAfter.map(u => ({ id: u.id, email: u.email, name: u.name })));

    // Include both id (as sub) and email in JWT
    const token = jwt.sign(
      { 
        sub: user.id,
        email: user.email 
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Set both cookie and return token for localStorage
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    }).json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name
      },
      token: token
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Failed to register user' });
  }
});

router.post('/login', async (req: Request, res: Response) => {
  console.log('🔐 Login attempt:', {
    body: req.body,
    origin: req.headers.origin,
    userAgent: req.headers['user-agent'],
    hasCookies: !!req.headers.cookie
  });

  const parsed = LoginSchema.safeParse(req.body);
  if (!parsed.success) {
    console.log('❌ Login validation failed:', parsed.error.issues);
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
      nodeEnv: process.env.NODE_ENV
    });
    
    // Debug: Check all users in database
    const allUsers = await db.getAllUsers?.() || [];
    console.log(`📊 Total users in database: ${allUsers.length}`);
    console.log(`👥 All users:`, allUsers.map(u => ({ id: u.id, email: u.email, name: u.name })));
    
    const user = await db.getUserByEmail(email);
    console.log(`🔍 User lookup result for ${email}:`, user ? {
      id: user.id,
      email: user.email,
      name: user.name,
      hasPasswordHash: !!user.passwordHash
    } : 'NOT FOUND');
    
    if (!user) {
      console.log(`❌ Login failed: User ${email} not found`);
      console.log(`🔍 Available emails:`, allUsers.map(u => u.email));
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      console.log(`❌ Login failed: Invalid password for user ${email}`);
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    console.log(`✅ User logged in successfully: ${user.email}`);

    // Include both id (as sub) and email in JWT
    const token = jwt.sign(
      { 
        sub: user.id,
        email: user.email 
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    console.log(`🎫 JWT Token generated:`, {
      tokenLength: token.length,
      tokenStart: token.substring(0, 10) + '...',
      userId: user.id,
      expiresIn: '7d'
    });

    // Set both cookie and return token for localStorage
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: (process.env.NODE_ENV === 'production' ? 'none' : 'lax') as 'none' | 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    };
    
    console.log('🍪 Setting cookie with options:', {
      ...cookieOptions,
      tokenLength: token.length,
      nodeEnv: process.env.NODE_ENV
    });
    
    res.cookie('token', token, cookieOptions).json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name
      },
      token: token
    });
  } catch (error) {
    console.error('❌ Login error:', error);
    res.status(500).json({ error: 'Failed to log in' });
  }
});

router.post('/logout', (req: Request, res: Response) => {
  res.clearCookie('token').json({ message: 'Logged out successfully' });
});

router.post('/forgot-password', async (req: Request, res: Response) => {
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

router.get('/me', async (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  try {
    const user = await db.getUserById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      id: user.id,
      email: user.email,
      name: user.name
    });
  } catch (error) {
    console.error('Profile fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

router.post('/reset-password', async (req: Request, res: Response) => {
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