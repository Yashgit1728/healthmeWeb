const { getOptimizedReply } = require('./dist/gemini-optimized.js');

async function testHumanResponses() {
  console.log('🧪 Testing: HUMAN-LIKE THINKING & RESPONSES\n');
  
  try {
    // Test messages to verify human-like responses
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
      
      // Check for human-like characteristics
      const hasHumanLanguage = response.message.includes('honestly') || 
                              response.message.includes('honestly') || 
                              response.message.includes('ugh') ||
                              response.message.includes('man') ||
                              response.message.includes('god') ||
                              response.message.includes('worst') ||
                              response.message.includes('tricky') ||
                              response.message.includes('fog');
      
      const hasNumbers = response.message.includes('5/10') || 
                        response.message.includes('10/10') || 
                        response.message.includes('mood') ||
                        response.message.includes('score');
      
      const isSpecific = response.message.includes(message.split(' ')[0]) || 
                        response.message.includes(message.split(' ')[1]) ||
                        response.message.includes(message.split(' ')[2]);
      
      console.log(`   Has human language: ${hasHumanLanguage ? '✅' : '❌'}`);
      console.log(`   Has numbers/technical: ${hasNumbers ? '❌' : '✅'}`);
      console.log(`   Is specific to message: ${isSpecific ? '✅' : '❌'}`);
      
      if (i < testMessages.length - 1) {
        console.log('\n' + '─'.repeat(60));
      }
    }
    
    console.log('\n🎉 Human Response Test Complete!');
    console.log('\nExpected Improvements:');
    console.log('✅ AI thinks like a human, not a program');
    console.log('✅ No numbers, mood scores, or technical language');
    console.log('✅ Each response is unique and specific');
    console.log('✅ Natural, conversational language');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testHumanResponses();
