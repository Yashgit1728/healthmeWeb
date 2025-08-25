const { getOptimizedReply } = require('./dist/gemini-optimized.js');

async function testNaturalResponses() {
  console.log('🧪 Testing: NATURAL, CONVERSATIONAL RESPONSES\n');
  
  try {
    // Test messages to verify natural responses
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
      
      // Check for natural language characteristics
      const hasNaturalLanguage = response.message.includes('really') || 
                                response.message.includes('totally') || 
                                response.message.includes('sounds like') ||
                                response.message.includes('I get') ||
                                response.message.includes('That\'s');
      
      const isConcise = messageLength <= 50; // More concise responses
      
      console.log(`   Has natural language: ${hasNaturalLanguage ? '✅' : '❌'}`);
      console.log(`   Is concise: ${isConcise ? '✅' : '❌'}`);
      
      if (i < testMessages.length - 1) {
        console.log('\n' + '─'.repeat(60));
      }
    }
    
    console.log('\n🎉 Natural Response Test Complete!');
    console.log('\nExpected Improvements:');
    console.log('✅ More natural, conversational tone');
    console.log('✅ Clearer, more concise responses');
    console.log('✅ Directly related to user messages');
    console.log('✅ Warm, supportive language');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testNaturalResponses();
