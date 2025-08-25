const { getOptimizedReply } = require('./dist/gemini-optimized.js');

async function testImprovedAI() {
  console.log('🧪 Testing: IMPROVED AI RESPONSES\n');
  
  try {
    // Test messages to verify improved AI responses
    const testMessages = [
      "I'm feeling really anxious about my job interview tomorrow",
      "I had a breakthrough moment in therapy today",
      "I'm struggling with sleep and it's affecting my mood",
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
      
      // Check for AI-like characteristics
      const hasInsight = response.message.includes('suggest') || 
                        response.message.includes('indicate') || 
                        response.message.includes('demonstrate') ||
                        response.message.includes('often') ||
                        response.message.includes('typically');
      
      const hasSpecificity = response.message.includes(message.split(' ')[0]) || 
                            response.message.includes(message.split(' ')[1]);
      
      console.log(`   Has psychological insight: ${hasInsight ? '✅' : '❌'}`);
      console.log(`   References user's message: ${hasSpecificity ? '✅' : '❌'}`);
      
      if (i < testMessages.length - 1) {
        console.log('\n' + '─'.repeat(60));
      }
    }
    
    console.log('\n🎉 AI Response Quality Test Complete!');
    console.log('\nExpected Improvements:');
    console.log('✅ More detailed, thoughtful responses');
    console.log('✅ Psychological insights and understanding');
    console.log('✅ Authentic AI-like language and reasoning');
    console.log('✅ Better conversation flow and engagement');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testImprovedAI();
