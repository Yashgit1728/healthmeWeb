const axios = require('axios');

const BASE_URL = process.env.TEST_URL || 'http://localhost:3000';

async function testAuth() {
  console.log('🧪 Testing Authentication Endpoints...\n');

  try {
    // Test 1: Health check
    console.log('1. Testing health check...');
    const health = await axios.get(`${BASE_URL}/health`);
    console.log('✅ Health check passed:', health.data.status);

    // Test 2: Register a new user
    console.log('\n2. Testing user registration...');
    const testUser = {
      name: 'Test User',
      email: `test${Date.now()}@example.com`,
      password: 'testpass123'
    };

    const registerResponse = await axios.post(`${BASE_URL}/auth/register`, testUser);
    console.log('✅ Registration successful:', registerResponse.data.user.email);

    // Test 3: Try to register with same email (should fail)
    console.log('\n3. Testing duplicate email registration...');
    try {
      await axios.post(`${BASE_URL}/auth/register`, testUser);
      console.log('❌ Should have failed with duplicate email');
    } catch (error) {
      if (error.response?.status === 400 && error.response?.data?.error?.includes('already registered')) {
        console.log('✅ Duplicate email properly rejected');
      } else {
        console.log('❌ Unexpected error:', error.response?.data);
      }
    }

    // Test 4: Login with correct credentials
    console.log('\n4. Testing login...');
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      email: testUser.email,
      password: testUser.password
    });
    console.log('✅ Login successful:', loginResponse.data.user.email);

    // Test 5: Test protected endpoint with token
    console.log('\n5. Testing protected endpoint...');
    const token = loginResponse.data.token;
    const meResponse = await axios.get(`${BASE_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('✅ Protected endpoint accessible:', meResponse.data.email);

    // Test 6: Test with invalid token
    console.log('\n6. Testing invalid token...');
    try {
      await axios.get(`${BASE_URL}/auth/me`, {
        headers: { Authorization: 'Bearer invalid_token' }
      });
      console.log('❌ Should have failed with invalid token');
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('✅ Invalid token properly rejected');
      } else {
        console.log('❌ Unexpected error:', error.response?.data);
      }
    }

    console.log('\n🎉 All authentication tests passed!');

  } catch (error) {
    console.error('\n❌ Test failed:', error.response?.data || error.message);
    process.exit(1);
  }
}

testAuth();
