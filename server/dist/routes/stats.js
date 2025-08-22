"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const zod_1 = require("zod");
const db_1 = __importDefault(require("../db"));
const router = (0, express_1.Router)();
const StatsRangeSchema = zod_1.z.object({
    range: zod_1.z.enum(['7d', '30d']).default('7d')
});
router.get('/', async (req, res) => {
    if (!req.user) {
        return res.status(401).json({ error: 'Not authenticated' });
    }
    const parsed = StatsRangeSchema.safeParse(req.query);
    if (!parsed.success) {
        return res.status(400).json({
            errors: parsed.error.issues.map(issue => ({
                path: issue.path.join('.'),
                message: issue.message
            }))
        });
    }
    try {
        const stats = await db_1.default.getStats(req.user.id, parsed.data.range);
        res.json(stats);
    }
    catch (error) {
        console.error('Stats error:', error);
        res.status(500).json({ error: 'Failed to fetch stats' });
    }
});
exports.default = router;
