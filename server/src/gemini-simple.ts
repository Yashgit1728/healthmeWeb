import { GoogleGenerativeAI } from '@google/generative-ai';
import { ENV } from './env';

const genAI = new GoogleGenerativeAI(ENV.GOOGLE_API_KEY);

export interface SimpleAIResponse {
  message: string;
  follow_up_question?: string;
  suggestion: {
    title: string;
    steps: string[];
  };
}

export async function generateSimpleResponse(
  userText: string,
  mood?: number,
  tags?: string[]
): Promise<SimpleAIResponse> {
  try {
    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-flash-latest",
      generationConfig: {
        temperature: 0.9, // Higher temperature for more creative responses
        topP: 0.95,
        topK: 40,
        maxOutputTokens: 500,
        candidateCount: 1,
      }
    });

    const prompt = `You are a warm, empathetic friend who truly listens and responds naturally to what people share. Someone just opened up to you about their feelings.

What they shared: "${userText}"
${mood ? `Their mood level (1-10): ${mood}` : ''}
${tags && tags.length > 0 ? `Context tags: ${tags.join(', ')}` : ''}

Respond like a caring friend would - be genuine, conversational, and specific to what they actually said. Don't use generic responses. Really listen to their words and respond to their unique situation.

Guidelines:
- Use a natural, conversational tone (like texting a close friend)
- Reference specific things they mentioned
- Show you understand their particular situation
- Be warm but not overly formal
- Use emojis naturally (not forced)
- Ask a genuine follow-up question if it feels right
- Suggest something practical and specific to their situation

Respond in JSON format:
{
  "message": "Your natural, specific response to what they shared",
  "follow_up_question": "A genuine question based on what they said (can be empty if not needed)",
  "suggestion": {
    "title": "Something specific that might help their situation",
    "steps": ["Practical step 1", "Practical step 2", "Practical step 3"]
  }
}

Remember: Be real, be specific to their words, and respond like you actually care about this particular person and their particular situation.`;

    console.log('Sending prompt to Gemini...');
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    console.log('Raw Gemini response:', text);

    // Try to parse JSON response
    try {
      const cleanText = text.replace(/```json\n?|\n?```/g, '').trim();
      const parsed = JSON.parse(cleanText);
      
      // Validate the response structure
      if (parsed.message && parsed.suggestion && parsed.suggestion.title && Array.isArray(parsed.suggestion.steps)) {
        return parsed as SimpleAIResponse;
      } else {
        throw new Error('Invalid response structure');
      }
    } catch (parseError) {
      console.error('Failed to parse Gemini response:', parseError);
      
      // Create a more personalized fallback based on their input
      const getFallbackResponse = (text: string, mood?: number) => {
        const isNegative = text.toLowerCase().includes('sad') || text.toLowerCase().includes('anxious') || 
                          text.toLowerCase().includes('worried') || text.toLowerCase().includes('stressed') ||
                          text.toLowerCase().includes('depressed') || (mood && mood < 5);
        
        const isPositive = text.toLowerCase().includes('happy') || text.toLowerCase().includes('good') ||
                          text.toLowerCase().includes('excited') || text.toLowerCase().includes('grateful') ||
                          (mood && mood > 7);

        if (isNegative) {
          return {
            message: `I can hear that you're going through a tough time right now. ${text.includes('work') ? 'Work stress can be really overwhelming.' : text.includes('relationship') ? 'Relationship challenges are never easy.' : 'What you\'re feeling is completely valid.'} You don't have to carry this alone. 💙`,
            follow_up_question: "What's been the hardest part about this for you?",
            suggestion: {
              title: "Ground yourself in this moment",
              steps: [
                "Take 5 slow, deep breaths",
                "Name 3 things you can see, 2 you can touch, 1 you can hear",
                "Remind yourself: 'This feeling is temporary, I will get through this'"
              ]
            }
          };
        } else if (isPositive) {
          return {
            message: `I love hearing the positivity in what you shared! 🌟 ${text.includes('accomplish') ? 'It sounds like you achieved something meaningful.' : text.includes('grateful') ? 'Gratitude is such a beautiful mindset.' : 'It\'s wonderful that you\'re experiencing some joy.'} These moments are worth celebrating.`,
            follow_up_question: "What made this experience especially meaningful for you?",
            suggestion: {
              title: "Savor this positive moment",
              steps: [
                "Take a moment to really feel this good feeling",
                "Write down what made today special",
                "Share your joy with someone you care about"
              ]
            }
          };
        } else {
          return {
            message: `Thank you for sharing what's on your mind. Sometimes just putting our thoughts into words can be really helpful. 💭 I appreciate you taking the time to reflect and be honest about where you're at right now.`,
            follow_up_question: "What's one thing that would make today feel a little better for you?",
            suggestion: {
              title: "Check in with yourself",
              steps: [
                "Ask yourself: 'What do I need right now?'",
                "Do one small thing that brings you comfort",
                "Give yourself credit for taking time to reflect"
              ]
            }
          };
        }
      };

      return getFallbackResponse(userText, mood);
    }

  } catch (error) {
    console.error('Gemini API error:', error);
    
    // Use the same personalized fallback logic for API errors
    const getFallbackResponse = (text: string, mood?: number) => {
      const isNegative = text.toLowerCase().includes('sad') || text.toLowerCase().includes('anxious') || 
                        text.toLowerCase().includes('worried') || text.toLowerCase().includes('stressed') ||
                        text.toLowerCase().includes('depressed') || (mood && mood < 5);
      
      const isPositive = text.toLowerCase().includes('happy') || text.toLowerCase().includes('good') ||
                        text.toLowerCase().includes('excited') || text.toLowerCase().includes('grateful') ||
                        (mood && mood > 7);

      if (isNegative) {
        return {
          message: `I can hear that you're going through a tough time right now. ${text.includes('work') ? 'Work stress can be really overwhelming.' : text.includes('relationship') ? 'Relationship challenges are never easy.' : 'What you\'re feeling is completely valid.'} You don't have to carry this alone. 💙`,
          follow_up_question: "What's been the hardest part about this for you?",
          suggestion: {
            title: "Ground yourself in this moment",
            steps: [
              "Take 5 slow, deep breaths",
              "Name 3 things you can see, 2 you can touch, 1 you can hear",
              "Remind yourself: 'This feeling is temporary, I will get through this'"
            ]
          }
        };
      } else if (isPositive) {
        return {
          message: `I love hearing the positivity in what you shared! 🌟 ${text.includes('accomplish') ? 'It sounds like you achieved something meaningful.' : text.includes('grateful') ? 'Gratitude is such a beautiful mindset.' : 'It\'s wonderful that you\'re experiencing some joy.'} These moments are worth celebrating.`,
          follow_up_question: "What made this experience especially meaningful for you?",
          suggestion: {
            title: "Savor this positive moment",
            steps: [
              "Take a moment to really feel this good feeling",
              "Write down what made today special",
              "Share your joy with someone you care about"
            ]
          }
        };
      } else {
        return {
          message: `Thank you for sharing what's on your mind. Sometimes just putting our thoughts into words can be really helpful. 💭 I appreciate you taking the time to reflect and be honest about where you're at right now.`,
          follow_up_question: "What's one thing that would make today feel a little better for you?",
          suggestion: {
            title: "Check in with yourself",
            steps: [
              "Ask yourself: 'What do I need right now?'",
              "Do one small thing that brings you comfort",
              "Give yourself credit for taking time to reflect"
            ]
          }
        };
      }
    };

    return getFallbackResponse(userText, mood);
  }
}
