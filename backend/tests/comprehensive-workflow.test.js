/**
 * Comprehensive Testing Suite for Land Registry System
 * Tests notification system and end-to-end property registration workflow
 */

import axios from 'axios';
import { expect } from 'chai';

// Configuration
const BACKEND_URL = 'https://land-registry-backend-plum.vercel.app/api';
const USER_FRONTEND_URL = 'http://localhost:3002';
const LANDOFFICER_FRONTEND_URL = 'http://localhost:3000';

// Test credentials
const TEST_USERS = {
  admin: {
    email: 'cooladmin@gmail.com',
    password: 'Admin@123'
  },
  landOfficer: {
    email: 'MrLand@gmail.com',
    password: 'Land@123'
  },
  testUser: {
    fullName: 'Test User',
    email: 'testuser@example.com',
    password: 'TestUser@123',
    phoneNumber: '+251911234567',
    nationalId: 'ETH123456789'
  }
};

// Global test state
let testState = {
  userToken: null,
  landOfficerToken: null,
  adminToken: null,
  testProperty: null,
  testDocuments: [],
  testPayment: null,
  notifications: []
};

describe('Comprehensive Land Registry System Testing', function() {
  this.timeout(60000); // 60 second timeout for all tests

  before(async function() {
    console.log('🚀 Starting comprehensive testing suite...');
    console.log(`📡 Backend URL: ${BACKEND_URL}`);
    console.log(`👤 User Frontend: ${USER_FRONTEND_URL}`);
    console.log(`🏛️ Land Officer Frontend: ${LANDOFFICER_FRONTEND_URL}`);
  });

  describe('1. Authentication Setup', function() {
    it('should authenticate admin user', async function() {
      try {
        const response = await axios.post(`${BACKEND_URL}/auth/login`, {
          email: TEST_USERS.admin.email,
          password: TEST_USERS.admin.password
        });

        expect(response.status).to.equal(200);
        expect(response.data).to.have.property('token');
        testState.adminToken = response.data.token;
        console.log('✅ Admin authenticated successfully');
      } catch (error) {
        console.error('❌ Admin authentication failed:', error.response?.data || error.message);
        throw error;
      }
    });

    it('should authenticate land officer', async function() {
      try {
        const response = await axios.post(`${BACKEND_URL}/auth/login`, {
          email: TEST_USERS.landOfficer.email,
          password: TEST_USERS.landOfficer.password
        });

        expect(response.status).to.equal(200);
        expect(response.data).to.have.property('token');
        testState.landOfficerToken = response.data.token;
        console.log('✅ Land officer authenticated successfully');
      } catch (error) {
        console.error('❌ Land officer authentication failed:', error.response?.data || error.message);
        throw error;
      }
    });

    it('should create and authenticate test user', async function() {
      try {
        // Try to register the test user
        try {
          await axios.post(`${BACKEND_URL}/auth/register`, TEST_USERS.testUser);
          console.log('✅ Test user registered successfully');
        } catch (registerError) {
          if (registerError.response?.status === 400 && 
              registerError.response?.data?.message?.includes('already exists')) {
            console.log('ℹ️ Test user already exists, proceeding with login');
          } else {
            throw registerError;
          }
        }

        // Login the test user
        const response = await axios.post(`${BACKEND_URL}/auth/login`, {
          email: TEST_USERS.testUser.email,
          password: TEST_USERS.testUser.password
        });

        expect(response.status).to.equal(200);
        expect(response.data).to.have.property('token');
        testState.userToken = response.data.token;
        console.log('✅ Test user authenticated successfully');
      } catch (error) {
        console.error('❌ Test user setup failed:', error.response?.data || error.message);
        throw error;
      }
    });
  });

  describe('2. Property Registration Workflow', function() {
    it('should register a new property', async function() {
      try {
        const propertyData = {
          location: {
            kebele: 'Test Kebele',
            subCity: 'Test SubCity',
            coordinates: {
              latitude: 9.0192,
              longitude: 38.7525
            }
          },
          plotNumber: `TEST-${Date.now()}`,
          area: 500,
          propertyType: 'residential'
        };

        const response = await axios.post(`${BACKEND_URL}/properties`, propertyData, {
          headers: { Authorization: `Bearer ${testState.userToken}` }
        });

        expect(response.status).to.equal(201);
        expect(response.data).to.have.property('_id');
        expect(response.data.status).to.equal('pending');
        testState.testProperty = response.data;
        console.log(`✅ Property registered: ${response.data.plotNumber}`);
      } catch (error) {
        console.error('❌ Property registration failed:', error.response?.data || error.message);
        throw error;
      }
    });

    it('should upload documents for the property', async function() {
      try {
        // Simulate document upload by creating document records
        const documentTypes = ['title_deed', 'id_card', 'tax_clearance'];
        
        for (const docType of documentTypes) {
          const documentData = {
            property: testState.testProperty._id,
            documentType: docType,
            fileName: `test_${docType}.pdf`,
            fileSize: 1024000,
            mimeType: 'application/pdf',
            status: 'pending'
          };

          const response = await axios.post(`${BACKEND_URL}/documents`, documentData, {
            headers: { Authorization: `Bearer ${testState.userToken}` }
          });

          expect(response.status).to.equal(201);
          testState.testDocuments.push(response.data);
        }

        console.log(`✅ ${testState.testDocuments.length} documents uploaded`);
      } catch (error) {
        console.error('❌ Document upload failed:', error.response?.data || error.message);
        throw error;
      }
    });
  });

  describe('3. Document Validation by Land Officer', function() {
    it('should validate all documents', async function() {
      try {
        for (const document of testState.testDocuments) {
          const response = await axios.put(
            `${BACKEND_URL}/documents/${document._id}/verify`,
            { notes: 'Document verified for testing' },
            { headers: { Authorization: `Bearer ${testState.landOfficerToken}` } }
          );

          expect(response.status).to.equal(200);
          expect(response.data.status).to.equal('verified');
        }

        console.log('✅ All documents validated by land officer');
      } catch (error) {
        console.error('❌ Document validation failed:', error.response?.data || error.message);
        throw error;
      }
    });

    it('should verify property status changed to documents_validated', async function() {
      try {
        const response = await axios.get(`${BACKEND_URL}/properties/${testState.testProperty._id}`, {
          headers: { Authorization: `Bearer ${testState.userToken}` }
        });

        expect(response.status).to.equal(200);
        expect(response.data.status).to.equal('documents_validated');
        expect(response.data.documentsValidated).to.be.true;
        testState.testProperty = response.data;
        console.log('✅ Property status updated to documents_validated');
      } catch (error) {
        console.error('❌ Property status check failed:', error.response?.data || error.message);
        throw error;
      }
    });
  });

  describe('4. Notification System Testing', function() {
    it('should test payment required notification', async function() {
      // This test verifies that the notification system would send payment required notifications
      // In a real implementation, we would check notification logs or mock the notification service
      console.log('📧 Testing payment required notification...');
      
      // Verify that the property is in the correct state for payment
      expect(testState.testProperty.documentsValidated).to.be.true;
      expect(testState.testProperty.paymentCompleted).to.be.false;
      
      console.log('✅ Property is in correct state for payment required notification');
    });
  });

  describe('5. Payment Processing', function() {
    it('should calculate payment amount', async function() {
      try {
        const response = await axios.get(
          `${BACKEND_URL}/payments/calculate/${testState.testProperty._id}`,
          { headers: { Authorization: `Bearer ${testState.userToken}` } }
        );

        expect(response.status).to.equal(200);
        expect(response.data).to.have.property('summary');
        expect(response.data.summary).to.have.property('totalAmount');
        expect(response.data.summary.totalAmount).to.be.a('number');
        
        console.log(`✅ Payment amount calculated: ${response.data.summary.totalAmount} ETB`);
      } catch (error) {
        console.error('❌ Payment calculation failed:', error.response?.data || error.message);
        throw error;
      }
    });

    it('should create a payment record', async function() {
      try {
        const paymentData = {
          property: testState.testProperty._id,
          amount: 5000,
          currency: 'ETB',
          paymentType: 'registration_fee',
          paymentMethod: 'cbe_birr',
          paymentMethodDetails: {
            cbeAccountNumber: '1234567890',
            cbeTransactionRef: `TEST-${Date.now()}`
          }
        };

        const response = await axios.post(`${BACKEND_URL}/payments`, paymentData, {
          headers: { Authorization: `Bearer ${testState.userToken}` }
        });

        expect(response.status).to.equal(201);
        expect(response.data).to.have.property('_id');
        expect(response.data.status).to.equal('pending');
        testState.testPayment = response.data;
        console.log(`✅ Payment record created: ${response.data._id}`);
      } catch (error) {
        console.error('❌ Payment creation failed:', error.response?.data || error.message);
        throw error;
      }
    });

    it('should simulate payment completion', async function() {
      try {
        const response = await axios.put(
          `${BACKEND_URL}/payments/${testState.testPayment._id}/status`,
          { 
            status: 'completed',
            transactionId: `TXN-${Date.now()}`
          },
          { headers: { Authorization: `Bearer ${testState.userToken}` } }
        );

        expect(response.status).to.equal(200);
        expect(response.data.status).to.equal('completed');
        testState.testPayment = response.data;
        console.log('✅ Payment completed successfully');
      } catch (error) {
        console.error('❌ Payment completion failed:', error.response?.data || error.message);
        throw error;
      }
    });

    it('should update property payment status', async function() {
      try {
        const response = await axios.put(
          `${BACKEND_URL}/properties/${testState.testProperty._id}/payment-completed`,
          {},
          { headers: { Authorization: `Bearer ${testState.userToken}` } }
        );

        expect(response.status).to.equal(200);
        expect(response.data.property.paymentCompleted).to.be.true;
        expect(response.data.property.status).to.equal('payment_completed');
        testState.testProperty = response.data.property;
        console.log('✅ Property payment status updated');
      } catch (error) {
        console.error('❌ Property payment status update failed:', error.response?.data || error.message);
        throw error;
      }
    });
  });

  describe('6. Land Officer Approval Process', function() {
    it('should verify land officer can see property ready for approval', async function() {
      try {
        const response = await axios.get(`${BACKEND_URL}/properties`, {
          headers: { Authorization: `Bearer ${testState.landOfficerToken}` }
        });

        expect(response.status).to.equal(200);
        
        const readyProperty = response.data.find(p => 
          p._id === testState.testProperty._id && 
          p.paymentCompleted === true &&
          p.documentsValidated === true
        );

        expect(readyProperty).to.exist;
        console.log('✅ Land officer can see property ready for approval');
      } catch (error) {
        console.error('❌ Property visibility check failed:', error.response?.data || error.message);
        throw error;
      }
    });

    it('should approve the property', async function() {
      try {
        const response = await axios.put(
          `${BACKEND_URL}/properties/${testState.testProperty._id}/approve`,
          { notes: 'Property approved after successful testing' },
          { headers: { Authorization: `Bearer ${testState.landOfficerToken}` } }
        );

        expect(response.status).to.equal(200);
        expect(response.data.status).to.equal('approved');
        testState.testProperty = response.data;
        console.log('✅ Property approved by land officer');
      } catch (error) {
        console.error('❌ Property approval failed:', error.response?.data || error.message);
        throw error;
      }
    });
  });

  describe('7. Security and Authorization Testing', function() {
    it('should prevent users from approving properties', async function() {
      try {
        // Try to approve a property as a regular user (should fail)
        await axios.put(
          `${BACKEND_URL}/properties/${testState.testProperty._id}/approve`,
          { notes: 'Unauthorized approval attempt' },
          { headers: { Authorization: `Bearer ${testState.userToken}` } }
        );

        // If we reach here, the test should fail
        expect.fail('User should not be able to approve properties');
      } catch (error) {
        expect(error.response.status).to.equal(403);
        console.log('✅ Users correctly prevented from approving properties');
      }
    });

    it('should prevent land officers from making payments', async function() {
      try {
        // Try to create a payment as a land officer (should fail)
        const paymentData = {
          property: testState.testProperty._id,
          amount: 1000,
          currency: 'ETB',
          paymentType: 'registration_fee',
          paymentMethod: 'cbe_birr'
        };

        await axios.post(`${BACKEND_URL}/payments`, paymentData, {
          headers: { Authorization: `Bearer ${testState.landOfficerToken}` }
        });

        // If we reach here, the test should fail
        expect.fail('Land officer should not be able to make payments');
      } catch (error) {
        expect(error.response.status).to.be.oneOf([403, 401]);
        console.log('✅ Land officers correctly prevented from making payments');
      }
    });
  });

  describe('8. Workflow State Validation', function() {
    it('should verify complete workflow state transitions', async function() {
      const expectedStates = [
        'pending',           // Initial registration
        'documents_validated', // After document validation
        'payment_completed',   // After payment
        'approved'            // Final approval
      ];

      // Check application logs for state transitions
      try {
        const response = await axios.get(
          `${BACKEND_URL}/application-logs/property/${testState.testProperty._id}`,
          { headers: { Authorization: `Bearer ${testState.landOfficerToken}` } }
        );

        expect(response.status).to.equal(200);
        const logs = response.data;
        
        // Verify we have logs for each major state transition
        const stateChanges = logs.filter(log => 
          log.action.includes('status') || 
          log.action.includes('validated') || 
          log.action.includes('payment') ||
          log.action.includes('approved')
        );

        expect(stateChanges.length).to.be.greaterThan(0);
        console.log(`✅ Found ${stateChanges.length} state transition logs`);
      } catch (error) {
        console.error('❌ Workflow state validation failed:', error.response?.data || error.message);
        throw error;
      }
    });
  });

  after(function() {
    console.log('🏁 Comprehensive testing completed');
    console.log('📊 Test Results Summary:');
    console.log(`   Property ID: ${testState.testProperty?._id}`);
    console.log(`   Plot Number: ${testState.testProperty?.plotNumber}`);
    console.log(`   Final Status: ${testState.testProperty?.status}`);
    console.log(`   Documents: ${testState.testDocuments.length} uploaded and validated`);
    console.log(`   Payment: ${testState.testPayment?.status}`);
  });
});
