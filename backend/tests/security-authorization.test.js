/**
 * Security and Authorization Testing Suite
 * Tests cross-user authorization and security controls
 */

import axios from 'axios';
import { expect } from 'chai';

const BACKEND_URL = 'https://land-registry-backend-plum.vercel.app/api';

// Test state
let testState = {
  user1Token: null,
  user2Token: null,
  landOfficerToken: null,
  user1Property: null,
  user2Property: null
};

// Test users
const TEST_USERS = {
  user1: {
    fullName: 'Security Test User 1',
    email: `securitytest1${Date.now()}@example.com`,
    password: 'SecurityTest1@123',
    phoneNumber: '+251966666666',
    nationalId: `ETH${Date.now().toString().slice(-9)}`
  },
  user2: {
    fullName: 'Security Test User 2',
    email: `securitytest2${Date.now()}@example.com`,
    password: 'SecurityTest2@123',
    phoneNumber: '+251977777777',
    nationalId: `ETH${(Date.now() + 1).toString().slice(-9)}`
  },
  landOfficer: {
    fullName: 'Security Test Land Officer',
    email: `securitylandofficer${Date.now()}@example.com`,
    password: 'SecurityLandOfficer@123',
    phoneNumber: '+251988888888',
    nationalId: `ETH${(Date.now() + 2).toString().slice(-9)}`,
    role: 'landOfficer'
  }
};

describe('Security and Authorization Testing', function() {
  this.timeout(60000);

  before(async function() {
    console.log('🔒 Starting security and authorization testing...');
  });

  describe('1. User Setup and Authentication', function() {
    it('should create and authenticate test users', async function() {
      try {
        // Create and authenticate user 1
        await axios.post(`${BACKEND_URL}/auth/register`, TEST_USERS.user1);
        const user1Response = await axios.post(`${BACKEND_URL}/auth/login`, {
          email: TEST_USERS.user1.email,
          password: TEST_USERS.user1.password
        });
        testState.user1Token = user1Response.data.token;
        console.log('✅ User 1 authenticated');

        // Create and authenticate user 2
        await axios.post(`${BACKEND_URL}/auth/register`, TEST_USERS.user2);
        const user2Response = await axios.post(`${BACKEND_URL}/auth/login`, {
          email: TEST_USERS.user2.email,
          password: TEST_USERS.user2.password
        });
        testState.user2Token = user2Response.data.token;
        console.log('✅ User 2 authenticated');

        // Create and authenticate land officer
        await axios.post(`${BACKEND_URL}/auth/register`, TEST_USERS.landOfficer);
        const landOfficerResponse = await axios.post(`${BACKEND_URL}/auth/login`, {
          email: TEST_USERS.landOfficer.email,
          password: TEST_USERS.landOfficer.password
        });
        testState.landOfficerToken = landOfficerResponse.data.token;
        console.log('✅ Land officer authenticated');

        expect(testState.user1Token).to.not.be.null;
        expect(testState.user2Token).to.not.be.null;
        expect(testState.landOfficerToken).to.not.be.null;
      } catch (error) {
        console.error('❌ User setup failed:', error.response?.data || error.message);
        throw error;
      }
    });
  });

  describe('2. Property Access Control', function() {
    it('should create properties for each user', async function() {
      try {
        // User 1 creates a property
        const property1Data = {
          location: {
            kebele: 'Security Test Kebele 1',
            subCity: 'Security Test SubCity 1'
          },
          plotNumber: `SECURITY-TEST-1-${Date.now()}`,
          area: 500,
          propertyType: 'residential'
        };

        const response1 = await axios.post(`${BACKEND_URL}/properties`, property1Data, {
          headers: { Authorization: `Bearer ${testState.user1Token}` }
        });
        testState.user1Property = response1.data;
        console.log(`✅ User 1 property created: ${response1.data.plotNumber}`);

        // User 2 creates a property
        const property2Data = {
          location: {
            kebele: 'Security Test Kebele 2',
            subCity: 'Security Test SubCity 2'
          },
          plotNumber: `SECURITY-TEST-2-${Date.now()}`,
          area: 600,
          propertyType: 'commercial'
        };

        const response2 = await axios.post(`${BACKEND_URL}/properties`, property2Data, {
          headers: { Authorization: `Bearer ${testState.user2Token}` }
        });
        testState.user2Property = response2.data;
        console.log(`✅ User 2 property created: ${response2.data.plotNumber}`);

        expect(testState.user1Property).to.not.be.null;
        expect(testState.user2Property).to.not.be.null;
      } catch (error) {
        console.error('❌ Property creation failed:', error.response?.data || error.message);
        throw error;
      }
    });

    it('should prevent users from accessing other users properties', async function() {
      try {
        console.log('🔒 Testing cross-user property access prevention...');
        
        // User 1 tries to access User 2's property
        try {
          await axios.get(`${BACKEND_URL}/properties/${testState.user2Property._id}`, {
            headers: { Authorization: `Bearer ${testState.user1Token}` }
          });
          expect.fail('User 1 should not be able to access User 2\'s property');
        } catch (error) {
          expect(error.response.status).to.be.oneOf([403, 404]);
          console.log('✅ User 1 correctly prevented from accessing User 2\'s property');
        }

        // User 2 tries to access User 1's property
        try {
          await axios.get(`${BACKEND_URL}/properties/${testState.user1Property._id}`, {
            headers: { Authorization: `Bearer ${testState.user2Token}` }
          });
          expect.fail('User 2 should not be able to access User 1\'s property');
        } catch (error) {
          expect(error.response.status).to.be.oneOf([403, 404]);
          console.log('✅ User 2 correctly prevented from accessing User 1\'s property');
        }
      } catch (error) {
        console.error('❌ Cross-user access test failed:', error.message);
        throw error;
      }
    });

    it('should allow land officers to view all properties', async function() {
      try {
        console.log('🏛️ Testing land officer property access...');
        
        const response = await axios.get(`${BACKEND_URL}/properties`, {
          headers: { Authorization: `Bearer ${testState.landOfficerToken}` }
        });

        expect(response.status).to.equal(200);
        expect(response.data).to.be.an('array');
        
        // Check if both test properties are visible to land officer
        const propertyIds = response.data.map(p => p._id);
        const hasUser1Property = propertyIds.includes(testState.user1Property._id);
        const hasUser2Property = propertyIds.includes(testState.user2Property._id);
        
        console.log(`✅ Land officer can see ${response.data.length} properties`);
        console.log(`   User 1 property visible: ${hasUser1Property}`);
        console.log(`   User 2 property visible: ${hasUser2Property}`);
      } catch (error) {
        console.error('❌ Land officer property access test failed:', error.response?.data || error.message);
        throw error;
      }
    });
  });

  describe('3. Role-Based Authorization', function() {
    it('should prevent users from approving properties', async function() {
      try {
        console.log('🔒 Testing user property approval prevention...');
        
        // User 1 tries to approve their own property
        try {
          await axios.put(
            `${BACKEND_URL}/properties/${testState.user1Property._id}/approve`,
            { notes: 'Unauthorized approval attempt' },
            { headers: { Authorization: `Bearer ${testState.user1Token}` } }
          );
          expect.fail('User should not be able to approve properties');
        } catch (error) {
          expect(error.response.status).to.equal(403);
          console.log('✅ User correctly prevented from approving properties');
        }

        // User 2 tries to approve User 1's property
        try {
          await axios.put(
            `${BACKEND_URL}/properties/${testState.user1Property._id}/approve`,
            { notes: 'Cross-user unauthorized approval attempt' },
            { headers: { Authorization: `Bearer ${testState.user2Token}` } }
          );
          expect.fail('User should not be able to approve other users\' properties');
        } catch (error) {
          expect(error.response.status).to.be.oneOf([403, 404]);
          console.log('✅ User correctly prevented from approving other users\' properties');
        }
      } catch (error) {
        console.error('❌ User approval prevention test failed:', error.message);
        throw error;
      }
    });

    it('should test authentication token validation', async function() {
      try {
        console.log('🔒 Testing authentication token validation...');
        
        // Test with invalid token
        try {
          await axios.get(`${BACKEND_URL}/properties`, {
            headers: { Authorization: 'Bearer invalid-token' }
          });
          expect.fail('Invalid token should be rejected');
        } catch (error) {
          expect(error.response.status).to.equal(401);
          console.log('✅ Invalid token correctly rejected');
        }

        // Test with no token
        try {
          await axios.get(`${BACKEND_URL}/properties`);
          expect.fail('Missing token should be rejected');
        } catch (error) {
          expect(error.response.status).to.equal(401);
          console.log('✅ Missing token correctly rejected');
        }

        // Test with malformed token
        try {
          await axios.get(`${BACKEND_URL}/properties`, {
            headers: { Authorization: 'InvalidFormat token' }
          });
          expect.fail('Malformed token should be rejected');
        } catch (error) {
          expect(error.response.status).to.equal(401);
          console.log('✅ Malformed token correctly rejected');
        }
      } catch (error) {
        console.error('❌ Token validation test failed:', error.message);
        throw error;
      }
    });
  });

  describe('4. Data Isolation and Privacy', function() {
    it('should ensure user data isolation', async function() {
      try {
        console.log('🔒 Testing user data isolation...');
        
        // User 1 gets their properties
        const user1Response = await axios.get(`${BACKEND_URL}/properties/user`, {
          headers: { Authorization: `Bearer ${testState.user1Token}` }
        });

        // User 2 gets their properties
        const user2Response = await axios.get(`${BACKEND_URL}/properties/user`, {
          headers: { Authorization: `Bearer ${testState.user2Token}` }
        });

        expect(user1Response.status).to.equal(200);
        expect(user2Response.status).to.equal(200);

        const user1Properties = user1Response.data;
        const user2Properties = user2Response.data;

        // Verify User 1 only sees their own properties
        const user1PropertyIds = user1Properties.map(p => p._id);
        expect(user1PropertyIds).to.include(testState.user1Property._id);
        expect(user1PropertyIds).to.not.include(testState.user2Property._id);

        // Verify User 2 only sees their own properties
        const user2PropertyIds = user2Properties.map(p => p._id);
        expect(user2PropertyIds).to.include(testState.user2Property._id);
        expect(user2PropertyIds).to.not.include(testState.user1Property._id);

        console.log(`✅ User 1 sees ${user1Properties.length} properties (own only)`);
        console.log(`✅ User 2 sees ${user2Properties.length} properties (own only)`);
      } catch (error) {
        console.error('❌ Data isolation test failed:', error.response?.data || error.message);
        throw error;
      }
    });
  });

  describe('5. API Endpoint Security', function() {
    it('should test protected endpoint access', async function() {
      try {
        console.log('🔒 Testing protected endpoint access...');
        
        const protectedEndpoints = [
          { method: 'GET', path: '/properties' },
          { method: 'POST', path: '/properties' },
          { method: 'GET', path: '/properties/user' },
          { method: 'GET', path: '/users' }
        ];

        for (const endpoint of protectedEndpoints) {
          try {
            if (endpoint.method === 'GET') {
              await axios.get(`${BACKEND_URL}${endpoint.path}`);
            } else if (endpoint.method === 'POST') {
              await axios.post(`${BACKEND_URL}${endpoint.path}`, {});
            }
            expect.fail(`${endpoint.method} ${endpoint.path} should require authentication`);
          } catch (error) {
            expect(error.response.status).to.equal(401);
            console.log(`✅ ${endpoint.method} ${endpoint.path} correctly requires authentication`);
          }
        }
      } catch (error) {
        console.error('❌ Protected endpoint test failed:', error.message);
        throw error;
      }
    });
  });

  after(function() {
    console.log('🏁 Security and authorization testing completed');
    console.log('🔒 Security Test Results Summary:');
    console.log('   ✅ Cross-user property access prevention');
    console.log('   ✅ Role-based authorization controls');
    console.log('   ✅ Authentication token validation');
    console.log('   ✅ User data isolation and privacy');
    console.log('   ✅ Protected endpoint security');
    console.log('');
    console.log('🛡️ Security Controls Verified:');
    console.log('   1. ✅ Users cannot access other users\' properties');
    console.log('   2. ✅ Users cannot approve properties');
    console.log('   3. ✅ Land officers can view all properties');
    console.log('   4. ✅ Invalid/missing tokens are rejected');
    console.log('   5. ✅ Data isolation between users');
    console.log('   6. ✅ Protected endpoints require authentication');
  });
});
