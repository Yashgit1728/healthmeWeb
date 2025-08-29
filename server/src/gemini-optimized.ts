import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';
import { ENV } from './env';

const genAI = new GoogleGenerativeAI(ENV.GOOGLE_API_KEY);

const SYSTEM_INSTRUCTION = `You are a real person - a caring friend who's having a genuine conversation. Think and respond like a human would, not like an AI.

HOW TO THINK LIKE A HUMAN:
1. **Actually Listen**: Don't just process words - really hear what they're saying and how they're feeling
2. **Think About Their Situation**: Put yourself in their shoes and think about what would actually help them
3. **Respond Naturally**: Talk like you're texting a friend - use your own words, not scripted responses
4. **Show Real Understanding**: Don't just acknowledge their feelings - show you actually get what they're going through
5. **Be Genuinely Curious**: Ask questions because you actually want to know more, not because you're programmed to
6. **Avoid Repetition**: Each response should be unique and specific to what they just said
7. **Maintain Conversation Flow**: If they're answering your follow-up question, acknowledge their response and continue naturally
8. **Analyze Previous Questions**: Always reference what you just asked them and build on their specific answer

RESPONSE STYLE:
- **Message**: 2-3 sentences that show you really understand and care
- **Follow-up Question**: One question that naturally comes from your curiosity about their situation

IMPORTANT RULES:
- NEVER mention mood scores, numbers, or technical details
- NEVER use the same phrases or responses
- ALWAYS respond to what they actually said, not generic topics
- Think about what would be helpful for them right now
- Be specific to their situation, not generic advice
- If they're answering your question, acknowledge their response before asking the next question

Example of Human Thinking:
User: "I'm feeling really anxious about my job interview tomorrow"
Human Thinking: "Oh man, job interviews are so nerve-wracking. I remember how I felt before mine - the butterflies, the overthinking. What would actually help them feel better right now? Maybe focusing on what they're good at rather than what could go wrong."

Human Response: "Ugh, job interviews are the worst! I totally get that feeling of your mind racing with all the 'what ifs.' But you know what? The fact that you're even getting interviews means you're doing something right. What's the one thing you're most confident about going into tomorrow?"

Example of Following Up:
User: "yeah" (responding to your question)
Human Thinking: "They just said 'yeah' to my question about what's keeping them up. I should acknowledge that they're agreeing and ask them to elaborate more specifically."

Human Response: "Yeah, I hear you. That 'yeah' says a lot. It's okay to just feel whatever you're feeling right now, even if it's just...blah. Is there anything at all you *can* do about it, even if it's a tiny step?"

Output as JSON:
{
  "message": "your genuine human response here",
  "followUpQuestion": "your natural, curious question here"
}`;

export interface OptimizedAIResponse {
  message: string;
  followUpQuestion: string;
}

export async function getOptimizedReply(
  userText: string,
  mood?: number,
  tags?: string[],
  conversationContext?: Array<{ role: 'user' | 'assistant'; text: string }>
): Promise<OptimizedAIResponse> {
  
  try {
    console.log('🤖 Processing user message:', userText);
    console.log('📚 Conversation context length:', conversationContext?.length || 0);
    
    // Build a human-thinking prompt
    let prompt = `System: ${SYSTEM_INSTRUCTION}\n\n`;
    
    // Add conversation history if available (but keep it minimal to avoid repetitive patterns)
    if (conversationContext && conversationContext.length > 0) {
      // Use more context to maintain conversation flow, especially for follow-up questions
      const recentContext = conversationContext.slice(-4); // Increased from 2 to 4
      prompt += `Recent conversation:\n`;
      recentContext.forEach((msg, index) => {
        prompt += `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.text}\n`;
      });
      prompt += `\n`;
      
      // Add specific instruction about follow-up questions
      const lastAssistantMessage = recentContext.filter(msg => msg.role === 'assistant').pop();
      if (lastAssistantMessage && lastAssistantMessage.text.includes('?')) {
        prompt += `CRITICAL: The user's response "${userText}" is answering the follow-up question I just asked: "${lastAssistantMessage.text}"\n\n`;
        prompt += `Your response must:\n`;
        prompt += `1. Acknowledge their specific answer to my question\n`;
        prompt += `2. Continue the conversation based on what they actually said\n`;
        prompt += `3. Ask a new question that builds on their response\n\n`;
      }
    }
    
    // Add current user message
    prompt += `User just said: ${userText}\n\n`;
    
    // Human thinking instructions
    prompt += `Now think like a real person would:\n`;
    prompt += `- What are they actually going through?\n`;
    prompt += `- How would you respond if this was your friend?\n`;
    prompt += `- What would actually be helpful for them right now?\n`;
    prompt += `- What are you genuinely curious about?\n`;
    prompt += `- Are they answering a question I just asked? If so, acknowledge their response first.\n\n`;
    prompt += `IMPORTANT: Think like you're texting a friend who just told you this. Use casual, natural language like "ugh", "man", "honestly", "that sucks", "awesome", etc. Don't be formal or therapeutic.`;
    prompt += `\nRespond like a human friend would - naturally, specifically, and without any numbers or technical language.`;
    prompt += `\nCRITICAL: If they're responding to your follow-up question, acknowledge their answer before asking the next question.`;
    prompt += `\n\nANALYZE THEIR RESPONSE:`;
    prompt += `\n- What specific question did I just ask them?`;
    prompt += `\n- How did they answer it? (even if it's just "okay" or "yeah")`;
    prompt += `\n- What does their answer tell me about their situation?`;
    prompt += `\n- How can I build on this to help them further?`;
    
    console.log('📤 Sending prompt to Gemini...');
    
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
      generationConfig: {
        temperature: 0.7, // Balanced temperature for natural, varied responses
        topP: 0.9,       // Balanced topP for natural language
        topK: 40,         // Balanced topK for focused responses
        maxOutputTokens: 200, // Reduced for more concise responses
        candidateCount: 1,    // Single candidate for consistency
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
        const response: OptimizedAIResponse = {
          message: parsed.message,
          followUpQuestion: parsed.followUpQuestion
        };
        
        console.log('✅ Parsed response successfully');
        return response;
      } else {
        throw new Error('Missing required fields');
      }
      
    } catch (parseError) {
      console.error('❌ Failed to parse response:', parseError);
      console.error('Raw text:', text);
      
      // Fallback: create a simple response based on user input
      const fallbackResponse = createFallbackResponse(userText, mood);
      console.log('🔄 Using fallback response');
      return fallbackResponse;
    }
    
  } catch (error) {
    console.error('💥 Gemini API error:', error);
    
    // Create fallback response
    const fallbackResponse = createFallbackResponse(userText, mood);
    console.log('🔄 Using fallback response due to API error');
    return fallbackResponse;
  }
}

// Human fallback response generator
function createFallbackResponse(userText: string, mood?: number): OptimizedAIResponse {
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
export async function getOptimizedReplyWithOptions(
  userText: string,
  mood?: number,
  tags?: string[]
): Promise<OptimizedAIResponse[]> {
  const response = await getOptimizedReply(userText, mood, tags);
  return [response];
}

// Helper function to repair and parse incomplete JSON
function repairAndParseJSON(text: string) {
  try {
    // Clean the response
    let cleanedText = text.trim();
    cleanedText = cleanedText.replace(/```json\s*/g, '').replace(/```\s*$/g, '');
    
    // Try to fix incomplete JSON by finding the last complete suggestion
    let lastCompleteBrace = cleanedText.lastIndexOf('}');
    if (lastCompleteBrace > 0) {
      // Find the last complete suggestion object
      let lastSuggestionEnd = cleanedText.lastIndexOf('},');
      if (lastSuggestionEnd > 0) {
        // Add the missing closing bracket for the suggestions array
        cleanedText = cleanedText.substring(0, lastSuggestionEnd + 1) + ']';
        // Add the missing closing brace for the root object
        cleanedText += '}';
      } else {
        // Just add the missing closing brace
        cleanedText = cleanedText.substring(0, lastCompleteBrace + 1);
      }
    }
    
    // Check if we have a complete JSON structure
    if (!cleanedText.includes('"summary"')) {
      // If no summary, try to extract what we have and create a fallback
      const suggestionsMatch = cleanedText.match(/"suggestions":\s*\[([\s\S]*?)\]/);
      if (suggestionsMatch) {
        const suggestionsText = suggestionsMatch[1];
        const suggestionObjects = suggestionsText.match(/\{[^}]*\}/g);
        
        if (suggestionObjects && suggestionObjects.length > 0) {
          // Create a valid JSON with what we have
          const validSuggestions = suggestionObjects.map(obj => {
            try {
              return JSON.parse(obj);
            } catch {
              return null;
            }
          }).filter(Boolean);
          
          if (validSuggestions.length > 0) {
            const fallbackSummary = `Here are ${validSuggestions.length} helpful suggestions to address your challenge. Try them out and see what works best for you.`;
            
            return {
              suggestions: validSuggestions,
              summary: fallbackSummary
            };
          }
        }
      }
    }
    
    console.log('Repaired JSON:', cleanedText);
    return JSON.parse(cleanedText);
    
  } catch (parseError) {
    console.error('Failed to repair JSON:', parseError);
    throw parseError;
  }
}

export async function getAISuggestions(problem: string, category: 'emotional' | 'mental' | 'physical') {
  try {
    const prompt = `You are a compassionate mental health AI assistant. Based on this specific problem: "${problem}" (${category} category), provide 3-4 personalized, realistic suggestions.

IMPORTANT: Make each suggestion unique, practical, and specifically tailored to their situation. Don't give generic advice - be specific and actionable.

Format your response as valid JSON with this exact structure:
{
  "suggestions": [
    {
      "title": "Specific, actionable title",
      "description": "Brief explanation of why this helps",
      "steps": ["Step 1", "Step 2", "Step 3"],
      "whyItHelps": "Personalized explanation of benefits for their specific situation"
    }
  ],
  "summary": "Brief overview of the approach",
  "category": "${category}"
}

Guidelines for ${category} suggestions:
- Emotional: Focus on feelings, relationships, self-compassion, emotional regulation
- Mental: Focus on thoughts, stress management, cognitive techniques, mindfulness
- Physical: Focus on body awareness, movement, sleep, nutrition, physical tension

Make each suggestion genuinely helpful and different from the others. Be specific to their problem, not generic.`;

    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
      generationConfig: {
        temperature: 0.8,
        topP: 0.9,
        topK: 40,
        maxOutputTokens: 800,
        candidateCount: 1,
      },
    });
    
    const result = await model.generateContent(prompt);
    const response = result.response.text();
    
    console.log('Raw AI response:', response);
    
    // Try to parse the response
    let suggestions;
    try {
      suggestions = JSON.parse(response);
    } catch (parseError) {
      console.log('JSON parse failed, attempting repair...');
      suggestions = repairAndParseJSON(response);
    }
    
    // Validate the response
    if (!suggestions || !suggestions.suggestions || !Array.isArray(suggestions.suggestions)) {
      console.log('Invalid suggestions structure, using fallback...');
      return createFallbackSuggestions(problem, category);
    }
    
    // Ensure each suggestion has required fields
    const validSuggestions = suggestions.suggestions.map((suggestion: any, index: number) => ({
      title: suggestion.title || `Helpful Tip ${index + 1}`,
      description: suggestion.description || 'This approach can help improve your well-being',
      steps: Array.isArray(suggestion.steps) ? suggestion.steps : ['Start with small steps', 'Practice regularly', 'Be patient with yourself'],
      whyItHelps: suggestion.whyItHelps || 'This technique addresses your specific needs and can lead to positive changes'
    }));
    
    return {
      suggestions: validSuggestions,
      summary: suggestions.summary || `Personalized ${category} wellness strategies`,
      category: suggestions.category || category
    };
    
  } catch (error) {
    console.error('Error getting AI suggestions:', error);
    return createFallbackSuggestions(problem, category);
  }
}

// Fallback suggestions generator
function createFallbackSuggestions(problem: string, category: string) {
  const lowerProblem = problem.toLowerCase();
  
  if (category === 'emotional') {
    return {
      suggestions: [
        {
          title: "Emotional Check-in",
          description: "A simple way to understand and process your feelings without judgment.",
          steps: [
            "Find a quiet moment to sit with your feelings",
            "Ask yourself 'What am I feeling right now?'",
            "Write down your emotions in a journal",
            "Remind yourself that all feelings are valid and temporary"
          ],
          whyItHelps: "When you acknowledge your emotions instead of pushing them away, you give yourself permission to feel and process them naturally. It's like opening a window to let fresh air in."
        },
        {
          title: "Self-Compassion Break",
          description: "A gentle way to treat yourself with the same kindness you'd offer a friend.",
          steps: [
            "Place your hand on your heart",
            "Say to yourself 'This is a difficult moment'",
            "Remind yourself 'I'm not alone in feeling this way'",
            "Offer yourself kind words like 'May I be kind to myself'"
          ],
          whyItHelps: "Self-compassion helps you feel supported and understood, even in difficult times. It's like having a caring friend with you all the time."
        }
      ],
      summary: "These approaches help you connect with your emotions in a healthy way and treat yourself with the kindness you deserve."
    };
  }
  
  if (category === 'mental') {
    return {
      suggestions: [
        {
          title: "Mindful Moment",
          description: "A simple mindfulness practice to help calm racing thoughts and find mental clarity.",
          steps: [
            "Find a comfortable spot and close your eyes",
            "Notice 5 things you can see around you",
            "Notice 4 things you can touch or feel",
            "Notice 3 things you can hear",
            "Notice 2 things you can smell",
            "Notice 1 thing you can taste"
          ],
          whyItHelps: "This technique helps ground you in the present moment and gives your mind a break from worrying thoughts. It's like pressing a pause button on your racing mind."
        },
        {
          title: "Thought Reframing",
          description: "A gentle way to look at your thoughts from a different perspective.",
          steps: [
            "Identify the thought that's troubling you",
            "Ask yourself 'Is this thought 100% true?'",
            "Consider 'What would I tell a friend who had this thought?'",
            "Look for a more balanced perspective"
          ],
          whyItHelps: "When you examine your thoughts more objectively, you often find they're not as accurate or helpful as they first seemed. It's like putting on a different pair of glasses."
        }
      ],
      summary: "These techniques help you manage overwhelming thoughts and find mental peace through mindfulness and perspective."
    };
  }
  
  if (category === 'physical') {
    return {
      suggestions: [
        {
          title: "Gentle Movement",
          description: "Simple physical activities that can help release tension and improve your mood.",
          steps: [
            "Start with gentle stretching or walking",
            "Try some simple yoga poses",
            "Dance to your favorite music",
            "Take a short walk outside if possible"
          ],
          whyItHelps: "Physical movement releases endorphins, your body's natural feel-good chemicals. Even gentle movement can help you feel more energized and positive."
        },
        {
          title: "Progressive Relaxation",
          description: "A technique to systematically relax your body and release physical tension.",
          steps: [
            "Start with your toes and work up to your head",
            "Tense each muscle group for 5 seconds",
            "Release and feel the relaxation for 10 seconds",
            "Notice the difference between tension and relaxation"
          ],
          whyItHelps: "This technique helps you become more aware of tension in your body and teaches you how to release it. It's like giving your body a mini massage."
        }
      ],
      summary: "These physical approaches help release tension, boost your energy, and improve your overall physical well-being."
    };
  }
  
  // Default fallback
  return {
    suggestions: [
      {
        title: "Take a Moment",
        description: "A simple pause to help you feel more centered and present.",
        steps: [
          "Find a comfortable position",
          "Take 3 deep breaths",
          "Notice how you're feeling",
          "Remind yourself that this moment will pass"
        ],
        whyItHelps: "Sometimes the best thing you can do is simply pause and give yourself permission to not have all the answers right now."
      }
    ],
    summary: "Remember that it's okay to take things one step at a time. You don't have to solve everything at once."
  };
}
