import path from "path";
import dotenv from "dotenv";

// Load .env from the server root (one level above dist at runtime)
dotenv.config({
  path: path.resolve(__dirname, "../.env"),
});

// Validate required envs once here
function must(name: string) {
  const v = process.env[name];
  if (!v) {
    throw new Error(`${name} environment variable is not set`);
  }
  return v;
}

export const ENV = {
  GOOGLE_API_KEY: must("GOOGLE_API_KEY"),
  PORT: process.env.PORT || "3000",
  JWT_SECRET: must("JWT_SECRET"),
  NODE_ENV: process.env.NODE_ENV || "development"
};

// Debug log during startup (remove in production)
console.log("Environment loaded:", {
  port: ENV.PORT,
  nodeEnv: ENV.NODE_ENV,
  hasGoogleKey: !!ENV.GOOGLE_API_KEY,
  hasJwtSecret: !!ENV.JWT_SECRET
});
