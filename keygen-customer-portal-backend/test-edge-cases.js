#!/usr/bin/env node
/**
 * Copyright (c) 2025 Bivex
 *
 * Author: Bivex
 * Available for contact via email: support@b-b.top
 * For up-to-date contact information:
 * https://github.com/bivex
 *
 * Created: 2025-12-20T22:05:57
 * Last Updated: 2025-12-23T02:28:25
 *
 * Licensed under the MIT License.
 * Commercial licensing available upon request.
 */

/**
 * Edge Cases Testing Script for Keygen Customer Portal API
 *
 * This script tests various edge cases and potential vulnerabilities
 * in the API to find issues that automated tools might miss.
 */

const BASE_URL = 'http://localhost:3000';

async function makeRequest(method, url, options = {}) {
  const fullUrl = BASE_URL + url;
  console.log(`\n🧪 Testing: ${method} ${fullUrl}`);

  try {
    const response = await fetch(fullUrl, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      body: options.body
    });

    console.log(`📊 Status: ${response.status} ${response.statusText}`);
    console.log(`📄 Content-Type: ${response.headers.get('content-type')}`);

    const text = await response.text();
    if (text) {
      try {
        const json = JSON.parse(text);
        console.log(`📋 Response:`, JSON.stringify(json, null, 2));
      } catch {
        console.log(`📋 Response: ${text.substring(0, 200)}${text.length > 200 ? '...' : ''}`);
      }
    } else {
      console.log(`📋 Response: <EMPTY>`);
    }

    return { response, text };
  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
    return { error };
  }
}

async function testAuthEndpoints() {
  console.log('\n' + '='.repeat(50));
  console.log('🔐 AUTHENTICATION ENDPOINTS TESTING');
  console.log('='.repeat(50));

  // Test 1: Register with valid data
  await makeRequest('POST', '/auth/register', {
    body: JSON.stringify({
      email: 'test-edge@example.com',
      password: 'password123',
      name: 'Test User'
    })
  });

  // Test 2: Register with duplicate email
  await makeRequest('POST', '/auth/register', {
    body: JSON.stringify({
      email: 'test-edge@example.com',
      password: 'password123',
      name: 'Test User 2'
    })
  });

  // Test 3: Login with correct credentials
  const loginResult = await makeRequest('POST', '/auth/login', {
    body: JSON.stringify({
      email: 'test-edge@example.com',
      password: 'password123'
    })
  });

  let token = null;
  if (loginResult.response?.ok) {
    try {
      const json = JSON.parse(loginResult.text);
      token = json.token;
      console.log(`🔑 Got token: ${token ? token.substring(0, 20) + '...' : 'NONE'}`);
    } catch (e) {
      console.log('❌ Could not parse login response');
    }
  }

  // Test 4: Get current user with token
  if (token) {
    await makeRequest('GET', '/auth/me', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
  }

  // Test 5: Get current user without token
  await makeRequest('GET', '/auth/me');

  // Test 6: Logout with token
  if (token) {
    await makeRequest('POST', '/auth/logout', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
  }

  // Test 7: Logout without token
  await makeRequest('POST', '/auth/logout');
}

async function testSystemEndpoints() {
  console.log('\n' + '='.repeat(50));
  console.log('🖥️  SYSTEM ENDPOINTS TESTING');
  console.log('='.repeat(50));

  // Test 1: Root endpoint
  await makeRequest('GET', '/');

  // Test 2: Health check
  await makeRequest('GET', '/health');

  // Test 3: Metrics
  await makeRequest('GET', '/metrics');

  // Test 4: Protected route without token
  await makeRequest('GET', '/protected');

  // Test 5: Protected route with invalid token
  await makeRequest('GET', '/protected', {
    headers: { 'Authorization': 'Bearer invalid.token.here' }
  });
}

async function testEdgeCases() {
  console.log('\n' + '='.repeat(50));
  console.log('🚨 EDGE CASES & POTENTIAL VULNERABILITIES');
  console.log('='.repeat(50));

  // Test 1: SQL Injection attempts
  await makeRequest('POST', '/auth/login', {
    body: JSON.stringify({
      email: "' OR '1'='1",
      password: "' OR '1'='1"
    })
  });

  // Test 2: XSS attempts
  await makeRequest('POST', '/auth/register', {
    body: JSON.stringify({
      email: 'xss@example.com',
      password: 'password123',
      name: '<script>alert("xss")</script>'
    })
  });

  // Test 3: Very long inputs
  const longString = 'a'.repeat(10000);
  await makeRequest('POST', '/auth/register', {
    body: JSON.stringify({
      email: `${longString}@example.com`,
      password: longString,
      name: longString
    })
  });

  // Test 4: Special characters
  await makeRequest('POST', '/auth/register', {
    body: JSON.stringify({
      email: 'special@chars.com',
      password: '!@#$%^&*()',
      name: 'Spëcial Chärs ñ'
    })
  });

  // Test 5: Invalid JSON
  await makeRequest('POST', '/auth/login', {
    body: '{invalid json'
  });

  // Test 6: Wrong content type
  await makeRequest('POST', '/auth/login', {
    headers: { 'Content-Type': 'text/plain' },
    body: 'not json data'
  });

  // Test 7: Buffer overflow attempts
  await makeRequest('POST', '/auth/login', {
    body: JSON.stringify({
      email: 'buffer@example.com',
      password: 'a'.repeat(1000000)  // 1MB string
    })
  });

  // Test 8: Null bytes
  await makeRequest('POST', '/auth/login', {
    body: JSON.stringify({
      email: 'null@example.com',
      password: 'password\x00injected'
    })
  });
}

async function testHTTPMethods() {
  console.log('\n' + '='.repeat(50));
  console.log('🌐 HTTP METHODS TESTING');
  console.log('='.repeat(50));

  const methods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS', 'TRACE', 'CONNECT'];
  const endpoints = ['/', '/auth/login', '/auth/me', '/health'];

  for (const endpoint of endpoints) {
    console.log(`\n📍 Testing endpoint: ${endpoint}`);
    for (const method of methods) {
      try {
        const response = await fetch(BASE_URL + endpoint, { method });
        console.log(`  ${method}: ${response.status}`);
      } catch (error) {
        console.log(`  ${method}: ERROR - ${error.message}`);
      }
    }
  }
}

async function testRateLimiting() {
  console.log('\n' + '='.repeat(50));
  console.log('⚡ RATE LIMITING TESTING');
  console.log('='.repeat(50));

  console.log('🚀 Sending 20 rapid requests to /auth/login...');

  const promises = [];
  for (let i = 0; i < 20; i++) {
    promises.push(makeRequest('POST', '/auth/login', {
      body: JSON.stringify({
        email: 'rate-limit-test@example.com',
        password: 'password123'
      })
    }));
  }

  const results = await Promise.allSettled(promises);
  const statusCodes = results.map((result, index) => {
    if (result.status === 'fulfilled') {
      return result.value.response?.status || 'ERROR';
    } else {
      return 'ERROR';
    }
  });

  console.log('\n📊 Rate limiting results:');
  console.log(`Total requests: ${statusCodes.length}`);
  console.log(`Successful (2xx): ${statusCodes.filter(code => typeof code === 'number' && code >= 200 && code < 300).length}`);
  console.log(`Rate limited (429): ${statusCodes.filter(code => code === 429).length}`);
  console.log(`Errors: ${statusCodes.filter(code => code === 'ERROR').length}`);
}

async function main() {
  console.log('🔬 COMPREHENSIVE API EDGE CASES TESTING');
  console.log('==========================================');
  console.log(`🎯 Target API: ${BASE_URL}`);

  try {
    // Basic connectivity test
    console.log('\n🔗 Testing API connectivity...');
    const healthCheck = await makeRequest('GET', '/health');
    if (!healthCheck.response?.ok) {
      console.log('❌ API is not responding. Please start the server first.');
      process.exit(1);
    }
    console.log('✅ API is responding');

    // Run all test suites
    await testSystemEndpoints();
    await testAuthEndpoints();
    await testEdgeCases();
    await testHTTPMethods();
    await testRateLimiting();

    console.log('\n' + '='.repeat(50));
    console.log('🎉 TESTING COMPLETED');
    console.log('='.repeat(50));
    console.log('📋 Check the output above for any issues found.');
    console.log('🔍 Look for unusual status codes, error messages, or unexpected behavior.');

  } catch (error) {
    console.error('💥 Test suite failed:', error);
    process.exit(1);
  }
}

// Run the tests
main();