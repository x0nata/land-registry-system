import axios from 'axios';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const API_BASE_URL = process.env.API_BASE_URL || 'https://land-registry-backend-plum.vercel.app/api';

// Test credentials (use your actual test credentials)
const TEST_CREDENTIALS = {
  admin: {
    email: 'cooladmin@gmail.com',
    password: 'Admin@123'
  },
  landOfficer: {
    email: 'MrLand@gmail.com',
    password: 'Land@123'
  }
};

class PerformanceTest {
  constructor() {
    this.results = [];
    this.tokens = {};
  }

  async login(userType) {
    const startTime = Date.now();
    try {
      const response = await axios.post(`${API_BASE_URL}/auth/login`, TEST_CREDENTIALS[userType]);
      const endTime = Date.now();
      
      this.tokens[userType] = response.data.token;
      
      this.results.push({
        test: `Login (${userType})`,
        duration: endTime - startTime,
        status: 'SUCCESS',
        statusCode: response.status
      });
      
      console.log(`✅ Login (${userType}): ${endTime - startTime}ms`);
      return response.data.token;
    } catch (error) {
      const endTime = Date.now();
      this.results.push({
        test: `Login (${userType})`,
        duration: endTime - startTime,
        status: 'ERROR',
        error: error.message,
        statusCode: error.response?.status
      });
      console.log(`❌ Login (${userType}): ${endTime - startTime}ms - ${error.message}`);
      throw error;
    }
  }

  async testEndpoint(name, url, token, expectedMaxTime = 5000) {
    const startTime = Date.now();
    try {
      const response = await axios.get(`${API_BASE_URL}${url}`, {
        headers: { Authorization: `Bearer ${token}` },
        timeout: 10000
      });
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      const status = duration <= expectedMaxTime ? 'SUCCESS' : 'SLOW';
      
      this.results.push({
        test: name,
        duration,
        status,
        statusCode: response.status,
        dataSize: JSON.stringify(response.data).length,
        expectedMaxTime
      });
      
      const emoji = status === 'SUCCESS' ? '✅' : '⚠️';
      console.log(`${emoji} ${name}: ${duration}ms (expected: <${expectedMaxTime}ms)`);
      
      return response.data;
    } catch (error) {
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      this.results.push({
        test: name,
        duration,
        status: 'ERROR',
        error: error.message,
        statusCode: error.response?.status,
        expectedMaxTime
      });
      
      console.log(`❌ ${name}: ${duration}ms - ${error.message}`);
      throw error;
    }
  }

  async runTests() {
    console.log('🚀 Starting Performance Tests...\n');
    
    try {
      // Test 1: Login Performance
      console.log('📝 Testing Authentication...');
      await this.login('admin');
      await this.login('landOfficer');
      
      // Test 2: Dashboard Data Loading
      console.log('\n📊 Testing Dashboard Operations...');
      
      // Property Stats (was taking 5+ seconds)
      await this.testEndpoint(
        'Property Stats',
        '/reports/properties',
        this.tokens.admin,
        3000 // Expect under 3 seconds
      );
      
      // Pending Properties (was taking 10+ seconds)
      await this.testEndpoint(
        'Pending Properties (Dashboard)',
        '/properties/pending?dashboard=true',
        this.tokens.landOfficer,
        2000 // Expect under 2 seconds
      );
      
      // Pending Documents (was taking 11+ seconds)
      await this.testEndpoint(
        'Pending Documents (Dashboard)',
        '/documents/pending?dashboard=true',
        this.tokens.landOfficer,
        2000 // Expect under 2 seconds
      );
      
      // Recent Activities (was returning 500 error)
      await this.testEndpoint(
        'Recent Activities',
        '/logs/recent?limit=11',
        this.tokens.landOfficer,
        1500 // Expect under 1.5 seconds
      );
      
      // Test 3: Cache Performance (second request should be faster)
      console.log('\n🗄️ Testing Cache Performance...');
      
      const firstRequest = Date.now();
      await this.testEndpoint(
        'Property Stats (First Request)',
        '/reports/properties',
        this.tokens.admin,
        3000
      );
      
      // Wait a moment then test cache
      await new Promise(resolve => setTimeout(resolve, 100));
      
      await this.testEndpoint(
        'Property Stats (Cached Request)',
        '/reports/properties',
        this.tokens.admin,
        500 // Should be much faster from cache
      );
      
      // Test 4: Additional Critical Endpoints
      console.log('\n🔍 Testing Additional Endpoints...');
      
      await this.testEndpoint(
        'Document Stats',
        '/reports/documents',
        this.tokens.admin,
        2000
      );
      
      await this.testEndpoint(
        'User Stats',
        '/reports/users',
        this.tokens.admin,
        2000
      );
      
    } catch (error) {
      console.error('Test suite failed:', error.message);
    }
    
    this.generateReport();
  }

  generateReport() {
    console.log('\n📋 Performance Test Report');
    console.log('=' .repeat(50));
    
    const successful = this.results.filter(r => r.status === 'SUCCESS').length;
    const slow = this.results.filter(r => r.status === 'SLOW').length;
    const errors = this.results.filter(r => r.status === 'ERROR').length;
    
    console.log(`Total Tests: ${this.results.length}`);
    console.log(`✅ Successful: ${successful}`);
    console.log(`⚠️ Slow: ${slow}`);
    console.log(`❌ Errors: ${errors}`);
    console.log('');
    
    // Detailed results
    this.results.forEach(result => {
      const status = result.status === 'SUCCESS' ? '✅' : 
                    result.status === 'SLOW' ? '⚠️' : '❌';
      console.log(`${status} ${result.test}: ${result.duration}ms`);
      if (result.error) {
        console.log(`   Error: ${result.error}`);
      }
      if (result.expectedMaxTime && result.duration > result.expectedMaxTime) {
        console.log(`   Expected: <${result.expectedMaxTime}ms, Actual: ${result.duration}ms`);
      }
    });
    
    // Performance improvements summary
    console.log('\n🎯 Performance Improvements Applied:');
    console.log('- Fixed /api/logs/recent 500 error with better error handling');
    console.log('- Added database connection checks and timeouts');
    console.log('- Implemented Promise.all for parallel query execution');
    console.log('- Added lean() queries for better performance');
    console.log('- Implemented caching middleware for dashboard data');
    console.log('- Added database indexes for common query patterns');
    console.log('- Optimized authentication with lean() queries');
    console.log('- Added dashboard-specific query limits');
    
    console.log('\n🏁 Test completed!');
  }
}

// Run the tests
const tester = new PerformanceTest();
tester.runTests().catch(console.error);
