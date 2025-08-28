import path from "path";
import dotenv from "dotenv";

// Try to load .env from multiple possible locations
// This handles both development (ts-node) and production (dist) scenarios
const possiblePaths = [
  path.resolve(__dirname, "../../.env"),        // From dist folder
  path.resolve(__dirname, "../.env"),          // From src folder  
  path.resolve(process.cwd(), ".env"),         // From current working directory
  path.resolve(process.cwd(), "server/.env"),  // From server subdirectory
];

let envLoaded = false;
for (const envPath of possiblePaths) {
  try {
    const result = dotenv.config({ path: envPath });
    if (result.parsed) {
      console.log(`Environment loaded from: ${envPath}`);
      envLoaded = true;
      break;
    }
  } catch (error) {
    // Continue to next path
  }
}

if (!envLoaded) {
  console.warn("No .env file found in any of the expected locations");
}

// Debug: Show current working directory and __dirname
console.log("Debug info:", {
  cwd: process.cwd(),
  __dirname: __dirname,
  possiblePaths: possiblePaths
});

// Debug: Show what environment variables we have
console.log("Available env vars:", Object.keys(process.env).filter(key => 
  key.includes('GOOGLE') || key.includes('JWT') || key.includes('PORT')
));

// Validate required envs once here
function must(name: string) {
  const v = process.env[name];
  if (!v) {
    throw new Error(`${name} environment variable is not set`);
  }
  return v;
}

export const ENV = {
  NODE_ENV: process.env.NODE_ENV ?? 'development',
  PORT: process.env.PORT ?? '3000',
  GOOGLE_API_KEY: process.env.GOOGLE_API_KEY ?? '',
  JWT_SECRET: process.env.JWT_SECRET ?? ''
};

// Debug log during startup (remove in production)
console.log("Environment loaded:", {
  port: ENV.PORT,
  nodeEnv: ENV.NODE_ENV,
  hasGoogleKey: !!ENV.GOOGLE_API_KEY,
  hasJwtSecret: !!ENV.JWT_SECRET
});
