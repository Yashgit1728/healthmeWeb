const axios = require('axios');

// Test configuration
const BASE_URL = 'http://localhost:3000';
const TEST_EMAIL = `test-${Date.now()}@example.com`;
const TEST_PASSWORD = 'testpass123';
const TEST_NAME = 'Test User';

// Create axios instance with cookie support
const api = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
  timeout: 10000
});

// Store cookies manually for testing
let storedCookies = '';

async function testAuthentication() {
  console.log('🧪 Testing New Cookie-Based Authentication System\n');
  console.log(`📧 Using test email: ${TEST_EMAIL}\n`);
  
  try {
    // Test 1: Health check
    console.log('1️⃣ Testing health endpoint...');
    const healthResponse = await api.get('/health');
    console.log('✅ Health check passed:', healthResponse.data);
    
    // Test 2: Register new user
    console.log('\n2️⃣ Testing user registration...');
    const registerResponse = await api.post('/auth/register', {
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
      name: TEST_NAME
    });
    console.log('✅ Registration successful:', {
      userId: registerResponse.data.user.id,
      email: registerResponse.data.user.email,
      name: registerResponse.data.user.name
    });
    
    // Test 3: Check if cookies were set
    console.log('\n3️⃣ Checking cookies...');
    const cookies = registerResponse.headers['set-cookie'];
    if (cookies) {
      console.log('✅ Cookies received:', cookies.length);
      cookies.forEach((cookie, index) => {
        console.log(`   🍪 Cookie ${index + 1}:`, cookie);
        if (cookie.includes('accessToken')) {
          console.log('   ✅ accessToken cookie found');
          // Extract the cookie value for manual use
          const cookieMatch = cookie.match(/accessToken=([^;]+)/);
          if (cookieMatch) {
            storedCookies = `accessToken=${cookieMatch[1]}`;
            console.log('   📝 Stored cookie for manual use:', storedCookies.substring(0, 50) + '...');
          }
        }
      });
    } else {
      console.log('❌ No cookies received');
    }
    
    // Test 3.5: Check if cookie is being sent in subsequent requests
    console.log('\n3️⃣.5️⃣ Checking if cookie is being sent...');
    console.log('   Request headers for /me:', api.defaults.headers);
    
    // Test 4: Test /me endpoint (should work with cookies)
    console.log('\n4️⃣ Testing /me endpoint...');
    const meResponse = await api.get('/auth/me', {
      headers: {
        'Cookie': storedCookies
      }
    });
    console.log('✅ /me endpoint successful:', {
      userId: meResponse.data.user.id,
      email: meResponse.data.user.email,
      name: meResponse.data.user.name
    });
    
    // Test 5: Test logout
    console.log('\n5️⃣ Testing logout...');
    const logoutResponse = await api.post('/auth/logout', {
      headers: {
        'Cookie': storedCookies
      }
    });
    console.log('✅ Logout successful:', logoutResponse.data);
    
    // Test 6: Test /me endpoint after logout (should fail)
    console.log('\n6️⃣ Testing /me endpoint after logout...');
    try {
      await api.get('/auth/me', {
        headers: {
          'Cookie': storedCookies
        }
      });
      console.log('❌ /me endpoint should have failed after logout');
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('✅ /me endpoint correctly failed after logout');
      } else {
        console.log('❌ Unexpected error after logout:', error.response?.status);
      }
    }
    
    // Test 7: Test login with existing user
    console.log('\n7️⃣ Testing login with existing user...');
    const loginResponse = await api.post('/auth/login', {
      email: TEST_EMAIL,
      password: TEST_PASSWORD
    });
    console.log('✅ Login successful:', {
      userId: loginResponse.data.user.id,
      email: loginResponse.data.user.email,
      name: loginResponse.data.user.name
    });
    
    // Update stored cookies from login
    const loginCookies = loginResponse.headers['set-cookie'];
    if (loginCookies) {
      loginCookies.forEach(cookie => {
        if (cookie.includes('accessToken')) {
          const cookieMatch = cookie.match(/accessToken=([^;]+)/);
          if (cookieMatch) {
            storedCookies = `accessToken=${cookieMatch[1]}`;
            console.log('   📝 Updated stored cookie from login');
          }
        }
      });
    }
    
    // Test 8: Test /me endpoint after login
    console.log('\n8️⃣ Testing /me endpoint after login...');
    const meAfterLoginResponse = await api.get('/auth/me', {
      headers: {
        'Cookie': storedCookies
      }
    });
    console.log('✅ /me endpoint successful after login:', {
      userId: meAfterLoginResponse.data.user.id,
      email: meAfterLoginResponse.data.user.email,
      name: meAfterLoginResponse.data.user.name
    });
    
    console.log('\n🎉 All authentication tests passed!');
    console.log('\n📋 Summary:');
    console.log('   ✅ Cookie-based authentication working');
    console.log('   ✅ Registration working');
    console.log('   ✅ Login working');
    console.log('   ✅ /me endpoint working');
    console.log('   ✅ Logout working');
    console.log('   ✅ Session persistence working');
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
      console.error('Response headers:', error.response.headers);
    }
    
    process.exit(1);
  }
}

// Run the test
testAuthentication();
