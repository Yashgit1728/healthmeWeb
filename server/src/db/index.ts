// Database adapter that automatically chooses between JSON and PostgreSQL
import { ENV } from '../env';

// Import both database implementations
import jsonDb from '../db';
import { db as postgresDb } from './postgres';

// Choose database based on environment
const usePostgres = ENV.NODE_ENV === 'production' && !!ENV.DATABASE_URL;

console.log('🗄️  Database configuration:', {
  type: usePostgres ? 'PostgreSQL' : 'JSON',
  nodeEnv: ENV.NODE_ENV,
  hasDatabaseUrl: !!ENV.DATABASE_URL,
  databaseUrlLength: ENV.DATABASE_URL?.length || 0,
  databaseUrlStart: ENV.DATABASE_URL?.substring(0, 20) + '...' || 'none'
});

// Export the appropriate database
export default usePostgres ? postgresDb : jsonDb;
export type { User, Reflection, Message } from './postgres';
