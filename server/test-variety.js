// Test script to demonstrate variety in Gemini AI responses
// Run with: node test-variety.js

const { GoogleGenerativeAI } = require('@google/generative-ai');

// Make sure to set your GOOGLE_API_KEY in environment
const API_KEY = process.env.GOOGLE_API_KEY;

if (!API_KEY) {
  console.error('❌ GOOGLE_API_KEY environment variable not set!');
  console.log('Please set it with: set GOOGLE_API_KEY=your_key_here');
  process.exit(1);
}

const genAI = new GoogleGenerativeAI(API_KEY);

const SYSTEM_INSTRUCTION = `You are a supportive mental-wellbeing coach. IMPORTANT: Generate a UNIQUE and FRESH response every time. Never repeat previous responses.

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

2) Write a single response tailored to that intent:
   - short_feeling: 1–2 sentences. Reflect mixed feelings, ask ONE gentle question.
   - venting: 2–4 sentences. Validate; summarize ONE key point; ask ONE open question; suggest ONE small next step.
   - actionable_request: up to 4 sentences or 1 short list (≤3 steps). Be concrete.
   - gibberish: 1–2 sentences. Kindly ask to rephrase, offer ONE simple option.
   - crisis: Be direct, compassionate, encourage immediate help; provide resources: 988 Lifeline (call/text 988), 911 if in danger, nearest ER. No platitudes.
   - meta: Briefly explain how responses are generated and what will change.
   - positive_sharing: 1–3 sentences. Celebrate with them, ask what made it meaningful.
   - reflection_request: 2–3 sentences. Offer gentle insight or perspective.

3) Style rules - BE CREATIVE AND VARIED:
   - Use DIFFERENT openings every time. Avoid repetition.
   - Max one question per response. Use emojis naturally (1-2 max).
   - Keep total length ≤ 4 sentences.
   - Be conversational like a caring friend, not clinical.
   - Reference specific things they mentioned when possible.
   - Vary your vocabulary and sentence structure.

4) Also return up to 3 optional quick-actions ("chips") relevant to the intent:
   - Examples: "Try breathing exercise", "Reframe thought", "Save as insight", "Journal prompt", "Gratitude practice", "Take a walk", "Call someone", "Write it out"
   - Vary these suggestions too - don't repeat the same ones.

Output strictly as JSON:
{
  "intent": "<one of the above>",
  "message": "<final text to show the user>",
  "chips": ["<0..3 labels>"]
}`;

async function testResponseVariety() {
  try {
    console.log('🚀 Testing Gemini AI Response Variety...\n');
    
    const userMessage = "I'm feeling really anxious about my upcoming presentation at work.";
    
    console.log('📝 User message:', userMessage);
    console.log('🔄 Generating 5 different responses...\n');
    
    const responses = [];
    
    for (let i = 1; i <= 5; i++) {
      try {
        console.log(`--- Response ${i} ---`);
        
        const model = genAI.getGenerativeModel({
          model: "gemini-1.5-flash",
          generationConfig: {
            temperature: 0.95 + (i * 0.01), // Slightly different temperature each time
            topP: 0.98,
            topK: 50 + (i * 2),
            maxOutputTokens: 300,
          },
        });

        const prompt = `System: ${SYSTEM_INSTRUCTION}\n\nIMPORTANT: Generate response #${i} - make it COMPLETELY DIFFERENT from any previous responses. Use different words, structure, and approach.\n\nUser message: ${userMessage}`;
        
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();
        
        console.log('📥 Raw response:', text);
        
        // Try to parse the response
        try {
          const parsed = JSON.parse(text.replace(/```json\s*/g, '').replace(/```\s*$/g, ''));
          
          if (parsed.intent && parsed.message) {
            console.log('✅ Parsed successfully:');
            console.log('   Intent:', parsed.intent);
            console.log('   Message:', parsed.message);
            console.log('   Chips:', parsed.chips);
            
            responses.push({
              number: i,
              intent: parsed.intent,
              message: parsed.message,
              chips: parsed.chips
            });
          } else {
            console.log('⚠️  Missing required fields');
          }
        } catch (parseError) {
          console.log('❌ Parse error:', parseError.message);
        }
        
        console.log(''); // Empty line for readability
        
        // Small delay between requests
        await new Promise(resolve => setTimeout(resolve, 1000));
        
      } catch (error) {
        console.log(`❌ Error generating response ${i}:`, error.message);
        console.log('');
      }
    }
    
    // Analyze variety
    console.log('📊 VARIETY ANALYSIS:');
    console.log('='.repeat(50));
    
    if (responses.length > 0) {
      const intents = responses.map(r => r.intent);
      const uniqueIntents = new Set(intents);
      
      console.log(`Total responses: ${responses.length}`);
      console.log(`Unique intents: ${uniqueIntents.size}`);
      console.log(`Intent variety: ${(uniqueIntents.size / responses.length * 100).toFixed(1)}%`);
      
      console.log('\n📋 All responses:');
      responses.forEach((resp, index) => {
        console.log(`\n${index + 1}. Intent: ${resp.intent}`);
        console.log(`   Message: ${resp.message}`);
        console.log(`   Chips: ${resp.chips.join(', ')}`);
      });
      
      // Check for message similarity
      const messages = responses.map(r => r.message.toLowerCase());
      let similarCount = 0;
      
      for (let i = 0; i < messages.length; i++) {
        for (let j = i + 1; j < messages.length; j++) {
          const similarity = calculateSimilarity(messages[i], messages[j]);
          if (similarity > 0.7) {
            similarCount++;
            console.log(`\n⚠️  Similar responses detected (${(similarity * 100).toFixed(1)}% similar):`);
            console.log(`   Response ${i + 1}: ${messages[i].substring(0, 50)}...`);
            console.log(`   Response ${j + 1}: ${messages[j].substring(0, 50)}...`);
          }
        }
      }
      
      if (similarCount === 0) {
        console.log('\n🎉 EXCELLENT! All responses are significantly different!');
      } else {
        console.log(`\n⚠️  Found ${similarCount} pairs of similar responses`);
      }
      
    } else {
      console.log('❌ No successful responses generated');
    }
    
  } catch (error) {
    console.error('\n💥 Error testing variety:', error.message);
  }
}

// Simple similarity calculation
function calculateSimilarity(text1, text2) {
  const words1 = new Set(text1.split(/\s+/));
  const words2 = new Set(text2.split(/\s+/));
  
  const intersection = new Set([...words1].filter(x => words2.has(x)));
  const union = new Set([...words1, ...words2]);
  
  return intersection.size / union.size;
}

// Run the test
testResponseVariety();
