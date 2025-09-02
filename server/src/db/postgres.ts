import { Pool, PoolClient } from 'pg';
import { v4 as uuidv4 } from 'uuid';

// Database types
export interface User {
  id: string;
  email: string;
  name: string;
  passwordHash: string;
  aboutMe?: string;
  resetToken?: string;
  resetTokenExpiry?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface Message {
  id: string;
  userId: string;
  text: string;
  isUser: boolean;
  chatSessionId?: string;
  createdAt: Date;
}

export interface Reflection {
  id: string;
  userId: string;
  text: string;
  mood?: number;
  tags?: string[];
  response: string;
  createdAt: Date;
}

// PostgreSQL connection pool
let pool: Pool | null = null;

const getPool = (): Pool => {
  if (!pool) {
    const connectionString = process.env.DATABASE_URL;
    
    if (!connectionString) {
      throw new Error('DATABASE_URL environment variable is not set');
    }

    pool = new Pool({
      connectionString,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });

    console.log('🐘 PostgreSQL connection pool created');
  }
  
  return pool;
};

// Database operations
export const db = {
  // User operations
  async createUser(user: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): Promise<User> {
    const client = await getPool().connect();
    try {
      const id = uuidv4();
      const now = new Date();
      
      const result = await client.query(`
        INSERT INTO users (id, email, name, password_hash, about_me, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *
      `, [id, user.email, user.name, user.passwordHash, user.aboutMe || null, now, now]);
      
      const row = result.rows[0];
      return {
        id: row.id,
        email: row.email,
        name: row.name,
        passwordHash: row.password_hash,
        aboutMe: row.about_me,
        resetToken: row.reset_token,
        resetTokenExpiry: row.reset_token_expiry,
        createdAt: new Date(row.created_at),
        updatedAt: new Date(row.updated_at)
      };
    } finally {
      client.release();
    }
  },

  async getUserByEmail(email: string): Promise<User | null> {
    const client = await getPool().connect();
    try {
      const result = await client.query(`
        SELECT * FROM users WHERE email = $1
      `, [email]);
      
      if (result.rows.length === 0) return null;
      
      const row = result.rows[0];
      return {
        id: row.id,
        email: row.email,
        name: row.name,
        passwordHash: row.password_hash,
        aboutMe: row.about_me,
        resetToken: row.reset_token,
        resetTokenExpiry: row.reset_token_expiry,
        createdAt: new Date(row.created_at),
        updatedAt: new Date(row.updated_at)
      };
    } finally {
      client.release();
    }
  },

  async getUserById(id: string): Promise<User | null> {
    const client = await getPool().connect();
    try {
      const result = await client.query(`
        SELECT * FROM users WHERE id = $1
      `, [id]);
      
      if (result.rows.length === 0) return null;
      
      const row = result.rows[0];
      return {
        id: row.id,
        email: row.email,
        name: row.name,
        passwordHash: row.password_hash,
        aboutMe: row.about_me,
        resetToken: row.reset_token,
        resetTokenExpiry: row.reset_token_expiry,
        createdAt: new Date(row.created_at),
        updatedAt: new Date(row.updated_at)
      };
    } finally {
      client.release();
    }
  },

  async updateUserResetToken(userId: string, resetToken: string, expiry: Date): Promise<void> {
    const client = await getPool().connect();
    try {
      await client.query(`
        UPDATE users 
        SET reset_token = $1, reset_token_expiry = $2, updated_at = $3
        WHERE id = $4
      `, [resetToken, expiry, new Date(), userId]);
    } finally {
      client.release();
    }
  },

  async getUserByResetToken(resetToken: string): Promise<User | null> {
    const client = await getPool().connect();
    try {
      const result = await client.query(`
        SELECT * FROM users 
        WHERE reset_token = $1 AND reset_token_expiry > NOW()
      `, [resetToken]);
      
      if (result.rows.length === 0) return null;
      
      const row = result.rows[0];
      return {
        id: row.id,
        email: row.email,
        name: row.name,
        passwordHash: row.password_hash,
        aboutMe: row.about_me,
        resetToken: row.reset_token,
        resetTokenExpiry: row.reset_token_expiry,
        createdAt: new Date(row.created_at),
        updatedAt: new Date(row.updated_at)
      };
    } finally {
      client.release();
    }
  },

  async updateUserPassword(userId: string, newPasswordHash: string): Promise<void> {
    const client = await getPool().connect();
    try {
      await client.query(`
        UPDATE users 
        SET password_hash = $1, reset_token = NULL, reset_token_expiry = NULL, updated_at = $2
        WHERE id = $3
      `, [newPasswordHash, new Date(), userId]);
    } finally {
      client.release();
    }
  },

  async updateUserProfile(id: string, aboutMe: string): Promise<void> {
    const client = await getPool().connect();
    try {
      await client.query(`
        UPDATE users SET about_me = $1, updated_at = $2 WHERE id = $3
      `, [aboutMe, new Date(), id]);
    } finally {
      client.release();
    }
  },

  // Reflection operations
  async createReflection(reflection: Omit<Reflection, 'id' | 'createdAt'>): Promise<Reflection> {
    const client = await getPool().connect();
    try {
      const id = uuidv4();
      const now = new Date();
      
      const result = await client.query(`
        INSERT INTO reflections (id, user_id, text, mood, tags, response, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *
      `, [
        id,
        reflection.userId,
        reflection.text,
        reflection.mood || null,
        reflection.tags ? JSON.stringify(reflection.tags) : null,
        reflection.response,
        now
      ]);
      
      const row = result.rows[0];
      return {
        id: row.id,
        userId: row.user_id,
        text: row.text,
        mood: row.mood,
        tags: row.tags ? JSON.parse(row.tags) : undefined,
        response: row.response,
        createdAt: new Date(row.created_at)
      };
    } finally {
      client.release();
    }
  },

  async getReflections(userId: string, limit = 50): Promise<Reflection[]> {
    const client = await getPool().connect();
    try {
      const result = await client.query(`
        SELECT * FROM reflections 
        WHERE user_id = $1
        ORDER BY created_at DESC
        LIMIT $2
      `, [userId, limit]);
      
      return result.rows.map(row => ({
        id: row.id,
        userId: row.user_id,
        text: row.text,
        mood: row.mood,
        tags: row.tags ? JSON.parse(row.tags) : undefined,
        response: row.response,
        createdAt: new Date(row.created_at)
      }));
    } finally {
      client.release();
    }
  },

  // Message operations
  async createMessage(message: Omit<Message, 'id' | 'createdAt'>): Promise<Message> {
    const client = await getPool().connect();
    try {
      const id = uuidv4();
      const now = new Date();
      
      const result = await client.query(`
        INSERT INTO messages (id, user_id, text, is_user, chat_session_id, created_at)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *
      `, [id, message.userId, message.text, message.isUser, message.chatSessionId || null, now]);
      
      const row = result.rows[0];
      return {
        id: row.id,
        userId: row.user_id,
        text: row.text,
        isUser: row.is_user,
        chatSessionId: row.chat_session_id,
        createdAt: new Date(row.created_at)
      };
    } finally {
      client.release();
    }
  },

  async getRecentMessages(userId: string, limit = 10, chatSessionId?: string): Promise<Message[]> {
    const client = await getPool().connect();
    try {
      let query = `
        SELECT * FROM messages 
        WHERE user_id = $1
      `;
      const params: any[] = [userId];
      
      if (chatSessionId) {
        query += ` AND chat_session_id = $2`;
        params.push(chatSessionId);
      }
      
      query += ` ORDER BY created_at DESC LIMIT $${params.length + 1}`;
      params.push(limit);
      
      const result = await client.query(query, params);
      
      return result.rows.map(row => ({
        id: row.id,
        userId: row.user_id,
        text: row.text,
        isUser: row.is_user,
        chatSessionId: row.chat_session_id,
        createdAt: new Date(row.created_at)
      })).reverse(); // Return in chronological order
    } finally {
      client.release();
    }
  },

  // Stats operations
  async getUserStats(userId: string): Promise<{
    totalReflections: number;
    totalMessages: number;
    averageMood: number;
    recentActivity: Date;
  }> {
    const client = await getPool().connect();
    try {
      const reflectionStats = await client.query(`
        SELECT COUNT(*) as count, AVG(mood) as avg_mood, MAX(created_at) as recent
        FROM reflections WHERE user_id = $1
      `, [userId]);
      
      const messageStats = await client.query(`
        SELECT COUNT(*) as count, MAX(created_at) as recent
        FROM messages WHERE user_id = $1
      `, [userId]);
      
      const reflectionRow = reflectionStats.rows[0];
      const messageRow = messageStats.rows[0];
      
      return {
        totalReflections: parseInt(reflectionRow.count) || 0,
        totalMessages: parseInt(messageRow.count) || 0,
        averageMood: Math.round((parseFloat(reflectionRow.avg_mood) || 0) * 10) / 10,
        recentActivity: new Date(Math.max(
          new Date(reflectionRow.recent || 0).getTime(),
          new Date(messageRow.recent || 0).getTime()
        ))
      };
    } finally {
      client.release();
    }
  },

  // Close connection pool
  async close(): Promise<void> {
    if (pool) {
      await pool.end();
      pool = null;
      console.log('🐘 PostgreSQL connection pool closed');
    }
  }
};
