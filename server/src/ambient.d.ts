// Only used if a package has missing or broken types at build time.
// TS will use real @types/* packages first, this is a fallback.
// Note: Do NOT declare 'express' here as it overrides @types/express
declare module 'cors';
declare module 'cookie-parser';
declare module 'compression';
declare module 'jsonwebtoken';
declare module 'bcryptjs';
// If you ever change the import path for Google gen AI, list here too:
declare module '@google/generative-ai';
