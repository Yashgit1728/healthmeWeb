const axios = require('axios');

const BASE_URL = process.env.TEST_URL || 'http://localhost:3000';

async function testForgotPassword() {
  console.log('🧪 Testing Forgot Password Functionality...\n');

  try {
    // Test 1: Health check
    console.log('1. Testing health check...');
    const health = await axios.get(`${BASE_URL}/health`);
    console.log('✅ Health check passed:', health.data.status);

    // Test 2: Test with non-existent email (should show success message)
    console.log('\n2. Testing with non-existent email...');
    try {
      const response = await axios.post(`${BASE_URL}/auth/forgot-password`, {
        email: 'nonexistent@example.com'
      });
      console.log('✅ Non-existent email handled correctly:', response.data.message);
    } catch (error) {
      console.log('❌ Unexpected error with non-existent email:', error.response?.data);
    }

    // Test 3: Test with existing user email (should send reset email)
    console.log('\n3. Testing with existing user email...');
    try {
      const response = await axios.post(`${BASE_URL}/auth/forgot-password`, {
        email: 'test@example.com' // Use an email that exists in your database
      });
      console.log('✅ Existing email handled correctly:', response.data.message);
      console.log('📧 Check server console for email logs');
    } catch (error) {
      console.log('❌ Error with existing email:', error.response?.data);
    }

    console.log('\n🎉 Forgot password tests completed!');
    console.log('📝 Check the server console for detailed logs');

  } catch (error) {
    console.error('\n❌ Test failed:', error.response?.data || error.message);
    process.exit(1);
  }
}

testForgotPassword();
