"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const env_1 = require("./env"); // Must be first import
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const zod_1 = require("zod");
const reflections_1 = __importDefault(require("./routes/reflections"));
const stats_1 = __importDefault(require("./routes/stats"));
const auth_1 = __importDefault(require("./routes/auth"));
const auth_2 = require("./middleware/auth");
const app = (0, express_1.default)();
// Middleware
app.use((0, cors_1.default)({
    origin: 'http://localhost:5173',
    credentials: true
}));
app.use(express_1.default.json());
app.use((0, cookie_parser_1.default)());
// Request validation schema
const ReflectRequestSchema = zod_1.z.object({
    entry: zod_1.z.string().min(1, "Journal entry is required"),
    type: zod_1.z.enum(['feeling', 'reflection']).default('reflection')
});
// Status endpoint to check API configuration
app.get('/status', (_req, res) => {
    res.json({
        geminiApiConfigured: true,
        environment: env_1.ENV.NODE_ENV,
        message: 'Server is running'
    });
});
// Routes
app.use('/auth', auth_1.default);
app.use('/reflections', auth_2.authMiddleware, reflections_1.default);
app.use('/stats', auth_2.authMiddleware, stats_1.default);
app.listen(Number(env_1.ENV.PORT), () => {
    console.log(`Server running on port ${env_1.ENV.PORT}`);
});
