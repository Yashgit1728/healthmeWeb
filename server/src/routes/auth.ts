import { Router } from 'express';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import db from '../db';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret';

// Validate JWT secret
if (!process.env.JWT_SECRET) {
  console.warn('⚠️  JWT_SECRET not set, using default secret. This is not secure for production!');
}

const UserSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  name: z.string().min(1, 'Name is required')
});

const LoginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required')
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
    
    console.log(`Attempting to register user: ${email}`);
    
    const existingUser = await db.getUserByEmail(email);
    if (existingUser) {
      console.log(`Registration failed: Email ${email} already registered`);
      return res.status(400).json({ error: 'Email already registered' });
    }

    const hash = await bcrypt.hash(password, 10);
    const user = await db.createUser({
      email,
      name,
      passwordHash: hash
    });

    console.log(`User registered successfully: ${user.email}`);

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
    
    console.log(`Attempting login for user: ${email}`);
    
    const user = await db.getUserByEmail(email);
    if (!user) {
      console.log(`Login failed: User ${email} not found`);
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      console.log(`Login failed: Invalid password for user ${email}`);
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    console.log(`User logged in successfully: ${user.email}`);

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
    console.error('Login error:', error);
    res.status(500).json({ error: 'Failed to log in' });
  }
});

router.post('/logout', (req, res) => {
  res.clearCookie('token').json({ message: 'Logged out successfully' });
});

router.get('/me', async (req, res) => {
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

export default router;