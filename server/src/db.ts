import { Low } from 'lowdb';
import { JSONFile } from 'lowdb/node';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';

interface User {
  id: string;
  email: string;
  name: string;
  passwordHash: string;
  resetToken?: string;
  resetTokenExpiry?: Date;
  profile?: {
    aboutMe?: string;
  };
}

interface Message {
  id: string;
  userId: string;
  text: string;
  isUser: boolean;
  createdAt: Date;
  chatSessionId?: string; // Add chat session ID for conversation isolation
}

interface Reflection {
  id: string;
  userId: string;
  text: string;
  mood?: number;
  tags?: string[];
  response: string;
  createdAt: Date;
}

interface DbData {
  users: User[];
  reflections: Reflection[];
  messages: Message[];
}

const defaultData: DbData = {
  users: [],
  reflections: [],
  messages: []
};

// Initialize database with proper path handling for production
const getDbPath = () => {
  if (process.env.NODE_ENV === 'production') {
    // In production, use /tmp directory which is writable on Render
    return path.join('/tmp', 'healthme-db.json');
  } else {
    // In development, use relative path from src
    return path.join(__dirname, '../data/db.json');
  }
};

// Ensure data directory exists
const ensureDataDir = () => {
  const dbPath = getDbPath();
  const dataDir = path.dirname(dbPath);
  
  if (!fs.existsSync(dataDir)) {
    try {
      fs.mkdirSync(dataDir, { recursive: true });
      console.log(`Created data directory: ${dataDir}`);
    } catch (error) {
      console.error(`Failed to create data directory: ${dataDir}`, error);
    }
  }
  
  return dbPath;
};

const dbPath = ensureDataDir();
const adapter = new JSONFile<DbData>(dbPath);
const db = new Low<DbData>(adapter, defaultData);

// Initialize database connection
async function initDb(): Promise<void> {
  try {
    console.log(`Initializing database at: ${dbPath}`);
    
    await db.read();
    
    // Ensure all required arrays exist
    if (db.data) {
      if (!Array.isArray(db.data.messages)) {
        db.data.messages = [];
      }
      if (!Array.isArray(db.data.users)) {
        db.data.users = [];
      }
      if (!Array.isArray(db.data.reflections)) {
        db.data.reflections = [];
      }
      
      // Write back if we made changes
      await db.write();
      console.log('Database initialized with arrays:', {
        messages: db.data.messages.length,
        users: db.data.users.length,
        reflections: db.data.reflections.length
      });
    } else {
      console.log('No existing data found, creating fresh database');
      db.data = defaultData;
      await db.write();
    }
  } catch (error) {
    console.error('Database initialization error:', error);
    // If there's an error, try to create a fresh database
    try {
      db.data = defaultData;
      await db.write();
      console.log('Created fresh database due to initialization error');
    } catch (writeError) {
      console.error('Failed to create fresh database:', writeError);
      throw writeError; // Re-throw to prevent server from starting with broken DB
    }
  }
}

// Initialize immediately
initDb().catch((error) => {
  console.error('Critical: Failed to initialize database:', error);
  process.exit(1); // Exit if we can't initialize the database
});

const dbOperations = {
  async getReflections(userId: string): Promise<Reflection[]> {
    await db.read();
    if (!db.data) {
      db.data = defaultData;
      await db.write();
    }
    return (db.data.reflections || []).filter((r: Reflection) => r.userId === userId);
  },

  async createReflection(userId: string, text: string, mood: number, tags: string[]): Promise<Reflection> {
    await db.read();
    if (!db.data) {
      db.data = defaultData;
      await db.write();
    }
    
    // Ensure reflections array exists
    if (!Array.isArray(db.data.reflections)) {
      db.data.reflections = [];
    }
    
    const newReflection: Reflection = {
      id: uuidv4(),
      userId,
      text,
      mood,
      tags,
      response: '', // This will be set by the AI response
      createdAt: new Date()
    };
    
    console.log('Creating reflection:', { userId, text: text.substring(0, 50), mood, tagsCount: tags.length });
    console.log('Current reflections count:', db.data.reflections.length);
    
    db.data.reflections.push(newReflection);
    await db.write();
    
    console.log('Reflection created successfully, new count:', db.data.reflections.length);
    return newReflection;
  },

  async getRecentMessages(userId: string, limit: number, chatSessionId?: string): Promise<Message[]> {
    await db.read();
    if (!db.data) {
      db.data = defaultData;
      await db.write();
    }
    
    // Ensure messages array exists and is an array
    if (!Array.isArray(db.data.messages)) {
      db.data.messages = [];
      await db.write();
    }
    
    let userMessages = db.data.messages
      .filter((m: Message) => m.userId === userId);
    
    // Filter by chat session if provided
    if (chatSessionId) {
      userMessages = userMessages.filter((m: Message) => m.chatSessionId === chatSessionId);
    }
    
    const sortedMessages = userMessages
      .sort((a: Message, b: Message) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, limit);
    
    console.log(`Found ${sortedMessages.length} recent messages for user ${userId} in chat session ${chatSessionId || 'default'}`);
    return sortedMessages;
  },

  async addMessage(userId: string, text: string, isUser: boolean, chatSessionId?: string): Promise<Message> {
    await db.read();
    if (!db.data) {
      db.data = defaultData;
      await db.write();
    }
    
    // Ensure messages array exists
    if (!Array.isArray(db.data.messages)) {
      db.data.messages = [];
    }
    
    const message: Message = {
      id: uuidv4(),
      userId,
      text,
      isUser,
      createdAt: new Date(),
      chatSessionId
    };
    
    console.log('Adding message:', { userId, text: text.substring(0, 50), isUser, chatSessionId });
    console.log('Current messages count:', db.data.messages.length);
    
    db.data.messages.push(message);
    await db.write();
    
    console.log('Message added successfully, new count:', db.data.messages.length);
    return message;
  },

  async getUserProfile(userId: string): Promise<User['profile']> {
    await db.read();
    if (!db.data) {
      db.data = defaultData;
      await db.write();
    }
    const user = (db.data.users || []).find((u: User) => u.id === userId);
    return user?.profile || {};
  },

  async createUser(user: Omit<User, 'id'>): Promise<User> {
    await db.read();
    if (!db.data) {
      db.data = defaultData;
      await db.write();
    }
    
    // Ensure users array exists
    if (!Array.isArray(db.data.users)) {
      db.data.users = [];
    }
    
    const newUser = {
      ...user,
      id: uuidv4()
    };
    
    console.log('Creating user:', { email: newUser.email, name: newUser.name });
    console.log('Current users count:', db.data.users.length);
    
    db.data.users.push(newUser);
    await db.write();
    
    console.log('User created successfully, new count:', db.data.users.length);
    return newUser;
  },

  async getUserByEmail(email: string): Promise<User | undefined> {
    await db.read();
    if (!db.data) {
      db.data = defaultData;
      await db.write();
    }
    
    // Ensure users array exists
    if (!Array.isArray(db.data.users)) {
      db.data.users = [];
      await db.write();
    }
    
    const user = db.data.users.find((u: User) => u.email === email);
    console.log(`Looking for user with email: ${email}, found: ${!!user}`);
    return user;
  },

  async getUserById(id: string): Promise<User | undefined> {
    await db.read();
    if (!db.data) {
      db.data = defaultData;
      await db.write();
    }
    
    // Ensure users array exists
    if (!Array.isArray(db.data.users)) {
      db.data.users = [];
      await db.write();
    }
    
    const user = db.data.users.find((u: User) => u.id === id);
    console.log(`Looking for user with id: ${id}, found: ${!!user}`);
    return user;
  },

  async updateUserResetToken(userId: string, resetToken: string, expiry: Date): Promise<void> {
    console.log(`🔍 updateUserResetToken called with:`, { userId, resetTokenLength: resetToken.length, expiry });
    
    await db.read();
    console.log(`📖 Database read completed`);
    
    if (!db.data) {
      console.log(`⚠️  No database data, initializing...`);
      db.data = defaultData;
      await db.write();
      console.log(`✅ Database initialized with default data`);
    }
    
    // Ensure users array exists
    if (!Array.isArray(db.data.users)) {
      console.log(`⚠️  Users array not found, creating...`);
      db.data.users = [];
      await db.write();
      console.log(`✅ Users array created`);
    }
    
    console.log(`🔍 Looking for user with ID: ${userId}`);
    console.log(`🔍 Total users in database: ${db.data.users.length}`);
    
    const user = db.data.users.find((u: User) => u.id === userId);
    if (!user) {
      console.error(`❌ User with ID ${userId} not found in database`);
      console.error(`❌ Available users:`, db.data.users.map(u => ({ id: u.id, email: u.email, name: u.name })));
      throw new Error(`User with ID ${userId} not found`);
    }
    
    console.log(`✅ User found: ${user.email} (${user.name})`);
    console.log(`💾 Updating user reset token...`);
    
    user.resetToken = resetToken;
    user.resetTokenExpiry = expiry;
    
    console.log(`💾 Attempting to write to database...`);
    await db.write();
    console.log(`✅ Reset token updated successfully for user: ${user.email}`);
  },

  async getUserByResetToken(resetToken: string): Promise<User | undefined> {
    await db.read();
    if (!db.data) {
      db.data = defaultData;
      await db.write();
    }
    
    const user = db.data.users.find((u: User) => 
      u.resetToken === resetToken && 
      u.resetTokenExpiry && 
      new Date(u.resetTokenExpiry) > new Date()
    );
    
    return user;
  },

  async updateUserPassword(userId: string, newPasswordHash: string): Promise<void> {
    await db.read();
    if (!db.data) {
      db.data = defaultData;
      await db.write();
    }
    
    const user = db.data.users.find((u: User) => u.id === userId);
    if (user) {
      user.passwordHash = newPasswordHash;
      user.resetToken = undefined;
      user.resetTokenExpiry = undefined;
      await db.write();
      console.log(`Password updated for user: ${user.email}`);
    }
  },

  // Debug methods (remove in production)
  async getAllUsers(): Promise<User[]> {
    await db.read();
    if (!db.data) {
      db.data = defaultData;
      await db.write();
    }
    return db.data.users || [];
  },

  async getAllReflections(): Promise<Reflection[]> {
    await db.read();
    if (!db.data) {
      db.data = defaultData;
      await db.write();
    }
    return db.data.reflections || [];
  },

  async getAllMessages(): Promise<Message[]> {
    await db.read();
    if (!db.data) {
      db.data = defaultData;
      await db.write();
    }
    return db.data.messages || [];
  },

  async getStats(userId: string, range: '7d' | '30d'): Promise<{
    reflectionsCount: number;
    avgMood: number;
    tags: Array<{ tag: string; count: number }>;
    byDay: Array<{ date: string; count: number; avgMood: number }>;
  }> {
    await db.read();
    if (!db.data) {
      db.data = defaultData;
      await db.write();
    }
    const now = new Date();
    const days = range === '7d' ? 7 : 30;
    const cutoff = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

    const userReflections = (db.data.reflections || [])
      .filter((r: Reflection) => r.userId === userId && new Date(r.createdAt) >= cutoff);

    const moodSum = userReflections.reduce((sum: number, r: Reflection) => sum + (r.mood || 0), 0);
    const moodCount = userReflections.filter((r: Reflection) => r.mood !== undefined).length;

    // Count tag occurrences
    const tagCounts = new Map<string, number>();
    userReflections.forEach((r: Reflection) => {
      r.tags?.forEach((tag: string) => {
        tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
      });
    });

    // Sort tags by count and format for frontend
    const tags = Array.from(tagCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([tag, count]) => ({ tag, count }));

    // Group by day for charts
    const dayMap = new Map<string, { count: number; moodSum: number; moodCount: number }>();
    
    // Initialize all days in range
    for (let i = 0; i < days; i++) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const dateStr = date.toISOString().split('T')[0];
      dayMap.set(dateStr, { count: 0, moodSum: 0, moodCount: 0 });
    }

    // Fill with actual data
    userReflections.forEach((r: Reflection) => {
      const dateStr = new Date(r.createdAt).toISOString().split('T')[0];
      const dayData = dayMap.get(dateStr);
      if (dayData) {
        dayData.count++;
        if (r.mood !== undefined) {
          dayData.moodSum += r.mood;
          dayData.moodCount++;
        }
      }
    });

    // Convert to array format
    const byDay = Array.from(dayMap.entries())
      .map(([date, data]) => ({
        date,
        count: data.count,
        avgMood: data.moodCount > 0 ? data.moodSum / data.moodCount : 0
      }))
      .sort((a, b) => a.date.localeCompare(b.date));

    return {
      reflectionsCount: userReflections.length,
      avgMood: moodCount > 0 ? moodSum / moodCount : 0,
      tags,
      byDay
    };
  }
};

export default dbOperations;
export type { User, Reflection, Message };