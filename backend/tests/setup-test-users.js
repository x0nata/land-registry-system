/**
 * Setup script to create test users and verify backend connectivity
 */

import axios from 'axios';

const BACKEND_URL = 'https://land-registry-backend-plum.vercel.app/api';

// Test users to create
const TEST_USERS = {
  admin: {
    fullName: 'Test Admin',
    email: 'testadmin@example.com',
    password: 'TestAdmin@123',
    phoneNumber: '+251911111111',
    nationalId: 'ETH111111111',
    role: 'admin'
  },
  landOfficer: {
    fullName: 'Test Land Officer',
    email: 'testlandofficer@example.com',
    password: 'TestLandOfficer@123',
    phoneNumber: '+251922222222',
    nationalId: 'ETH222222222',
    role: 'landOfficer'
  },
  user: {
    fullName: 'Test User',
    email: 'testuser@example.com',
    password: 'TestUser@123',
    phoneNumber: '+251933333333',
    nationalId: 'ETH333333333',
    role: 'user'
  }
};

async function checkBackendHealth() {
  try {
    console.log('🔍 Checking backend health...');
    const response = await axios.get(`${BACKEND_URL}/health`);
    console.log('✅ Backend is healthy:', response.data);
    return true;
  } catch (error) {
    console.error('❌ Backend health check failed:', error.message);
    return false;
  }
}

async function createTestUser(userData) {
  try {
    console.log(`📝 Creating user: ${userData.email}`);
    
    // Try to register the user
    const response = await axios.post(`${BACKEND_URL}/auth/register`, userData);
    console.log(`✅ User created successfully: ${userData.email}`);
    return response.data;
  } catch (error) {
    if (error.response?.status === 400 && 
        error.response?.data?.message?.includes('already exists')) {
      console.log(`ℹ️ User already exists: ${userData.email}`);
      return { message: 'User already exists' };
    } else {
      console.error(`❌ Failed to create user ${userData.email}:`, error.response?.data || error.message);
      throw error;
    }
  }
}

async function testUserLogin(email, password) {
  try {
    console.log(`🔐 Testing login for: ${email}`);
    const response = await axios.post(`${BACKEND_URL}/auth/login`, {
      email,
      password
    });
    console.log(`✅ Login successful for: ${email}`);
    return response.data;
  } catch (error) {
    console.error(`❌ Login failed for ${email}:`, error.response?.data || error.message);
    throw error;
  }
}

async function listExistingUsers() {
  try {
    console.log('📋 Attempting to list existing users...');
    
    // First try to login with common admin credentials
    const commonAdminCredentials = [
      { email: 'cooladmin@gmail.com', password: 'Admin@123' },
      { email: 'admin@example.com', password: 'admin123' },
      { email: 'testadmin@example.com', password: 'TestAdmin@123' }
    ];

    let adminToken = null;
    for (const creds of commonAdminCredentials) {
      try {
        const loginResponse = await axios.post(`${BACKEND_URL}/auth/login`, creds);
        adminToken = loginResponse.data.token;
        console.log(`✅ Found working admin credentials: ${creds.email}`);
        break;
      } catch (error) {
        console.log(`❌ Admin login failed for ${creds.email}`);
      }
    }

    if (adminToken) {
      try {
        const response = await axios.get(`${BACKEND_URL}/users`, {
          headers: { Authorization: `Bearer ${adminToken}` }
        });
        console.log('📋 Existing users:');
        response.data.forEach(user => {
          console.log(`   - ${user.email} (${user.role})`);
        });
        return response.data;
      } catch (error) {
        console.error('❌ Failed to list users:', error.response?.data || error.message);
      }
    } else {
      console.log('❌ Could not authenticate as admin to list users');
    }
  } catch (error) {
    console.error('❌ Error listing users:', error.message);
  }
  return [];
}

async function setupTestEnvironment() {
  console.log('🚀 Setting up test environment...');
  console.log(`📡 Backend URL: ${BACKEND_URL}`);

  try {
    // Check backend health
    const isHealthy = await checkBackendHealth();
    if (!isHealthy) {
      throw new Error('Backend is not healthy');
    }

    // List existing users
    await listExistingUsers();

    // Create test users
    console.log('\n📝 Creating test users...');
    const createdUsers = {};
    
    for (const [role, userData] of Object.entries(TEST_USERS)) {
      try {
        const result = await createTestUser(userData);
        createdUsers[role] = result;
      } catch (error) {
        console.error(`Failed to create ${role} user:`, error.message);
      }
    }

    // Test login for all users
    console.log('\n🔐 Testing user logins...');
    const loginResults = {};
    
    for (const [role, userData] of Object.entries(TEST_USERS)) {
      try {
        const result = await testUserLogin(userData.email, userData.password);
        loginResults[role] = result;
        console.log(`✅ ${role} login successful`);
      } catch (error) {
        console.error(`❌ ${role} login failed`);
        loginResults[role] = null;
      }
    }

    console.log('\n📊 Setup Summary:');
    console.log('Created Users:', Object.keys(createdUsers));
    console.log('Successful Logins:', Object.keys(loginResults).filter(role => loginResults[role]));

    return {
      users: createdUsers,
      logins: loginResults,
      credentials: TEST_USERS
    };

  } catch (error) {
    console.error('💥 Setup failed:', error.message);
    throw error;
  }
}

// Run setup if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  setupTestEnvironment()
    .then(result => {
      console.log('\n✅ Test environment setup completed successfully');
      process.exit(0);
    })
    .catch(error => {
      console.error('\n❌ Test environment setup failed:', error.message);
      process.exit(1);
    });
}

export { setupTestEnvironment, TEST_USERS, BACKEND_URL };
