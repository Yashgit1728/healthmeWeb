"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const zod_1 = require("zod");
const gemini_1 = require("../gemini");
const prompts_1 = require("../prompts");
const db_1 = __importDefault(require("../db"));
const router = (0, express_1.Router)();
// Keep track of recent interactions per user
const userHistory = new Map();
// Initialize or get user history
function getUserHistory(userId) {
    if (!userHistory.has(userId)) {
        userHistory.set(userId, {
            assistantOpeners: [],
            assistantQuestions: [],
            lastSuggestionBucket: ''
        });
    }
    return userHistory.get(userId);
}
// Update user history with new interaction
function updateUserHistory(userId, message, question, suggestionBucket) {
    const history = getUserHistory(userId);
    // Update openers (keep last 10)
    const opening = message.split('.')[0] + '.';
    history.assistantOpeners = [
        opening,
        ...history.assistantOpeners
    ].slice(0, 10);
    // Update questions (keep last 5)
    if (question) {
        history.assistantQuestions = [
            question,
            ...history.assistantQuestions
        ].slice(0, 5);
    }
    // Update suggestion bucket
    history.lastSuggestionBucket = suggestionBucket;
    userHistory.set(userId, history);
}
const ReflectionSchema = zod_1.z.object({
    text: zod_1.z.string().min(1, 'Text is required'),
    mood: zod_1.z.number().min(0).max(10).optional(),
    tags: zod_1.z.array(zod_1.z.string()).optional()
});
router.post('/', async (req, res) => {
    if (!req.user) {
        return res.status(401).json({ error: 'Not authenticated' });
    }
    const parsed = ReflectionSchema.safeParse(req.body);
    if (!parsed.success) {
        return res.status(400).json({
            errors: parsed.error.issues.map(issue => ({
                path: issue.path.join('.'),
                message: issue.message
            }))
        });
    }
    try {
        const { text, mood, tags } = parsed.data;
        const userId = req.user.id;
        // Get user history and profile
        const history = getUserHistory(userId);
        const userProfile = await db_1.default.getUserProfile(userId);
        // Get recent messages
        const recentMessages = await db_1.default.getRecentMessages(userId, 5);
        // Generate reflection
        const response = await (0, gemini_1.generateWithRetry)((0, prompts_1.counselorPrompt)({
            journal: text,
            mood,
            tags,
            recent: recentMessages.map(m => ({ role: m.isUser ? 'user' : 'assistant', text: m.text })),
            profile: { aboutMe: userProfile?.aboutMe },
            lastAssistantOpeners: history.assistantOpeners,
            lastAssistantQuestions: history.assistantQuestions,
            lastSuggestionBucket: history.lastSuggestionBucket
        }), {
            history: {
                assistantLast5: recentMessages.filter((m) => !m.isUser).slice(-5),
                assistantOpenersLast10: history.assistantOpeners,
                assistantQuestionsLast5: history.assistantQuestions
            }
        });
        if (!response) {
            throw new Error('Failed to generate response');
        }
        // Store the reflection
        const reflection = await db_1.default.createReflection({
            userId,
            text,
            mood,
            tags,
            response: response.message,
            suggestion: response.suggestion
        });
        // Update user history
        updateUserHistory(userId, response.message, response.follow_up_question || '', // Convert undefined to empty string
        response.suggestion.title);
        // Prepare response with optional tags
        const responseWithTags = {
            id: reflection.id,
            message: response.message,
            follow_up_question: response.follow_up_question,
            suggestion: response.suggestion,
            tags: tags // Use the input tags instead of response tags
        };
        res.json(responseWithTags);
    }
    catch (error) {
        console.error('Reflection error:', error);
        res.status(500).json({ error: 'Failed to process reflection' });
    }
});
exports.default = router;
