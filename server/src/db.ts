import { Low } from 'lowdb';
import { JSONFile } from 'lowdb/node';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

interface User {
  id: string;
  email: string;
  name: string;
  passwordHash: string;
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
}

interface Reflection {
  id: string;
  userId: string;
  text: string;
  mood?: number;
  tags?: string[];
  response: string;
  suggestion: {
    title: string;
    steps: string[];
  };
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

// Initialize database
const adapter = new JSONFile<DbData>(path.join(__dirname, '../data/db.json'));
const db = new Low<DbData>(adapter, defaultData);

// Initialize database connection
async function initDb(): Promise<void> {
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
  }
}

// Initialize immediately
initDb().catch(console.error);

const dbOperations = {
  async getReflections(userId: string): Promise<Reflection[]> {
    await db.read();
    if (!db.data) {
      db.data = defaultData;
      await db.write();
    }
    return (db.data.reflections || []).filter((r: Reflection) => r.userId === userId);
  },

  async createReflection(reflection: Omit<Reflection, 'id' | 'createdAt'>): Promise<Reflection> {
    await db.read();
    if (!db.data) {
      db.data = defaultData;
      await db.write();
    }
    const newReflection = {
      ...reflection,
      id: uuidv4(),
      createdAt: new Date()
    };
    db.data.reflections.push(newReflection);
    await db.write();
    return newReflection;
  },

  async getRecentMessages(userId: string, limit: number): Promise<Message[]> {
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
    
    const userMessages = db.data.messages
      .filter((m: Message) => m.userId === userId)
      .sort((a: Message, b: Message) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, limit);
    
    console.log(`Found ${userMessages.length} recent messages for user ${userId}`);
    return userMessages;
  },

  async addMessage(userId: string, text: string, isUser: boolean): Promise<Message> {
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
      createdAt: new Date()
    };
    
    console.log('Adding message:', { userId, text: text.substring(0, 50), isUser });
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
    const newUser = {
      ...user,
      id: uuidv4()
    };
    db.data.users.push(newUser);
    await db.write();
    return newUser;
  },

  async getUserByEmail(email: string): Promise<User | undefined> {
    await db.read();
    if (!db.data) {
      db.data = defaultData;
      await db.write();
    }
    return (db.data.users || []).find((u: User) => u.email === email);
  },

  async getUserById(id: string): Promise<User | undefined> {
    await db.read();
    if (!db.data) {
      db.data = defaultData;
      await db.write();
    }
    return (db.data.users || []).find((u: User) => u.id === id);
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