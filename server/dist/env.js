"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ENV = void 0;
const path_1 = __importDefault(require("path"));
const dotenv_1 = __importDefault(require("dotenv"));
// Load .env from the server root (one level above dist at runtime)
dotenv_1.default.config({
    path: path_1.default.resolve(__dirname, "../.env"),
});
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
