#!/usr/bin/env node

/**
 * Test Payment API Integration
 * Quick test to verify the payment system is working with the deployed backend
 */

import axios from 'axios';

const BACKEND_URL = 'https://land-registry-backend-plum.vercel.app/api';

// Test user credentials
const TEST_USER = {
  email: 'testuser@example.com',
  password: 'TestUser@123'
};

async function testPaymentAPI() {
  console.log('🧪 Testing Payment API Integration...\n');

  try {
    // Step 1: Try to login with test user
    console.log('1. Testing user login...');
    let userToken;
    
    try {
      const loginResponse = await axios.post(`${BACKEND_URL}/auth/login`, TEST_USER);
      userToken = loginResponse.data.token;
      console.log('✅ User login successful');
    } catch (error) {
      console.log('❌ User login failed, trying to create user...');
      
      // Try to create the user
      try {
        await axios.post(`${BACKEND_URL}/auth/register`, {
          fullName: 'Test User',
          email: TEST_USER.email,
          password: TEST_USER.password,
          phoneNumber: '+251933333333',
          nationalId: 'ETH333333333'
        });
        console.log('✅ User created successfully');
        
        // Try login again
        const loginResponse = await axios.post(`${BACKEND_URL}/auth/login`, TEST_USER);
        userToken = loginResponse.data.token;
        console.log('✅ User login successful after creation');
      } catch (createError) {
        if (createError.response?.data?.message?.includes('already exists')) {
          console.log('ℹ️ User already exists, trying different credentials...');

          // Try with different test credentials
          const altCredentials = [
            { email: 'cooladmin@gmail.com', password: 'Admin@123' },
            { email: 'testuser@example.com', password: 'password123' },
            { email: 'testuser@example.com', password: 'TestUser@123' }
          ];

          for (const creds of altCredentials) {
            try {
              const loginResponse = await axios.post(`${BACKEND_URL}/auth/login`, creds);
              userToken = loginResponse.data.token;
              console.log(`✅ Login successful with ${creds.email}`);
              break;
            } catch (loginError) {
              console.log(`❌ Login failed for ${creds.email}`);
            }
          }

          if (!userToken) {
            console.error('❌ Could not login with any credentials');
            return;
          }
        } else {
          console.error('❌ Failed to create user:', createError.response?.data || createError.message);
          return;
        }
      }
    }

    // Step 2: Get user properties
    console.log('\n2. Fetching user properties...');
    const propertiesResponse = await axios.get(`${BACKEND_URL}/properties/user`, {
      headers: { Authorization: `Bearer ${userToken}` }
    });
    
    const properties = propertiesResponse.data.properties || [];
    console.log(`✅ Found ${properties.length} properties`);
    
    if (properties.length > 0) {
      console.log('Properties:');
      properties.forEach((prop, index) => {
        console.log(`  ${index + 1}. Plot ${prop.plotNumber} - Status: ${prop.status} - Documents Validated: ${prop.documentsValidated}`);
      });
    }

    // Step 3: Create a test property if none exist or none are ready for payment
    const readyProperties = properties.filter(p => 
      (p.status === 'documents_validated' || p.documentsValidated === true) && 
      !p.paymentCompleted
    );

    let testProperty;
    if (readyProperties.length === 0) {
      console.log('\n3. Creating test property ready for payment...');
      
      try {
        const propertyResponse = await axios.post(`${BACKEND_URL}/properties`, {
          plotNumber: `TEST-PAY-${Date.now()}`,
          propertyType: 'residential',
          area: 500,
          location: {
            region: 'Addis Ababa',
            zone: 'Addis Ababa',
            woreda: 'Bole',
            kebele: 'Kebele 01',
            subCity: 'Bole',
            city: 'Addis Ababa'
          }
        }, {
          headers: { Authorization: `Bearer ${userToken}` }
        });
        
        testProperty = propertyResponse.data.property;
        console.log(`✅ Created test property: ${testProperty.plotNumber}`);
        
        // Update property to be ready for payment (simulate document validation)
        // Note: This would normally be done by a land officer, but for testing we'll simulate it
        console.log('📝 Simulating document validation...');
        
        // We need admin/land officer access to validate documents
        // Let's try with admin credentials
        try {
          const adminLoginResponse = await axios.post(`${BACKEND_URL}/auth/login`, {
            email: 'cooladmin@gmail.com',
            password: 'Admin@123'
          });
          
          const adminToken = adminLoginResponse.data.token;
          console.log('✅ Admin login successful');
          
          // Update property status to documents_validated
          await axios.put(`${BACKEND_URL}/properties/${testProperty._id}`, {
            status: 'documents_validated',
            documentsValidated: true
          }, {
            headers: { Authorization: `Bearer ${adminToken}` }
          });
          
          console.log('✅ Property marked as documents validated');
          
        } catch (adminError) {
          console.log('⚠️ Could not validate documents (admin access needed)');
        }
        
      } catch (error) {
        console.error('❌ Failed to create test property:', error.response?.data || error.message);
        return;
      }
    } else {
      testProperty = readyProperties[0];
      console.log(`\n3. Using existing property ready for payment: ${testProperty.plotNumber}`);
    }

    // Step 4: Test payment calculation
    console.log('\n4. Testing payment calculation...');
    try {
      const calcResponse = await axios.get(`${BACKEND_URL}/payments/calculate/${testProperty._id}`, {
        headers: { Authorization: `Bearer ${userToken}` }
      });
      
      console.log('✅ Payment calculation successful');
      console.log(`💰 Amount: ${calcResponse.data.calculation.summary.totalAmount} ETB`);
    } catch (error) {
      console.error('❌ Payment calculation failed:', error.response?.data || error.message);
    }

    // Step 5: Test payment initialization
    console.log('\n5. Testing CBE Birr payment initialization...');
    try {
      const initResponse = await axios.post(`${BACKEND_URL}/payments/cbe-birr/initialize/${testProperty._id}`, {
        returnUrl: 'http://localhost:3003/payments'
      }, {
        headers: { Authorization: `Bearer ${userToken}` }
      });
      
      console.log('✅ Payment initialization successful');
      console.log(`🔗 Transaction ID: ${initResponse.data.transactionId}`);
      
      // Step 6: Test payment processing
      console.log('\n6. Testing payment processing...');
      try {
        const processResponse = await axios.post(`${BACKEND_URL}/payments/cbe-birr/process/${initResponse.data.transactionId}`, {
          cbeAccountNumber: '1000123456789',
          cbePin: '1234'
        });
        
        console.log('✅ Payment processing successful');
        console.log(`✅ Payment status: ${processResponse.data.payment.status}`);
        
      } catch (processError) {
        console.error('❌ Payment processing failed:', processError.response?.data || processError.message);
      }
      
    } catch (initError) {
      console.error('❌ Payment initialization failed:', initError.response?.data || initError.message);
      
      // Log detailed error for debugging
      if (initError.response) {
        console.log('Error details:');
        console.log('Status:', initError.response.status);
        console.log('Data:', JSON.stringify(initError.response.data, null, 2));
      }
    }

    console.log('\n🎉 Payment API test completed!');

  } catch (error) {
    console.error('💥 Test failed:', error.message);
    if (error.response) {
      console.log('Error response:', error.response.data);
    }
  }
}

// Run the test
testPaymentAPI().catch(console.error);
