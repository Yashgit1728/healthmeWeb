const { getOptimizedReply } = require('./dist/gemini-optimized.js');

async function testNoSuggestions() {
  console.log('🧪 Testing: NO SUGGESTIONS should be generated\n');
  
  try {
    // Test multiple messages to ensure variety and no suggestions
    const testMessages = [
      "I'm feeling anxious about my presentation tomorrow",
      "I had a great day at work today",
      "I'm struggling with sleep lately",
      "I feel overwhelmed with my responsibilities"
    ];
    
    for (let i = 0; i < testMessages.length; i++) {
      const message = testMessages[i];
      console.log(`\n📝 Test ${i + 1}: "${message}"`);
      
      const response = await getOptimizedReply(message, 5, ['test']);
      
      console.log('✅ Response received:');
      console.log(`   Message: ${response.message}`);
      console.log(`   Follow-up: ${response.followUpQuestion}`);
      
      // Verify NO suggestions field exists
      if (response.suggestions || response.suggestion) {
        console.error('❌ ERROR: Suggestions field still exists!');
        console.error('   Response object:', JSON.stringify(response, null, 2));
        return;
      }
      
      console.log('✅ No suggestions field found - Perfect!');
    }
    
    console.log('\n🎉 SUCCESS: All responses are suggestion-free!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testNoSuggestions();
