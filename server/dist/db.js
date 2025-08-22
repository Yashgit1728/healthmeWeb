"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const lowdb_1 = require("lowdb");
const node_1 = require("lowdb/node");
const path_1 = __importDefault(require("path"));
const uuid_1 = require("uuid");
const defaultData = {
    users: [],
    reflections: [],
    messages: []
};
// Initialize database
const adapter = new node_1.JSONFile(path_1.default.join(__dirname, '../data/db.json'));
const db = new lowdb_1.Low(adapter, defaultData);
// Initialize database connection
async function initDb() {
    await db.read();
}
// Initialize immediately
initDb().catch(console.error);
const dbOperations = {
    async getReflections(userId) {
        await db.read();
        return db.data.reflections.filter((r) => r.userId === userId);
    },
    async createReflection(reflection) {
        await db.read();
        const newReflection = {
            ...reflection,
            id: (0, uuid_1.v4)(),
            createdAt: new Date()
        };
        db.data.reflections.push(newReflection);
        await db.write();
        return newReflection;
    },
    async getRecentMessages(userId, limit) {
        await db.read();
        return db.data.messages
            .filter((m) => m.userId === userId)
            .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
            .slice(0, limit);
    },
    async getUserProfile(userId) {
        await db.read();
        const user = db.data.users.find((u) => u.id === userId);
        return user?.profile || {};
    },
    async createUser(user) {
        await db.read();
        const newUser = {
            ...user,
            id: (0, uuid_1.v4)()
        };
        db.data.users.push(newUser);
        await db.write();
        return newUser;
    },
    async getUserByEmail(email) {
        await db.read();
        return db.data.users.find((u) => u.email === email);
    },
    async getUserById(id) {
        await db.read();
        return db.data.users.find((u) => u.id === id);
    },
    async getStats(userId, range) {
        await db.read();
        const now = new Date();
        const days = range === '7d' ? 7 : 30;
        const cutoff = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
        const userReflections = db.data.reflections
            .filter((r) => r.userId === userId && new Date(r.createdAt) >= cutoff);
        const moodSum = userReflections.reduce((sum, r) => sum + (r.mood || 0), 0);
        const moodCount = userReflections.filter((r) => r.mood !== undefined).length;
        // Count tag occurrences
        const tagCounts = new Map();
        userReflections.forEach((r) => {
            r.tags?.forEach((tag) => {
                tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
            });
        });
        // Sort tags by count
        const topTags = Array.from(tagCounts.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([tag]) => tag);
        return {
            totalEntries: userReflections.length,
            averageMood: moodCount > 0 ? moodSum / moodCount : 0,
            topTags
        };
    }
};
exports.default = dbOperations;
