// Simple API Test using Node.js built-in modules
const http = require('http');

function makeRequest(options, data = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let responseData = '';
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(responseData);
          resolve({ status: res.statusCode, data: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, data: responseData });
        }
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

async function testAPIEndpoints() {
  console.log('🧪 Testing SkillWise API Endpoints...\n');

  try {
    // Test 1: Health Check
    console.log('1. Testing health check...');
    const healthResponse = await makeRequest({
      hostname: 'localhost',
      port: 3002,
      path: '/healthz',
      method: 'GET',
    });
    console.log('✅ Health check passed:', healthResponse.data);

    // Test 2: Login endpoint
    console.log('\n2. Testing login endpoint...');
    const loginResponse = await makeRequest(
      {
        hostname: 'localhost',
        port: 3002,
        path: '/api/auth/login',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      },
      {
        email: 'test@example.com',
        password: 'password123',
      }
    );
    console.log('✅ Login successful:', loginResponse.data);

    // Test 3: Get goals endpoint
    console.log('\n3. Testing goals endpoint...');
    const goalsResponse = await makeRequest({
      hostname: 'localhost',
      port: 3002,
      path: '/api/goals',
      method: 'GET',
    });
    console.log('✅ Goals retrieved:', goalsResponse.data);

    console.log('\n🎉 All API tests passed! Backend is working correctly.');
    return true;
  } catch (error) {
    console.error('\n❌ API test failed:', error.message);
    if (error.code === 'ECONNREFUSED') {
      console.error(
        '❌ Cannot connect to server. Make sure the backend server is running on port 3002.'
      );
    }
    return false;
  }
}

// Run the tests
testAPIEndpoints()
  .then((success) => {
    process.exit(success ? 0 : 1);
  })
  .catch((error) => {
    console.error('Test runner error:', error);
    process.exit(1);
  });
