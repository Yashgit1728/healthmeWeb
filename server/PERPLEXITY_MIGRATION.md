# Reverted: Back to Gemini API

This document outlines the reversion from Perplexity API back to Google's Gemini API.

## Changes Made

### 1. Dependencies Reverted
- Removed: `@ai-sdk/perplexity` and `ai`
- Added back: `@google/generative-ai`

### 2. Environment Variables
- Changed back: `PERPLEXITY_API_KEY` → `GOOGLE_API_KEY`

### 3. Files Restored
- `perplexity.ts` → `gemini.ts` (restored)
- `perplexity-optimized.ts` → `gemini-optimized.ts` (restored)

### 4. API Endpoints Restored
- `/test-perplexity` → `/test-gemini` (restored)
- Status endpoint now shows `geminiApiConfigured: true` (restored)

## Setup Instructions

1. Get your Google API key from [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create a `.env` file in the server directory with:
   ```
   GOOGLE_API_KEY=your_google_api_key_here
   JWT_SECRET=your_jwt_secret_here
   PORT=3000
   NODE_ENV=development
   ```

3. Install dependencies:
   ```bash
   npm install
   ```

4. Test the API:
   ```bash
   npm run dev
   ```
   Then visit: `http://localhost:3000/test-gemini`

## Model Configuration

The system now uses Google's `gemini-1.5-flash` model by default, which provides:
- High-quality responses
- Advanced safety features
- Reliable performance

## API Compatibility

All existing functionality has been preserved:
- Mental health coaching responses
- Intent detection
- Response scoring and optimization
- Fallback mechanisms
- Error handling

## Benefits of Gemini

1. **Advanced AI**: Powered by Google's latest AI technology
2. **Safety features**: Built-in content filtering and safety controls
3. **High quality**: Excellent response quality and consistency
4. **Reliable**: Stable API with Google's infrastructure support
