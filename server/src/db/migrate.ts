import sqlite3 from 'sqlite3';
import path from 'path';
import fs from 'fs';
import { Low } from 'lowdb';
import { JSONFile } from 'lowdb/node';

// Database setup
const DATA_DIR = path.resolve(process.cwd(), 'data');
fs.mkdirSync(DATA_DIR, { recursive: true });

const DB_PATH = path.join(DATA_DIR, 'healthme.db');
const db = new sqlite3.Database(DB_PATH);

// Read schema
const schemaPath = path.join(__dirname, 'schema.sql');
const schema = fs.readFileSync(schemaPath, 'utf8');

console.log('🚀 Setting up SQLite database...');

// Execute schema
db.exec(schema, (err: any) => {
  if (err) {
    console.error('❌ Schema creation failed:', err);
    return;
  }
  console.log('✅ Database schema created');
  
  // Migrate existing data from JSON if it exists
  migrateData();
});

async function migrateData() {
  const jsonDbPath = path.join(DATA_DIR, 'db.json');
  if (fs.existsSync(jsonDbPath)) {
    console.log('📦 Migrating existing data from JSON...');
    
    try {
      // Read existing JSON data
      const adapter = new JSONFile(jsonDbPath);
      const jsonDb = new Low(adapter, { users: [], reflections: [], messages: [] });
      await jsonDb.read();
      
      if (jsonDb.data) {
        const { users, reflections, messages } = jsonDb.data as any;
        
        // Migrate users
        if (users && users.length > 0) {
          for (const user of users) {
            await new Promise<void>((resolve, reject) => {
              db.run(`
                INSERT OR REPLACE INTO users (id, email, name, password_hash, about_me, created_at)
                VALUES (?, ?, ?, ?, ?, ?)
              `, [
                user.id,
                user.email,
                user.name,
                user.passwordHash,
                user.profile?.aboutMe || null,
                user.createdAt || new Date().toISOString()
              ], (err: any) => {
                if (err) reject(err);
                else resolve();
              });
            });
          }
          console.log(`✅ Migrated ${users.length} users`);
        }
        
        // Migrate reflections
        if (reflections && reflections.length > 0) {
          for (const reflection of reflections) {
            await new Promise<void>((resolve, reject) => {
              db.run(`
                INSERT OR REPLACE INTO reflections (id, user_id, text, mood, tags, response, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?)
              `, [
                reflection.id,
                reflection.userId,
                reflection.text,
                reflection.mood || null,
                reflection.tags ? JSON.stringify(reflection.tags) : null,
                reflection.response,
                reflection.createdAt || new Date().toISOString()
              ], (err: any) => {
                if (err) reject(err);
                else resolve();
              });
            });
          }
          console.log(`✅ Migrated ${reflections.length} reflections`);
        }
        
        // Migrate messages
        if (messages && messages.length > 0) {
          for (const message of messages) {
            await new Promise<void>((resolve, reject) => {
              db.run(`
                INSERT OR REPLACE INTO messages (id, user_id, text, is_user, created_at)
                VALUES (?, ?, ?, ?, ?)
              `, [
                message.id,
                message.userId,
                message.text,
                message.isUser ? 1 : 0,
                message.createdAt || new Date().toISOString()
              ], (err: any) => {
                if (err) reject(err);
                else resolve();
              });
            });
          }
          console.log(`✅ Migrated ${messages.length} messages`);
        }
        
        // Backup old JSON file
        const backupPath = path.join(DATA_DIR, 'db.json.backup');
        fs.copyFileSync(jsonDbPath, backupPath);
        console.log('💾 Old data backed up to db.json.backup');
      }
    } catch (error) {
      console.error('❌ Migration failed:', error);
    }
  }
  
  // Show database stats
  showStats();
}

function showStats() {
  db.get('SELECT COUNT(*) as count FROM users', (err: any, row: any) => {
    if (err) {
      console.error('❌ Error getting user count:', err);
      return;
    }
    const userCount = row.count;
    
    db.get('SELECT COUNT(*) as count FROM reflections', (err: any, row: any) => {
      if (err) {
        console.error('❌ Error getting reflection count:', err);
        return;
      }
      const reflectionCount = row.count;
      
      db.get('SELECT COUNT(*) as count FROM messages', (err: any, row: any) => {
        if (err) {
          console.error('❌ Error getting message count:', err);
          return;
        }
        const messageCount = row.count;
        
        console.log('\n📊 Database Statistics:');
        console.log(`Users: ${userCount}`);
        console.log(`Reflections: ${reflectionCount}`);
        console.log(`Messages: ${messageCount}`);
        
        db.close();
        console.log('✅ Database setup complete!');
      });
    });
  });
}
