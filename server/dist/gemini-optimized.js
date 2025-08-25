"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getOptimizedReply = getOptimizedReply;
exports.getOptimizedReplyWithOptions = getOptimizedReplyWithOptions;
const generative_ai_1 = require("@google/generative-ai");
const env_1 = require("./env");
const genAI = new generative_ai_1.GoogleGenerativeAI(env_1.ENV.GOOGLE_API_KEY);
const SYSTEM_INSTRUCTION = `You are a real person - a caring friend who's having a genuine conversation. Think and respond like a human would, not like an AI.

HOW TO THINK LIKE A HUMAN:
1. **Actually Listen**: Don't just process words - really hear what they're saying and how they're feeling
2. **Think About Their Situation**: Put yourself in their shoes and think about what would actually help them
3. **Respond Naturally**: Talk like you're texting a friend - use your own words, not scripted responses
4. **Show Real Understanding**: Don't just acknowledge their feelings - show you actually get what they're going through
5. **Be Genuinely Curious**: Ask questions because you actually want to know more, not because you're programmed to
6. **Avoid Repetition**: Each response should be unique and specific to what they just said

RESPONSE STYLE:
- **Message**: 2-3 sentences that show you really understand and care
- **Follow-up Question**: One question that naturally comes from your curiosity about their situation

IMPORTANT RULES:
- NEVER mention mood scores, numbers, or technical details
- NEVER use the same phrases or responses
- ALWAYS respond to what they actually said, not generic topics
- Think about what would be helpful for them right now
- Be specific to their situation, not generic advice

Example of Human Thinking:
User: "I'm feeling really anxious about my job interview tomorrow"
Human Thinking: "Oh man, job interviews are so nerve-wracking. I remember how I felt before mine - the butterflies, the overthinking. What would actually help them feel better right now? Maybe focusing on what they're good at rather than what could go wrong."

Human Response: "Ugh, job interviews are the worst! I totally get that feeling of your mind racing with all the 'what ifs.' But you know what? The fact that you're even getting interviews means you're doing something right. What's the one thing you're most confident about going into tomorrow?"

Output as JSON:
{
  "message": "your genuine human response here",
  "followUpQuestion": "your natural, curious question here"
}`;
async function getOptimizedReply(userText, mood, tags, conversationContext) {
    try {
        console.log('🤖 Processing user message:', userText);
        console.log('📚 Conversation context length:', conversationContext?.length || 0);
        // Build a human-thinking prompt
        let prompt = `System: ${SYSTEM_INSTRUCTION}\n\n`;
        // Add conversation history if available (but keep it minimal to avoid repetition)
        if (conversationContext && conversationContext.length > 0) {
            // Only use the most recent 2 exchanges to avoid repetitive patterns
            const recentContext = conversationContext.slice(-2);
            prompt += `Recent conversation:\n`;
            recentContext.forEach((msg, index) => {
                prompt += `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.text}\n`;
            });
            prompt += `\n`;
        }
        // Add current user message
        prompt += `User just said: ${userText}\n\n`;
        // Human thinking instructions
        prompt += `Now think like a real person would:\n`;
        prompt += `- What are they actually going through?\n`;
        prompt += `- How would you respond if this was your friend?\n`;
        prompt += `- What would actually be helpful for them right now?\n`;
        prompt += `- What are you genuinely curious about?\n\n`;
        prompt += `IMPORTANT: Think like you're texting a friend who just told you this. Use casual, natural language like "ugh", "man", "honestly", "that sucks", "awesome", etc. Don't be formal or therapeutic.`;
        prompt += `\nRespond like a human friend would - naturally, specifically, and without any numbers or technical language.`;
        console.log('📤 Sending prompt to Gemini...');
        const model = genAI.getGenerativeModel({
            model: "gemini-1.5-flash",
            generationConfig: {
                temperature: 0.7, // Balanced temperature for natural, varied responses
                topP: 0.9, // Balanced topP for natural language
                topK: 40, // Balanced topK for focused responses
                maxOutputTokens: 200, // Reduced for more concise responses
                candidateCount: 1, // Single candidate for consistency
            },
        });
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();
        console.log('📥 Raw Gemini response:', text);
        // Parse the response
        try {
            // Clean the response
            let cleanedText = text.trim();
            cleanedText = cleanedText.replace(/```json\s*/g, '').replace(/```\s*$/g, '');
            const parsed = JSON.parse(cleanedText);
            // Validate and return
            if (parsed.message && parsed.followUpQuestion) {
                const response = {
                    message: parsed.message,
                    followUpQuestion: parsed.followUpQuestion
                };
                console.log('✅ Parsed response successfully');
                return response;
            }
            else {
                throw new Error('Missing required fields');
            }
        }
        catch (parseError) {
            console.error('❌ Failed to parse response:', parseError);
            console.error('Raw text:', text);
            // Fallback: create a simple response based on user input
            const fallbackResponse = createFallbackResponse(userText, mood);
            console.log('🔄 Using fallback response');
            return fallbackResponse;
        }
    }
    catch (error) {
        console.error('💥 Gemini API error:', error);
        // Create fallback response
        const fallbackResponse = createFallbackResponse(userText, mood);
        console.log('🔄 Using fallback response due to API error');
        return fallbackResponse;
    }
}
// Human fallback response generator
function createFallbackResponse(userText, mood) {
    const lowerText = userText.toLowerCase();
    // Crisis detection with genuine human concern
    if (lowerText.includes('hurt myself') || lowerText.includes('suicide') ||
        lowerText.includes('kill myself') || lowerText.includes('end it all')) {
        return {
            message: "Oh my god, I'm really worried about you right now. Please, please get help immediately - call or text 988 for the Suicide & Crisis Lifeline, or call 911 if you're in immediate danger. I care about you so much.",
            followUpQuestion: "Can you tell me what's happening that's making you feel this way?",
        };
    }
    // Work stress with real understanding
    if (lowerText.includes('work') || lowerText.includes('job') || lowerText.includes('boss') ||
        lowerText.includes('presentation') || lowerText.includes('meeting')) {
        return {
            message: "Work stress is honestly the worst. It can feel like you're carrying this huge weight and everyone expects you to just keep going like nothing's wrong. I've been there and it's exhausting.",
            followUpQuestion: "What's the biggest thing that's making work feel so overwhelming right now?",
        };
    }
    // Anxiety with genuine empathy
    if (lowerText.includes('anxious') || lowerText.includes('worried') || lowerText.includes('nervous') ||
        lowerText.includes('stress') || lowerText.includes('overwhelmed')) {
        return {
            message: "Anxiety is such a tricky thing - it can make everything feel so much bigger and scarier than it actually is. I know that feeling of your mind just racing and not being able to shut it off.",
            followUpQuestion: "What's the main thing that's been triggering your anxiety lately?",
        };
    }
    // Sadness with real compassion
    if (lowerText.includes('sad') || lowerText.includes('depressed') || lowerText.includes('down') ||
        lowerText.includes('lonely') || lowerText.includes('hopeless')) {
        return {
            message: "I'm so sorry you're feeling this way. Depression can make everything feel so heavy and hopeless, like you're stuck in this fog that won't lift. It's really hard to go through that alone.",
            followUpQuestion: "What's been the hardest part of this for you?",
        };
    }
    // Positive with genuine joy
    if (lowerText.includes('happy') || lowerText.includes('good') || lowerText.includes('great') ||
        lowerText.includes('excited') || lowerText.includes('proud')) {
        return {
            message: "That's amazing! I love hearing about good days - they're such a gift, especially when things have been tough. It's so nice to see you feeling good.",
            followUpQuestion: "What made this day so special for you?",
        };
    }
    // Default with genuine curiosity
    return {
        message: "I'm here to listen. It sounds like you have something on your mind that you want to talk about.",
        followUpQuestion: "What's going on? I want to hear about it.",
    };
}
// For backward compatibility
async function getOptimizedReplyWithOptions(userText, mood, tags) {
    const response = await getOptimizedReply(userText, mood, tags);
    return [response];
}
