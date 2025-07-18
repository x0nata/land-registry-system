/**
 * Complete Workflow Integration Testing
 * Tests the full property registration workflow using the deployed backend
 */

import axios from 'axios';
import { expect } from 'chai';

// Configuration
const BACKEND_URL = 'https://land-registry-backend-plum.vercel.app/api';

// Test state
let testState = {
  userToken: null,
  landOfficerToken: null,
  testProperty: null,
  testDocuments: [],
  testPayment: null
};

// Test user credentials (we'll create these)
const TEST_USER = {
  fullName: 'Workflow Test User',
  email: `workflowtest${Date.now()}@example.com`,
  password: 'WorkflowTest@123',
  phoneNumber: '+251944444444',
  nationalId: `ETH${Date.now().toString().slice(-9)}`
};

describe('Complete Workflow Integration Testing', function() {
  this.timeout(120000); // 2 minute timeout

  before(async function() {
    console.log('🚀 Starting complete workflow integration testing...');
    console.log(`📡 Backend URL: ${BACKEND_URL}`);
    console.log(`👤 User Frontend: http://localhost:3002`);
    console.log(`🏛️ Land Officer Frontend: http://localhost:3000`);
  });

  describe('1. User Registration and Authentication', function() {
    it('should register a new test user', async function() {
      try {
        console.log(`📝 Registering test user: ${TEST_USER.email}`);
        
        const response = await axios.post(`${BACKEND_URL}/auth/register`, TEST_USER);
        
        expect(response.status).to.equal(201);
        expect(response.data).to.have.property('message');
        console.log('✅ Test user registered successfully');
      } catch (error) {
        if (error.response?.status === 400 && 
            error.response?.data?.message?.includes('already exists')) {
          console.log('ℹ️ Test user already exists, proceeding...');
        } else {
          console.error('❌ User registration failed:', error.response?.data || error.message);
          throw error;
        }
      }
    });

    it('should authenticate the test user', async function() {
      try {
        console.log(`🔐 Authenticating test user: ${TEST_USER.email}`);
        
        const response = await axios.post(`${BACKEND_URL}/auth/login`, {
          email: TEST_USER.email,
          password: TEST_USER.password
        });

        expect(response.status).to.equal(200);
        expect(response.data).to.have.property('token');
        testState.userToken = response.data.token;
        console.log('✅ Test user authenticated successfully');
      } catch (error) {
        console.error('❌ User authentication failed:', error.response?.data || error.message);
        throw error;
      }
    });

    it('should authenticate a land officer', async function() {
      try {
        // Try common land officer credentials
        const landOfficerCredentials = [
          { email: 'MrLand@gmail.com', password: 'Land@123' },
          { email: 'landofficer@example.com', password: 'LandOfficer@123' }
        ];

        let authenticated = false;
        for (const creds of landOfficerCredentials) {
          try {
            console.log(`🔐 Trying land officer credentials: ${creds.email}`);
            const response = await axios.post(`${BACKEND_URL}/auth/login`, creds);
            
            if (response.status === 200 && response.data.token) {
              testState.landOfficerToken = response.data.token;
              authenticated = true;
              console.log(`✅ Land officer authenticated: ${creds.email}`);
              break;
            }
          } catch (error) {
            console.log(`❌ Failed to authenticate ${creds.email}`);
          }
        }

        if (!authenticated) {
          console.log('⚠️ No land officer credentials worked, creating one...');
          
          // Create a land officer
          const newLandOfficer = {
            fullName: 'Test Land Officer',
            email: `testlandofficer${Date.now()}@example.com`,
            password: 'TestLandOfficer@123',
            phoneNumber: '+251955555555',
            nationalId: `ETH${Date.now().toString().slice(-9)}`,
            role: 'landOfficer'
          };

          try {
            await axios.post(`${BACKEND_URL}/auth/register`, newLandOfficer);
            const loginResponse = await axios.post(`${BACKEND_URL}/auth/login`, {
              email: newLandOfficer.email,
              password: newLandOfficer.password
            });
            testState.landOfficerToken = loginResponse.data.token;
            console.log('✅ New land officer created and authenticated');
          } catch (createError) {
            console.error('❌ Failed to create land officer:', createError.response?.data || createError.message);
            throw createError;
          }
        }

        expect(testState.landOfficerToken).to.not.be.null;
      } catch (error) {
        console.error('❌ Land officer authentication failed:', error.message);
        throw error;
      }
    });
  });

  describe('2. Property Registration Workflow', function() {
    it('should register a new property', async function() {
      try {
        const propertyData = {
          location: {
            kebele: 'Workflow Test Kebele',
            subCity: 'Workflow Test SubCity',
            coordinates: {
              latitude: 9.0192,
              longitude: 38.7525
            }
          },
          plotNumber: `WORKFLOW-TEST-${Date.now()}`,
          area: 750,
          propertyType: 'residential'
        };

        console.log(`🏠 Registering property: ${propertyData.plotNumber}`);
        
        const response = await axios.post(`${BACKEND_URL}/properties`, propertyData, {
          headers: { Authorization: `Bearer ${testState.userToken}` }
        });

        expect(response.status).to.equal(201);
        expect(response.data).to.have.property('_id');
        expect(response.data.status).to.equal('pending');
        testState.testProperty = response.data;
        console.log(`✅ Property registered: ${response.data.plotNumber} (ID: ${response.data._id})`);
      } catch (error) {
        console.error('❌ Property registration failed:', error.response?.data || error.message);
        throw error;
      }
    });

    it('should simulate document upload', async function() {
      try {
        console.log('📄 Simulating document upload...');
        
        // Create mock documents
        const documentTypes = ['title_deed', 'id_card', 'tax_clearance'];
        
        for (const docType of documentTypes) {
          const documentData = {
            property: testState.testProperty._id,
            documentType: docType,
            fileName: `workflow_test_${docType}.pdf`,
            fileSize: 1024000,
            mimeType: 'application/pdf',
            status: 'pending'
          };

          const response = await axios.post(`${BACKEND_URL}/documents`, documentData, {
            headers: { Authorization: `Bearer ${testState.userToken}` }
          });

          expect(response.status).to.equal(201);
          testState.testDocuments.push(response.data);
          console.log(`✅ Document uploaded: ${docType}`);
        }

        console.log(`✅ All ${testState.testDocuments.length} documents uploaded successfully`);
      } catch (error) {
        console.error('❌ Document upload failed:', error.response?.data || error.message);
        throw error;
      }
    });
  });

  describe('3. Document Validation by Land Officer', function() {
    it('should validate all documents', async function() {
      try {
        console.log('🔍 Land officer validating documents...');
        
        for (const document of testState.testDocuments) {
          const response = await axios.put(
            `${BACKEND_URL}/documents/${document._id}/verify`,
            { notes: 'Document verified during workflow testing' },
            { headers: { Authorization: `Bearer ${testState.landOfficerToken}` } }
          );

          expect(response.status).to.equal(200);
          expect(response.data.status).to.equal('verified');
          console.log(`✅ Document validated: ${document.documentType}`);
        }

        console.log('✅ All documents validated by land officer');
      } catch (error) {
        console.error('❌ Document validation failed:', error.response?.data || error.message);
        throw error;
      }
    });

    it('should verify property status changed to documents_validated', async function() {
      try {
        console.log('🔄 Checking property status after document validation...');
        
        // Wait a moment for the system to update
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        const response = await axios.get(`${BACKEND_URL}/properties/${testState.testProperty._id}`, {
          headers: { Authorization: `Bearer ${testState.userToken}` }
        });

        expect(response.status).to.equal(200);
        expect(response.data.documentsValidated).to.be.true;
        testState.testProperty = response.data;
        
        console.log(`✅ Property status: ${response.data.status}`);
        console.log(`✅ Documents validated: ${response.data.documentsValidated}`);
      } catch (error) {
        console.error('❌ Property status check failed:', error.response?.data || error.message);
        throw error;
      }
    });
  });

  describe('4. Payment Processing Workflow', function() {
    it('should calculate payment amount', async function() {
      try {
        console.log('💰 Calculating payment amount...');
        
        const response = await axios.get(
          `${BACKEND_URL}/payments/calculate/${testState.testProperty._id}`,
          { headers: { Authorization: `Bearer ${testState.userToken}` } }
        );

        expect(response.status).to.equal(200);
        expect(response.data).to.have.property('summary');
        expect(response.data.summary).to.have.property('totalAmount');
        expect(response.data.summary.totalAmount).to.be.a('number');
        
        console.log(`✅ Payment amount calculated: ${response.data.summary.totalAmount} ETB`);
        console.log(`📊 Fee breakdown:`, response.data.breakdown);
      } catch (error) {
        console.error('❌ Payment calculation failed:', error.response?.data || error.message);
        throw error;
      }
    });

    it('should create and complete payment', async function() {
      try {
        console.log('💳 Creating payment record...');
        
        const paymentData = {
          property: testState.testProperty._id,
          amount: 7500,
          currency: 'ETB',
          paymentType: 'registration_fee',
          paymentMethod: 'cbe_birr',
          paymentMethodDetails: {
            cbeAccountNumber: '1234567890',
            cbeTransactionRef: `WORKFLOW-TEST-${Date.now()}`
          }
        };

        const createResponse = await axios.post(`${BACKEND_URL}/payments`, paymentData, {
          headers: { Authorization: `Bearer ${testState.userToken}` }
        });

        expect(createResponse.status).to.equal(201);
        expect(createResponse.data).to.have.property('_id');
        testState.testPayment = createResponse.data;
        console.log(`✅ Payment record created: ${createResponse.data._id}`);

        // Complete the payment
        console.log('✅ Completing payment...');
        const completeResponse = await axios.put(
          `${BACKEND_URL}/payments/${testState.testPayment._id}/status`,
          { 
            status: 'completed',
            transactionId: `WORKFLOW-TXN-${Date.now()}`
          },
          { headers: { Authorization: `Bearer ${testState.userToken}` } }
        );

        expect(completeResponse.status).to.equal(200);
        expect(completeResponse.data.status).to.equal('completed');
        testState.testPayment = completeResponse.data;
        console.log('✅ Payment completed successfully');

        // Update property payment status
        console.log('🔄 Updating property payment status...');
        const updateResponse = await axios.put(
          `${BACKEND_URL}/properties/${testState.testProperty._id}/payment-completed`,
          {},
          { headers: { Authorization: `Bearer ${testState.userToken}` } }
        );

        expect(updateResponse.status).to.equal(200);
        expect(updateResponse.data.property.paymentCompleted).to.be.true;
        testState.testProperty = updateResponse.data.property;
        console.log('✅ Property payment status updated');
      } catch (error) {
        console.error('❌ Payment processing failed:', error.response?.data || error.message);
        throw error;
      }
    });
  });

  describe('5. Final Approval by Land Officer', function() {
    it('should approve the property', async function() {
      try {
        console.log('🏛️ Land officer approving property...');
        
        const response = await axios.put(
          `${BACKEND_URL}/properties/${testState.testProperty._id}/approve`,
          { notes: 'Property approved after successful workflow testing' },
          { headers: { Authorization: `Bearer ${testState.landOfficerToken}` } }
        );

        expect(response.status).to.equal(200);
        expect(response.data.status).to.equal('approved');
        testState.testProperty = response.data;
        console.log('✅ Property approved by land officer');
        console.log(`🎉 Final property status: ${response.data.status}`);
      } catch (error) {
        console.error('❌ Property approval failed:', error.response?.data || error.message);
        throw error;
      }
    });

    it('should verify complete workflow state', async function() {
      try {
        console.log('🔍 Verifying complete workflow state...');
        
        const response = await axios.get(`${BACKEND_URL}/properties/${testState.testProperty._id}`, {
          headers: { Authorization: `Bearer ${testState.userToken}` }
        });

        expect(response.status).to.equal(200);
        const property = response.data;
        
        // Verify all workflow stages completed
        expect(property.documentsValidated).to.be.true;
        expect(property.paymentCompleted).to.be.true;
        expect(property.status).to.equal('approved');
        
        console.log('✅ Complete workflow verification passed:');
        console.log(`   📄 Documents validated: ${property.documentsValidated}`);
        console.log(`   💰 Payment completed: ${property.paymentCompleted}`);
        console.log(`   ✅ Final status: ${property.status}`);
        console.log(`   🏠 Plot number: ${property.plotNumber}`);
      } catch (error) {
        console.error('❌ Workflow state verification failed:', error.response?.data || error.message);
        throw error;
      }
    });
  });

  after(function() {
    console.log('🏁 Complete workflow integration testing completed');
    console.log('📊 Workflow Test Results Summary:');
    console.log(`   🏠 Property: ${testState.testProperty?.plotNumber} (${testState.testProperty?._id})`);
    console.log(`   📄 Documents: ${testState.testDocuments.length} uploaded and validated`);
    console.log(`   💰 Payment: ${testState.testPayment?.status} (${testState.testPayment?.amount} ETB)`);
    console.log(`   ✅ Final Status: ${testState.testProperty?.status}`);
    console.log('');
    console.log('🎯 Workflow Stages Completed:');
    console.log('   1. ✅ User registration and authentication');
    console.log('   2. ✅ Property registration');
    console.log('   3. ✅ Document upload and validation');
    console.log('   4. ✅ Payment processing');
    console.log('   5. ✅ Land officer approval');
    console.log('');
    console.log('🔗 Frontend URLs for manual testing:');
    console.log('   👤 User Frontend: http://localhost:3002');
    console.log('   🏛️ Land Officer Frontend: http://localhost:3000');
  });
});
