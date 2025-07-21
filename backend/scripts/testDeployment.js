#!/usr/bin/env node

/**
 * Test script to verify backend deployment and API endpoints
 */

import fetch from 'node-fetch';

const BACKEND_URL = process.env.BACKEND_URL || 'https://land-registry-backend-plum.vercel.app';

const testEndpoints = [
  {
    name: 'Health Check',
    url: `${BACKEND_URL}/api/health`,
    method: 'GET',
    expectedStatus: 200
  },
  {
    name: 'Root Endpoint',
    url: `${BACKEND_URL}/`,
    method: 'GET',
    expectedStatus: 200
  },
  {
    name: 'CORS Preflight - User Frontend',
    url: `${BACKEND_URL}/api/health`,
    method: 'OPTIONS',
    headers: {
      'Origin': 'http://localhost:3003',
      'Access-Control-Request-Method': 'GET',
      'Access-Control-Request-Headers': 'Content-Type, Authorization'
    },
    expectedStatus: 200
  },
  {
    name: 'CORS Preflight - Admin Frontend',
    url: `${BACKEND_URL}/api/health`,
    method: 'OPTIONS',
    headers: {
      'Origin': 'http://localhost:3001',
      'Access-Control-Request-Method': 'GET',
      'Access-Control-Request-Headers': 'Content-Type, Authorization'
    },
    expectedStatus: 200
  },
  {
    name: 'Dispute Routes Check',
    url: `${BACKEND_URL}/api/disputes/admin/all`,
    method: 'GET',
    expectedStatus: 401, // Should require authentication
    expectError: true
  }
];

async function testEndpoint(test) {
  try {
    console.log(`\n🧪 Testing: ${test.name}`);
    console.log(`   URL: ${test.url}`);
    console.log(`   Method: ${test.method}`);

    const options = {
      method: test.method,
      headers: {
        'Content-Type': 'application/json',
        ...test.headers
      }
    };

    const response = await fetch(test.url, options);
    
    console.log(`   Status: ${response.status}`);
    console.log(`   Headers:`, Object.fromEntries(response.headers.entries()));

    if (test.expectedStatus && response.status !== test.expectedStatus) {
      console.log(`   ❌ Expected status ${test.expectedStatus}, got ${response.status}`);
      return false;
    }

    if (test.method === 'OPTIONS') {
      const corsHeaders = {
        'Access-Control-Allow-Origin': response.headers.get('Access-Control-Allow-Origin'),
        'Access-Control-Allow-Methods': response.headers.get('Access-Control-Allow-Methods'),
        'Access-Control-Allow-Headers': response.headers.get('Access-Control-Allow-Headers'),
        'Access-Control-Allow-Credentials': response.headers.get('Access-Control-Allow-Credentials')
      };
      console.log(`   CORS Headers:`, corsHeaders);
    }

    if (response.ok || test.expectError) {
      try {
        const data = await response.text();
        if (data) {
          const jsonData = JSON.parse(data);
          console.log(`   Response:`, JSON.stringify(jsonData, null, 2));
        }
      } catch (e) {
        console.log(`   Response: ${data}`);
      }
    }

    console.log(`   ✅ ${test.name} passed`);
    return true;
  } catch (error) {
    console.log(`   ❌ ${test.name} failed:`, error.message);
    return false;
  }
}

async function runTests() {
  console.log(`🚀 Testing backend deployment at: ${BACKEND_URL}`);
  console.log(`📅 Test started at: ${new Date().toISOString()}`);

  let passed = 0;
  let failed = 0;

  for (const test of testEndpoints) {
    const result = await testEndpoint(test);
    if (result) {
      passed++;
    } else {
      failed++;
    }
  }

  console.log(`\n📊 Test Results:`);
  console.log(`   ✅ Passed: ${passed}`);
  console.log(`   ❌ Failed: ${failed}`);
  console.log(`   📈 Success Rate: ${((passed / (passed + failed)) * 100).toFixed(1)}%`);

  if (failed > 0) {
    console.log(`\n⚠️  Some tests failed. Please check the deployment.`);
    process.exit(1);
  } else {
    console.log(`\n🎉 All tests passed! Backend deployment is working correctly.`);
    process.exit(0);
  }
}

// Run tests if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runTests().catch(error => {
    console.error('Test runner failed:', error);
    process.exit(1);
  });
}

export { runTests, testEndpoints };
