"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getOptimizedReply = getOptimizedReply;
exports.getOptimizedReplyWithOptions = getOptimizedReplyWithOptions;
const generative_ai_1 = require("@google/generative-ai");
const env_1 = require("./env");
const genAI = new generative_ai_1.GoogleGenerativeAI(env_1.ENV.GOOGLE_API_KEY);
const SYSTEM_INSTRUCTION = `You are a supportive mental-wellbeing coach who maintains natural conversation flow.

IMPORTANT CONVERSATION RULES:
1) If the user is answering your follow-up question, acknowledge their response first before asking the next question
2) Always maintain conversation continuity - don't start new topics unless appropriate
3) Reference specific things they mentioned in their message
4) Be conversational like a caring friend, not clinical

Task:
1) Infer the user's intent from their last message. Use one of:
   - short_feeling
   - venting
   - actionable_request
   - gibberish
   - crisis
   - meta
   - positive_sharing
   - reflection_request
   - follow_up_response (when they're answering your question)

2) Write a single response tailored to that intent:
   - follow_up_response: Acknowledge their answer, then ask ONE natural follow-up question
   - short_feeling: 1–2 sentences. Reflect their feeling, ask ONE gentle question.
   - venting: 2–4 sentences. Validate; summarize ONE key point; ask ONE open question; suggest ONE small next step.
   - actionable_request: up to 4 sentences or 1 short list (≤3 steps). Be concrete.
   - gibberish: 1–2 sentences. Kindly ask to rephrase, offer ONE simple option.
   - crisis: Be direct, compassionate, encourage immediate help; provide resources: 988 Lifeline (call/text 988), 911 if in danger, nearest ER. No platitudes.
   - meta: Briefly explain how responses are generated and what will change.
   - positive_sharing: 1–3 sentences. Celebrate with them, ask what made it meaningful.
   - reflection_request: 2–3 sentences. Offer gentle insight or perspective.

3) Style rules:
   - Vary openings. Avoid repetitive phrases
   - Max one question per response. Use emojis naturally (1-2 max).
   - Keep total length ≤ 4 sentences.
   - Be conversational like a caring friend, not clinical.
   - Reference specific things they mentioned when possible.

4) Also return up to 3 optional quick-actions ("chips") relevant to the intent:
   - Examples: "Try breathing exercise", "Reframe thought", "Save as insight", "Journal prompt", "Gratitude practice", "Take a walk", "Call someone", "Write it out"

Output strictly as JSON:
{
  "intent": "<one of the above>",
  "message": "<final text to show the user>",
  "chips": ["<0..3 labels>"]
}`;
const model = genAI.getGenerativeModel({
    model: "gemini-1.5-flash", // Use the stable model name
    generationConfig: {
        temperature: 0.9, // High diversity
        topP: 0.95,
        topK: 40,
        maxOutputTokens: 250,
    },
    safetySettings: [
        { category: generative_ai_1.HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: generative_ai_1.HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
        { category: generative_ai_1.HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: generative_ai_1.HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
        { category: generative_ai_1.HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: generative_ai_1.HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
        { category: generative_ai_1.HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: generative_ai_1.HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
    ],
});
async function getOptimizedReply(userText, mood, tags, conversationContext) {
    try {
        // Build the user message with context
        let contextualMessage = userText;
        if (mood) {
            contextualMessage += `\n\nMood level (1-10): ${mood}`;
        }
        if (tags && tags.length > 0) {
            contextualMessage += `\nTags: ${tags.join(', ')}`;
        }
        // Include recent conversation context to help avoid repetition
        const contents = [];
        // Add system instruction as the first message
        contents.push({
            role: "user",
            parts: [{ text: `System: ${SYSTEM_INSTRUCTION}\n\nNow respond to the following user message:` }]
        });
        if (conversationContext && conversationContext.length > 0) {
            // Use more context to maintain conversation flow, especially for follow-up questions
            const recentContext = conversationContext.slice(-4); // Increased from 6 to 4 for better flow
            for (const msg of recentContext) {
                contents.push({
                    role: msg.role === 'user' ? 'user' : 'model',
                    parts: [{ text: msg.text }]
                });
            }
            
            // Add specific instruction about follow-up questions
            const lastAssistantMessage = recentContext.filter(msg => msg.role === 'assistant').pop();
            if (lastAssistantMessage && lastAssistantMessage.text.includes('?')) {
                // Add instruction to acknowledge follow-up question responses
                contents.push({
                    role: "user",
                    parts: [{ text: `CRITICAL: The user's response "${userText}" is answering the follow-up question I just asked: "${lastAssistantMessage.text}"\n\nYour response must:\n1. Acknowledge their specific answer to my question\n2. Continue the conversation based on what they actually said\n3. Ask a new question that builds on their response` }]
                });
            }
        }
        // Add current user message
        contents.push({
            role: "user",
            parts: [{ text: contextualMessage }]
        });
        console.log('Sending optimized prompt to Gemini...');
        console.log('User message:', contextualMessage);
        const result = await model.generateContent({ contents });
        const response = await result.response;
        const text = response.text();
        console.log('Raw Gemini response:', text);
        // Parse JSON response
        let parsedResponse;
        try {
            // Clean the response - remove markdown formatting
            let cleanedText = text.trim();
            cleanedText = cleanedText.replace(/```json\s*/g, '').replace(/```\s*$/g, '');
            
            parsedResponse = JSON.parse(cleanedText);
            // Validate the response structure
            if (!parsedResponse.intent || !parsedResponse.message) {
                throw new Error('Invalid response structure');
            }
            // Ensure chips is an array
            if (!Array.isArray(parsedResponse.chips)) {
                parsedResponse.chips = [];
            }
            console.log('Parsed response:', parsedResponse);
            return parsedResponse;
        }
        catch (parseError) {
            console.error('Failed to parse Gemini JSON response:', parseError);
            console.error('Raw text was:', text);
            // Fallback: try to extract message from raw text
            const fallbackMessage = text.replace(/```json\n?|\n?```/g, '').trim() ||
                "I'm here to listen. What's on your mind today?";
            return {
                intent: "unknown",
                message: fallbackMessage,
                chips: ["Try again", "Take a breath"]
            };
        }
    }
    catch (error) {
        console.error('Gemini API error:', error);
        // Smart fallback based on user input
        const getFallbackResponse = (text, mood) => {
            const lowerText = text.toLowerCase();
            // Crisis detection
            if (lowerText.includes('hurt myself') || lowerText.includes('suicide') ||
                lowerText.includes('kill myself') || lowerText.includes('end it all')) {
                return {
                    intent: "crisis",
                    message: "I'm concerned about you. Please reach out for immediate help: call or text 988 for the Suicide & Crisis Lifeline, or call 911 if you're in immediate danger. You don't have to go through this alone.",
                    chips: ["Call 988", "Emergency services", "Find help nearby"]
                };
            }
            // Positive detection
            if (lowerText.includes('happy') || lowerText.includes('great') ||
                lowerText.includes('amazing') || lowerText.includes('wonderful') ||
                (mood && mood > 7)) {
                return {
                    intent: "positive_sharing",
                    message: `That's wonderful to hear! 🌟 What made this experience especially meaningful for you?`,
                    chips: ["Savor the moment", "Share with someone", "Write about it"]
                };
            }
            // Negative/struggling detection
            if (lowerText.includes('anxious') || lowerText.includes('sad') ||
                lowerText.includes('stressed') || lowerText.includes('overwhelmed') ||
                (mood && mood < 4)) {
                return {
                    intent: "venting",
                    message: `It sounds like you're going through a tough time right now. What feels like the most challenging part?`,
                    chips: ["Breathing exercise", "Talk to someone", "Take a walk"]
                };
            }
            // Default neutral response
            return {
                intent: "short_feeling",
                message: "I'm here to listen. What's been on your mind lately?",
                chips: ["Tell me more", "How are you feeling?", "What's important today?"]
            };
        };
        return getFallbackResponse(userText, mood);
    }
}
// Alternative: Multiple candidates for more variety
async function getOptimizedReplyWithOptions(userText, mood, tags) {
    try {
        let contextualMessage = userText;
        if (mood) {
            contextualMessage += `\n\nMood level (1-10): ${mood}`;
        }
        if (tags && tags.length > 0) {
            contextualMessage += `\nTags: ${tags.join(', ')}`;
        }
        const result = await model.generateContent({
            contents: [
                { role: "user", parts: [{ text: `System: ${SYSTEM_INSTRUCTION}\n\nNow respond to the following user message:` }] },
                { role: "user", parts: [{ text: contextualMessage }] }
            ],
            generationConfig: {
                temperature: 0.9,
                topP: 0.95,
                topK: 40,
                maxOutputTokens: 250,
                candidateCount: 2 // Generate 2 options
            }
        });
        const candidates = result.response.candidates || [];
        const responses = [];
        for (const candidate of candidates) {
            const text = candidate.content?.parts?.[0]?.text || '';
            try {
                const parsed = JSON.parse(text);
                if (parsed.intent && parsed.message) {
                    responses.push({
                        intent: parsed.intent,
                        message: parsed.message,
                        chips: Array.isArray(parsed.chips) ? parsed.chips : []
                    });
                }
            }
            catch (e) {
                console.warn('Failed to parse candidate response:', e);
            }
        }
        return responses.length > 0 ? responses : [await getOptimizedReply(userText, mood, tags)];
    }
    catch (error) {
        console.error('Multi-candidate generation failed:', error);
        return [await getOptimizedReply(userText, mood, tags)];
    }
}
