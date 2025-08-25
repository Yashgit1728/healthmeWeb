const { getOptimizedReply } = require('./dist/gemini-optimized.js');

async function testWarmResponses() {
  console.log('🧪 Testing: WARM, EMOTIONAL, FRIENDLY RESPONSES\n');
  
  try {
    // Test messages to verify warm, emotional responses
    const testMessages = [
      "I'm feeling really anxious about my job interview tomorrow",
      "I had a great day at work today",
      "I'm struggling with sleep lately",
      "I feel like I'm not making progress in my life"
    ];
    
    for (let i = 0; i < testMessages.length; i++) {
      const message = testMessages[i];
      console.log(`\n📝 Test ${i + 1}: "${message}"`);
      
      const response = await getOptimizedReply(message, 5, ['test']);
      
      console.log('✅ AI Response:');
      console.log(`   Message: ${response.message}`);
      console.log(`   Follow-up: ${response.followUpQuestion}`);
      
      // Analyze response quality
      const messageLength = response.message.split(' ').length;
      const questionLength = response.followUpQuestion.split(' ').length;
      
      console.log('📊 Response Analysis:');
      console.log(`   Message length: ${messageLength} words`);
      console.log(`   Question length: ${questionLength} words`);
      
      // Check for warm, emotional language
      const hasWarmLanguage = response.message.includes('honey') || 
                              response.message.includes('sweetheart') || 
                              response.message.includes('sweetie') ||
                              response.message.includes('love') ||
                              response.message.includes('Oh my') ||
                              response.message.includes('I\'m so') ||
                              response.message.includes('breaks my heart') ||
                              response.message.includes('makes my heart');
      
      const hasEmotion = response.message.includes('worried') || 
                        response.message.includes('sorry') || 
                        response.message.includes('happy') ||
                        response.message.includes('excited') ||
                        response.message.includes('proud');
      
      console.log(`   Has warm language: ${hasWarmLanguage ? '✅' : '❌'}`);
      console.log(`   Has emotion: ${hasEmotion ? '✅' : '❌'}`);
      
      if (i < testMessages.length - 1) {
        console.log('\n' + '─'.repeat(60));
      }
    }
    
    console.log('\n🎉 Warm Response Test Complete!');
    console.log('\nExpected Improvements:');
    console.log('✅ More warm, caring language');
    console.log('✅ Genuine emotional expression');
    console.log('✅ No technical numbers or jargon');
    console.log('✅ Personal, friendly tone');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testWarmResponses();
