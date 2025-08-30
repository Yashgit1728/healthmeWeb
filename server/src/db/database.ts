import sqlite3 from 'sqlite3';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';

// Database types
export interface User {
  id: string;
  email: string;
  name: string;
  passwordHash: string;
  profile?: {
    aboutMe?: string;
  };
}

export interface Message {
  id: string;
  userId: string;
  text: string;
  isUser: boolean;
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

// Database singleton
class DatabaseManager {
  private db: sqlite3.Database;
  private static instance: DatabaseManager;

  private constructor() {
    const DATA_DIR = path.resolve(process.cwd(), 'data');
    fs.mkdirSync(DATA_DIR, { recursive: true });
    
    const DB_PATH = path.join(DATA_DIR, 'healthme.db');
    this.db = new sqlite3.Database(DB_PATH);
    
    // Enable foreign keys
    this.db.run('PRAGMA foreign_keys = ON');
    
    // Enable WAL mode for better performance
    this.db.run('PRAGMA journal_mode = WAL');
    
    console.log('📊 SQLite database connected');
  }

  public static getInstance(): DatabaseManager {
    if (!DatabaseManager.instance) {
      DatabaseManager.instance = new DatabaseManager();
    }
    return DatabaseManager.instance;
  }

  // Helper method to run queries with promises
  private runQuery(sql: string, params: any[] = []): Promise<any> {
    return new Promise((resolve, reject) => {
      this.db.run(sql, params, function(err) {
        if (err) reject(err);
        else resolve(this);
      });
    });
  }

  private getQuery(sql: string, params: any[] = []): Promise<any> {
    return new Promise((resolve, reject) => {
      this.db.get(sql, params, (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  }

  private allQuery(sql: string, params: any[] = []): Promise<any[]> {
    return new Promise((resolve, reject) => {
      this.db.all(sql, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }

  // User operations
  async createUser(user: Omit<User, 'id'>): Promise<User> {
    const id = uuidv4();
    await this.runQuery(`
      INSERT INTO users (id, email, name, password_hash, about_me)
      VALUES (?, ?, ?, ?, ?)
    `, [id, user.email, user.name, user.passwordHash, user.profile?.aboutMe || null]);
    
    return { ...user, id };
  }

  async getUserByEmail(email: string): Promise<User | null> {
    const row = await this.getQuery(`
      SELECT id, email, name, password_hash, about_me
      FROM users WHERE email = ?
    `, [email]);
    
    if (!row) return null;
    
    return {
      id: row.id,
      email: row.email,
      name: row.name,
      passwordHash: row.password_hash,
      profile: row.about_me ? { aboutMe: row.about_me } : undefined
    };
  }

  async getUserById(id: string): Promise<User | null> {
    const row = await this.getQuery(`
      SELECT id, email, name, password_hash, about_me
      FROM users WHERE id = ?
    `, [id]);
    
    if (!row) return null;
    
    return {
      id: row.id,
      email: row.email,
      name: row.name,
      passwordHash: row.password_hash,
      profile: row.about_me ? { aboutMe: row.about_me } : undefined
    };
  }

  async updateUserProfile(id: string, aboutMe: string): Promise<void> {
    await this.runQuery(`
      UPDATE users SET about_me = ? WHERE id = ?
    `, [aboutMe, id]);
  }

  // Reflection operations
  async createReflection(reflection: Omit<Reflection, 'id' | 'createdAt'>): Promise<Reflection> {
    const id = uuidv4();
    await this.runQuery(`
      INSERT INTO reflections (id, user_id, text, mood, tags, response)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [
      id,
      reflection.userId,
      reflection.text,
      reflection.mood || null,
      reflection.tags ? JSON.stringify(reflection.tags) : null,
      reflection.response
    ]);
    
    return { ...reflection, id, createdAt: new Date() };
  }

  async getReflections(userId: string, limit = 50): Promise<Reflection[]> {
    const rows = await this.allQuery(`
      SELECT id, user_id, text, mood, tags, response, created_at
      FROM reflections 
      WHERE user_id = ?
      ORDER BY created_at DESC
      LIMIT ?
    `, [userId, limit]);
    
    return rows.map(row => ({
      id: row.id,
      userId: row.user_id,
      text: row.text,
      mood: row.mood,
      tags: row.tags ? JSON.parse(row.tags) : undefined,
      response: row.response,
      createdAt: new Date(row.created_at)
    }));
  }

  // Message operations
  async createMessage(message: Omit<Message, 'id' | 'createdAt'>): Promise<Message> {
    const id = uuidv4();
    await this.runQuery(`
      INSERT INTO messages (id, user_id, text, is_user)
      VALUES (?, ?, ?, ?)
    `, [id, message.userId, message.text, message.isUser ? 1 : 0]);
    
    return { ...message, id, createdAt: new Date() };
  }

  async getRecentMessages(userId: string, limit = 10): Promise<Message[]> {
    const rows = await this.allQuery(`
      SELECT id, user_id, text, is_user, created_at
      FROM messages 
      WHERE user_id = ?
      ORDER BY created_at DESC
      LIMIT ?
    `, [userId, limit]);
    
    return rows.map(row => ({
      id: row.id,
      userId: row.user_id,
      text: row.text,
      isUser: row.is_user === 1,
      createdAt: new Date(row.created_at)
    })).reverse(); // Return in chronological order
  }

  // Stats operations
  async getUserStats(userId: string): Promise<{
    totalReflections: number;
    totalMessages: number;
    averageMood: number;
    recentActivity: Date;
  }> {
    const reflectionStats = await this.getQuery(`
      SELECT COUNT(*) as count, AVG(mood) as avg_mood, MAX(created_at) as recent
      FROM reflections WHERE user_id = ?
    `, [userId]);
    
    const messageStats = await this.getQuery(`
      SELECT COUNT(*) as count, MAX(created_at) as recent
      FROM messages WHERE user_id = ?
    `, [userId]);
    
    return {
      totalReflections: reflectionStats.count || 0,
      totalMessages: messageStats.count || 0,
      averageMood: Math.round((reflectionStats.avg_mood || 0) * 10) / 10,
      recentActivity: new Date(Math.max(
        new Date(reflectionStats.recent || 0).getTime(),
        new Date(messageStats.recent || 0).getTime()
      ))
    };
  }

  // Cleanup
  close(): void {
    this.db.close();
  }
}

// Export singleton instance
export const db = DatabaseManager.getInstance();
