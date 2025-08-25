// Test script to verify conversation relevance in Gemini AI responses
// Run with: node test-conversation-relevance.js

const { GoogleGenerativeAI } = require('@google/generative-ai');

// Make sure to set your GOOGLE_API_KEY in environment
const API_KEY = process.env.GOOGLE_API_KEY;

if (!API_KEY) {
  console.error('❌ GOOGLE_API_KEY environment variable not set!');
  console.log('Please set it with: set GOOGLE_API_KEY=your_key_here');
  process.exit(1);
}

const genAI = new GoogleGenerativeAI(API_KEY);

const SYSTEM_INSTRUCTION = `You are a supportive mental-wellbeing coach. Your responses must be RELEVANT and CONTEXTUAL to the user's actual message and conversation history.

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

2) Write a response tailored to that intent AND the specific content they mentioned:
   - short_feeling: 1–2 sentences. Reflect their specific feeling, ask ONE relevant question about what they mentioned.
   - venting: 2–4 sentences. Validate their specific situation; acknowledge ONE key point they made; ask ONE relevant follow-up question; suggest ONE small next step related to their situation.
   - actionable_request: up to 4 sentences or 1 short list (≤3 steps). Be concrete and specific to their request.
   - gibberish: 1–2 sentences. Kindly ask to rephrase, offer ONE simple option.
   - crisis: Be direct, compassionate, encourage immediate help; provide resources: 988 Lifeline (call/text 988), 911 if in danger, nearest ER. No platitudes.
   - meta: Briefly explain how responses are generated and what will change.
   - positive_sharing: 1–3 sentences. Celebrate their specific achievement, ask what made it meaningful.
   - reflection_request: 2–3 sentences. Offer gentle insight or perspective related to their specific situation.

3) Style rules - BE RELEVANT AND CONTEXTUAL:
   - Reference specific things they mentioned in their message
   - Ask follow-up questions that relate to what they actually said
   - Make suggestions relevant to their specific situation
   - Keep total length ≤ 4 sentences
   - Be conversational like a caring friend, not clinical
   - Vary your vocabulary but stay on topic

4) Also return up to 3 optional quick-actions ("chips") relevant to their specific situation:
   - Examples: "Try breathing exercise", "Reframe thought", "Save as insight", "Journal prompt", "Gratitude practice", "Take a walk", "Call someone", "Write it out"
   - Choose chips that make sense for their specific message

Output strictly as JSON:
{
  "intent": "<one of the above>",
  "message": "<final text to show the user>",
  "chips": ["<0..3 labels>"]
}`;

async function testConversationRelevance() {
  try {
    console.log('🧠 Testing Gemini AI Conversation Relevance...\n');
    
    // Simulate a conversation flow
    const conversation = [
      {
        role: 'user',
        text: "I'm feeling really anxious about my upcoming presentation at work tomorrow."
      },
      {
        role: 'assistant',
        text: "That sounds really stressful! Presentations can be nerve-wracking. What specifically about the presentation is making you most anxious?"
      },
      {
        role: 'user',
        text: "I'm worried I'll forget what to say and look stupid in front of my boss."
      }
    ];
    
    console.log('📝 Conversation Context:');
    conversation.forEach((msg, index) => {
      console.log(`${index + 1}. ${msg.role.toUpperCase()}: ${msg.text}`);
    });
    
    console.log('\n🔄 Testing follow-up response relevance...\n');
    
    // Build the conversation context for Gemini
    const contents = [];
    
    // Add system instruction
    contents.push({
      role: "user",
      parts: [{ text: `System: ${SYSTEM_INSTRUCTION}\n\nIMPORTANT: Your response must be RELEVANT to what the user actually said. Reference specific details from their message and conversation history.\n\nNow respond to the following user message:` }]
    });
    
    // Add conversation history
    for (const msg of conversation) {
      contents.push({
        role: msg.role === 'user' ? 'user' : 'model',
        parts: [{ text: msg.text }]
      });
    }
    
    // Add current user message (the last one)
    const currentMessage = conversation[conversation.length - 1].text;
    contents.push({
      role: "user",
      parts: [{ text: currentMessage }]
    });
    
    console.log('📤 Sending to Gemini AI with conversation context...');
    console.log('Current message:', currentMessage);
    console.log('Context length:', conversation.length, 'messages');
    
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
      generationConfig: {
        temperature: 0.8, // Balanced for relevance + variety
        topP: 0.9,
        topK: 40,
        maxOutputTokens: 300,
      },
    });
    
    const result = await model.generateContent({ contents });
    const response = await result.response;
    const text = response.text();
    
    console.log('\n📥 Raw Gemini AI Response:');
    console.log('='.repeat(50));
    console.log(text);
    console.log('='.repeat(50));
    
    // Try to parse the response
    try {
      const parsed = JSON.parse(text.replace(/```json\s*/g, '').replace(/```\s*$/g, ''));
      
      if (parsed.intent && parsed.message) {
        console.log('\n✅ Parsed successfully:');
        console.log('Intent:', parsed.intent);
        console.log('Message:', parsed.message);
        console.log('Chips:', parsed.chips);
        
        // Analyze relevance
        console.log('\n🔍 RELEVANCE ANALYSIS:');
        console.log('='.repeat(50));
        
        const message = parsed.message.toLowerCase();
        const userMessage = currentMessage.toLowerCase();
        
        // Check if response references specific things from user message
        const specificReferences = [];
        if (message.includes('presentation')) specificReferences.push('presentation');
        if (message.includes('boss')) specificReferences.push('boss');
        if (message.includes('forget')) specificReferences.push('forgetting');
        if (message.includes('stupid') || message.includes('embarrassed')) specificReferences.push('fear of looking bad');
        if (message.includes('tomorrow')) specificReferences.push('timeline');
        
        console.log('Specific references found:', specificReferences.length);
        if (specificReferences.length > 0) {
          console.log('References:', specificReferences.join(', '));
        }
        
        // Check if follow-up question is relevant
        const hasQuestion = message.includes('?');
        if (hasQuestion) {
          console.log('✅ Contains follow-up question');
          
          // Check if question relates to their specific concern
          const questionRelevance = [];
          if (message.includes('practice') || message.includes('prepare')) questionRelevance.push('preparation');
          if (message.includes('experience') || message.includes('before')) questionRelevance.push('past experience');
          if (message.includes('support') || message.includes('help')) questionRelevance.push('getting help');
          if (message.includes('confidence') || message.includes('nervous')) questionRelevance.push('confidence building');
          
          if (questionRelevance.length > 0) {
            console.log('✅ Question is relevant to their situation:', questionRelevance.join(', '));
          } else {
            console.log('⚠️  Question may not be specific to their concern');
          }
        } else {
          console.log('❌ No follow-up question found');
        }
        
        // Overall relevance score
        const relevanceScore = Math.min(100, (specificReferences.length * 20) + (hasQuestion ? 30 : 0) + (questionRelevance.length * 10));
        console.log(`\n📊 Overall Relevance Score: ${relevanceScore}/100`);
        
        if (relevanceScore >= 80) {
          console.log('🎉 EXCELLENT! Response is highly relevant to the conversation!');
        } else if (relevanceScore >= 60) {
          console.log('✅ GOOD! Response is mostly relevant to the conversation.');
        } else {
          console.log('⚠️  Response could be more relevant to the specific conversation.');
        }
        
      } else {
        console.log('\n⚠️  Missing required fields');
      }
      
    } catch (parseError) {
      console.log('\n❌ Failed to parse JSON response:');
      console.log('Parse error:', parseError.message);
    }
    
  } catch (error) {
    console.error('\n💥 Error testing conversation relevance:', error.message);
  }
}

// Run the test
testConversationRelevance();
