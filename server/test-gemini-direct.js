// Simple test script to verify direct Gemini AI responses
// Run with: node test-gemini-direct.js

const { GoogleGenerativeAI } = require('@google/generative-ai');

// Make sure to set your GOOGLE_API_KEY in environment
const API_KEY = process.env.GOOGLE_API_KEY;

if (!API_KEY) {
  console.error('❌ GOOGLE_API_KEY environment variable not set!');
  console.log('Please set it with: set GOOGLE_API_KEY=your_key_here');
  process.exit(1);
}

const genAI = new GoogleGenerativeAI(API_KEY);

async function testDirectGeminiResponse() {
  try {
    console.log('🚀 Testing direct Gemini AI response...\n');
    
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
      generationConfig: {
        temperature: 0.9,
        maxOutputTokens: 200,
      },
    });

    const prompt = `You are a supportive mental health coach. A user says: "I'm feeling really anxious about my upcoming presentation at work." 
    
    Respond in this exact JSON format:
    {
      "intent": "venting",
      "message": "your supportive response here",
      "chips": ["suggestion1", "suggestion2"]
    }`;

    console.log('📤 Sending prompt to Gemini AI...');
    console.log('Prompt:', prompt);
    console.log('\n⏳ Waiting for response...\n');

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    console.log('📥 Raw Gemini AI Response:');
    console.log('='.repeat(50));
    console.log(text);
    console.log('='.repeat(50));
    
    // Try to parse the response
    try {
      const parsed = JSON.parse(text);
      console.log('\n✅ Successfully parsed JSON response:');
      console.log('Intent:', parsed.intent);
      console.log('Message:', parsed.message);
      console.log('Chips:', parsed.chips);
      
      if (parsed.intent && parsed.message) {
        console.log('\n🎉 SUCCESS: Direct Gemini AI response working!');
      } else {
        console.log('\n⚠️  Response missing required fields');
      }
      
    } catch (parseError) {
      console.log('\n❌ Failed to parse JSON response:');
      console.log('Parse error:', parseError.message);
      console.log('\n⚠️  Response format issue - but Gemini AI is responding!');
    }
    
  } catch (error) {
    console.error('\n💥 Error testing Gemini AI:');
    console.error(error.message);
    
    if (error.message.includes('API key')) {
      console.log('\n🔑 Check your API key configuration');
    } else if (error.message.includes('quota')) {
      console.log('\n💰 Check your API quota');
    } else if (error.message.includes('rate limit')) {
      console.log('\n⏱️  Rate limit exceeded, try again later');
    }
  }
}

// Run the test
testDirectGeminiResponse();
