"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ENV = void 0;
const path_1 = __importDefault(require("path"));
const dotenv_1 = __importDefault(require("dotenv"));
// Try to load .env from multiple possible locations
// This handles both development (ts-node) and production (dist) scenarios
const possiblePaths = [
    path_1.default.resolve(__dirname, "../../.env"), // From dist folder
    path_1.default.resolve(__dirname, "../.env"), // From src folder  
    path_1.default.resolve(process.cwd(), ".env"), // From current working directory
    path_1.default.resolve(process.cwd(), "server/.env"), // From server subdirectory
];
let envLoaded = false;
for (const envPath of possiblePaths) {
    try {
        const result = dotenv_1.default.config({ path: envPath });
        if (result.parsed) {
            console.log(`Environment loaded from: ${envPath}`);
            envLoaded = true;
            break;
        }
    }
    catch (error) {
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
console.log("Available env vars:", Object.keys(process.env).filter(key => key.includes('GOOGLE') || key.includes('JWT') || key.includes('PORT')));
// Validate required envs once here
function must(name) {
    const v = process.env[name];
    if (!v) {
        throw new Error(`${name} environment variable is not set`);
    }
    return v;
}
exports.ENV = {
    GOOGLE_API_KEY: must("GOOGLE_API_KEY"),
    PORT: process.env.PORT || "3000",
    JWT_SECRET: must("JWT_SECRET"),
    NODE_ENV: process.env.NODE_ENV || "development"
};
// Debug log during startup (remove in production)
console.log("Environment loaded:", {
    port: exports.ENV.PORT,
    nodeEnv: exports.ENV.NODE_ENV,
    hasGoogleKey: !!exports.ENV.GOOGLE_API_KEY,
    hasJwtSecret: !!exports.ENV.JWT_SECRET
});
