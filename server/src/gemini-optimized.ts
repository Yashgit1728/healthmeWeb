import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';
import { ENV } from './env';

const genAI = new GoogleGenerativeAI(ENV.GOOGLE_API_KEY);

const SYSTEM_INSTRUCTION = `You are a supportive mental-wellbeing coach.

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

2) Write a single response tailored to that intent:
   - short_feeling: 1–2 sentences. Reflect mixed feelings, ask ONE gentle question.
   - venting: 2–4 sentences. Validate; summarize ONE key point; ask ONE open question; suggest ONE small next step.
   - actionable_request: up to 4 sentences or 1 short list (≤3 steps). Be concrete.
   - gibberish: 1–2 sentences. Kindly ask to rephrase, offer ONE simple option.
   - crisis: Be direct, compassionate, encourage immediate help; provide resources: 988 Lifeline (call/text 988), 911 if in danger, nearest ER. No platitudes.
   - meta: Briefly explain how responses are generated and what will change.
   - positive_sharing: 1–3 sentences. Celebrate with them, ask what made it meaningful.
   - reflection_request: 2–3 sentences. Offer gentle insight or perspective.

3) Style rules:
   - Vary openings. Avoid these phrases entirely:
     * "Thank you for sharing what's on your mind"
     * "Sometimes just putting our thoughts into words"
     * "I appreciate you taking the time"
     * "I hear you and appreciate you sharing"
     * "Thank you for being open"
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
  model: "gemini-1.5-flash",  // Use the stable model name
  generationConfig: {
    temperature: 0.9,         // High diversity
    topP: 0.95,
    topK: 40,
    maxOutputTokens: 250,
  },
  safetySettings: [
    { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
    { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
    { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
    { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
  ],
});

export interface OptimizedAIResponse {
  intent: string;
  message: string;
  chips: string[];
}

export async function getOptimizedReply(
  userText: string,
  mood?: number,
  tags?: string[],
  conversationContext?: Array<{ role: 'user' | 'assistant'; text: string }>
): Promise<OptimizedAIResponse> {
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
      role: "user" as const,
      parts: [{ text: `System: ${SYSTEM_INSTRUCTION}\n\nNow respond to the following user message:` }]
    });
    
    if (conversationContext && conversationContext.length > 0) {
      // Add last 3 exchanges for context
      const recentContext = conversationContext.slice(-6); // Last 3 user + 3 assistant messages
      for (const msg of recentContext) {
        contents.push({
          role: msg.role === 'user' ? 'user' as const : 'model' as const,
          parts: [{ text: msg.text }]
        });
      }
    }
    
    // Add current user message
    contents.push({
      role: "user" as const,
      parts: [{ text: contextualMessage }]
    });

    console.log('Sending optimized prompt to Gemini...');
    console.log('User message:', contextualMessage);
    
    const result = await model.generateContent({ contents });
    const response = await result.response;
    const text = response.text();
    
    console.log('Raw Gemini response:', text);

    // Parse JSON response
    let parsedResponse: OptimizedAIResponse;
    try {
      parsedResponse = JSON.parse(text);
      
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
      
    } catch (parseError) {
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

  } catch (error) {
    console.error('Gemini API error:', error);
    
    // Smart fallback based on user input
    const getFallbackResponse = (text: string, mood?: number): OptimizedAIResponse => {
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
export async function getOptimizedReplyWithOptions(
  userText: string,
  mood?: number,
  tags?: string[]
): Promise<OptimizedAIResponse[]> {
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
    const responses: OptimizedAIResponse[] = [];

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
      } catch (e) {
        console.warn('Failed to parse candidate response:', e);
      }
    }

    return responses.length > 0 ? responses : [await getOptimizedReply(userText, mood, tags)];
    
  } catch (error) {
    console.error('Multi-candidate generation failed:', error);
    return [await getOptimizedReply(userText, mood, tags)];
  }
}
