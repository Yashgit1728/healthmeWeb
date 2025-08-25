// Simple test script for the new conversation system
// Run with: node test-simple-conversation.js

const { GoogleGenerativeAI } = require('@google/generative-ai');

// Make sure to set your GOOGLE_API_KEY in environment
const API_KEY = process.env.GOOGLE_API_KEY;

if (!API_KEY) {
  console.error('❌ GOOGLE_API_KEY environment variable not set!');
  console.log('Please set it with: set GOOGLE_API_KEY=your_key_here');
  process.exit(1);
}

const genAI = new GoogleGenerativeAI(API_KEY);

const SYSTEM_INSTRUCTION = `You are a supportive mental health coach. Respond naturally to what the user says, like a caring friend would.

IMPORTANT RULES:
1. ALWAYS reference specific things they mentioned in their message
2. Ask ONE follow-up question that relates directly to what they said
3. Keep responses conversational and under 3 sentences
4. Be specific to their situation, not generic

Example:
User: "I'm stressed about my presentation tomorrow"
You: "Presentations can be really nerve-wracking! What's the main thing you're worried about with tomorrow's presentation?"

Output as JSON:
{
  "message": "your response here",
  "followUpQuestion": "your specific question here"
}`;

async function testSimpleConversation() {
  try {
    console.log('🧠 Testing Simple Conversation System...\n');
    
    // Test different user messages
    const testMessages = [
      "I'm feeling really anxious about my upcoming presentation at work tomorrow.",
      "I had a fight with my best friend and I don't know what to do.",
      "I'm so excited about getting the job I wanted!",
      "I feel like I'm not good enough at anything."
    ];
    
    for (let i = 0; i < testMessages.length; i++) {
      const userMessage = testMessages[i];
      console.log(`\n--- Test ${i + 1} ---`);
      console.log(`📝 User: ${userMessage}`);
      
      // Build the prompt
      let prompt = `System: ${SYSTEM_INSTRUCTION}\n\n`;
      prompt += `Current user message: ${userMessage}\n\n`;
      prompt += `Now respond to the user's current message.`;
      
      console.log('📤 Sending to Gemini...');
      
      const model = genAI.getGenerativeModel({
        model: "gemini-1.5-flash",
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 200,
        },
      });
      
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      console.log('📥 Raw response:', text);
      
      // Try to parse the response
      try {
        let cleanedText = text.trim();
        cleanedText = cleanedText.replace(/```json\s*/g, '').replace(/```\s*$/g, '');
        
        const parsed = JSON.parse(cleanedText);
        
        if (parsed.message && parsed.followUpQuestion) {
          console.log('✅ SUCCESS:');
          console.log(`   Response: ${parsed.message}`);
          console.log(`   Follow-up: ${parsed.followUpQuestion}`);
          
          // Check relevance
          const message = parsed.message.toLowerCase();
          const userLower = userMessage.toLowerCase();
          
          let relevanceScore = 0;
          if (message.includes('presentation') && userLower.includes('presentation')) relevanceScore += 25;
          if (message.includes('work') && userLower.includes('work')) relevanceScore += 25;
          if (message.includes('friend') && userLower.includes('friend')) relevanceScore += 25;
          if (message.includes('job') && userLower.includes('job')) relevanceScore += 25;
          if (message.includes('anxious') && userLower.includes('anxious')) relevanceScore += 25;
          if (message.includes('fight') && userLower.includes('fight')) relevanceScore += 25;
          if (message.includes('excited') && userLower.includes('excited')) relevanceScore += 25;
          if (message.includes('good enough') && userLower.includes('good enough')) relevanceScore += 25;
          
          console.log(`   Relevance Score: ${relevanceScore}/100`);
          
          if (relevanceScore >= 75) {
            console.log('   🎉 EXCELLENT relevance!');
          } else if (relevanceScore >= 50) {
            console.log('   ✅ GOOD relevance');
          } else {
            console.log('   ⚠️  Could be more relevant');
          }
          
        } else {
          console.log('❌ Missing required fields');
        }
        
      } catch (parseError) {
        console.log('❌ Parse error:', parseError.message);
      }
      
      // Small delay between tests
      if (i < testMessages.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    console.log('\n🎉 Conversation test completed!');
    
  } catch (error) {
    console.error('\n💥 Error testing conversation:', error.message);
  }
}

// Run the test
testSimpleConversation();
