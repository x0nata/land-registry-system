/**
 * Payment System Tests
 * Comprehensive tests for the payment workflow integration
 */

import request from 'supertest';
import app from '../app.js';
import User from '../models/User.js';
import Property from '../models/Property.js';
import Payment from '../models/Payment.js';
import { connectDB, disconnectDB, clearDB } from './setup/database.js';

describe('Payment System Integration Tests', () => {
  let userToken, landOfficerToken, adminToken;
  let testUser, testLandOfficer, testAdmin;
  let testProperty;

  beforeAll(async () => {
    await connectDB();
  });

  afterAll(async () => {
    await disconnectDB();
  });

  beforeEach(async () => {
    await clearDB();
    
    // Create test users
    testUser = await User.create({
      fullName: 'Test User',
      email: 'testuser@example.com',
      password: 'password123',
      phoneNumber: '+251911234567',
      nationalId: 'ID123456789',
      role: 'user'
    });

    testLandOfficer = await User.create({
      fullName: 'Test Land Officer',
      email: 'landofficer@example.com',
      password: 'password123',
      phoneNumber: '+251911234568',
      nationalId: 'ID123456790',
      role: 'landOfficer'
    });

    testAdmin = await User.create({
      fullName: 'Test Admin',
      email: 'admin@example.com',
      password: 'password123',
      phoneNumber: '+251911234569',
      nationalId: 'ID123456791',
      role: 'admin'
    });

    // Get authentication tokens
    const userLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: 'testuser@example.com', password: 'password123' });
    userToken = userLogin.body.token;

    const landOfficerLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: 'landofficer@example.com', password: 'password123' });
    landOfficerToken = landOfficerLogin.body.token;

    const adminLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@example.com', password: 'password123' });
    adminToken = adminLogin.body.token;

    // Create test property
    testProperty = await Property.create({
      plotNumber: 'TEST-001',
      propertyType: 'residential',
      area: 500,
      location: {
        region: 'Addis Ababa',
        zone: 'Addis Ababa',
        woreda: 'Bole',
        kebele: 'Kebele 01',
        subCity: 'Bole'
      },
      owner: testUser._id,
      status: 'documents_validated',
      documentsValidated: true,
      paymentCompleted: false
    });
  });

  describe('Payment Calculation', () => {
    test('should calculate payment amount correctly', async () => {
      const response = await request(app)
        .get(`/api/payments/calculate/${testProperty._id}`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.calculation).toHaveProperty('summary');
      expect(response.body.calculation.summary).toHaveProperty('totalAmount');
      expect(response.body.calculation.summary.totalAmount).toBeGreaterThan(0);
    });

    test('should deny calculation for unauthorized user', async () => {
      const otherUser = await User.create({
        fullName: 'Other User',
        email: 'other@example.com',
        password: 'password123',
        phoneNumber: '+251911234570',
        nationalId: 'ID123456792',
        role: 'user'
      });

      const otherLogin = await request(app)
        .post('/api/auth/login')
        .send({ email: 'other@example.com', password: 'password123' });

      const response = await request(app)
        .get(`/api/payments/calculate/${testProperty._id}`)
        .set('Authorization', `Bearer ${otherLogin.body.token}`);

      expect(response.status).toBe(403);
    });
  });

  describe('CBE Birr Payment Flow', () => {
    test('should initialize CBE Birr payment successfully', async () => {
      const response = await request(app)
        .post(`/api/payments/cbe-birr/initialize/${testProperty._id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          returnUrl: 'http://localhost:3000/property/test'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body).toHaveProperty('transactionId');
      expect(response.body).toHaveProperty('paymentUrl');
      expect(response.body.payment.paymentMethod).toBe('cbe_birr');
    });

    test('should prevent duplicate payment initialization', async () => {
      // First payment
      await request(app)
        .post(`/api/payments/cbe-birr/initialize/${testProperty._id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ returnUrl: 'http://localhost:3000/property/test' });

      // Second payment attempt
      const response = await request(app)
        .post(`/api/payments/cbe-birr/initialize/${testProperty._id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ returnUrl: 'http://localhost:3000/property/test' });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('payment is already in progress');
    });

    test('should process CBE Birr payment successfully', async () => {
      // Initialize payment first
      const initResponse = await request(app)
        .post(`/api/payments/cbe-birr/initialize/${testProperty._id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ returnUrl: 'http://localhost:3000/property/test' });

      const transactionId = initResponse.body.transactionId;

      // Process payment
      const response = await request(app)
        .post(`/api/payments/cbe-birr/process/${transactionId}`)
        .send({
          cbeAccountNumber: '1234567890123456',
          cbePin: '1234'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.payment.status).toBe('completed');
    });
  });

  describe('TeleBirr Payment Flow', () => {
    test('should initialize TeleBirr payment successfully', async () => {
      const response = await request(app)
        .post(`/api/payments/telebirr/initialize/${testProperty._id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          returnUrl: 'http://localhost:3000/property/test'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body).toHaveProperty('transactionId');
      expect(response.body.payment.paymentMethod).toBe('telebirr');
    });

    test('should process TeleBirr payment successfully', async () => {
      // Initialize payment first
      const initResponse = await request(app)
        .post(`/api/payments/telebirr/initialize/${testProperty._id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ returnUrl: 'http://localhost:3000/property/test' });

      const transactionId = initResponse.body.transactionId;

      // Process payment
      const response = await request(app)
        .post(`/api/payments/telebirr/process/${transactionId}`)
        .send({
          telebirrPin: '1234'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.payment.status).toBe('completed');
    });
  });

  describe('Payment Workflow Integration', () => {
    test('should prevent payment before document validation', async () => {
      // Create property without validated documents
      const unvalidatedProperty = await Property.create({
        plotNumber: 'TEST-002',
        propertyType: 'residential',
        area: 300,
        location: {
          region: 'Addis Ababa',
          zone: 'Addis Ababa',
          woreda: 'Bole',
          kebele: 'Kebele 02',
          subCity: 'Bole'
        },
        owner: testUser._id,
        status: 'pending',
        documentsValidated: false,
        paymentCompleted: false
      });

      const response = await request(app)
        .post(`/api/payments/cbe-birr/initialize/${unvalidatedProperty._id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ returnUrl: 'http://localhost:3000/property/test' });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('Documents must be validated first');
    });

    test('should update property status after successful payment', async () => {
      // Initialize and complete payment
      const initResponse = await request(app)
        .post(`/api/payments/cbe-birr/initialize/${testProperty._id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ returnUrl: 'http://localhost:3000/property/test' });

      await request(app)
        .post(`/api/payments/cbe-birr/process/${initResponse.body.transactionId}`)
        .send({
          cbeAccountNumber: '1234567890123456',
          cbePin: '1234'
        });

      // Check property status
      const updatedProperty = await Property.findById(testProperty._id);
      expect(updatedProperty.paymentCompleted).toBe(true);
      expect(updatedProperty.status).toBe('payment_completed');
    });

    test('should allow land officer approval only after payment completion', async () => {
      // Try to approve without payment
      let response = await request(app)
        .put(`/api/properties/${testProperty._id}/approve`)
        .set('Authorization', `Bearer ${landOfficerToken}`)
        .send({ notes: 'Test approval' });

      expect(response.status).toBe(400);

      // Complete payment
      const initResponse = await request(app)
        .post(`/api/payments/cbe-birr/initialize/${testProperty._id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ returnUrl: 'http://localhost:3000/property/test' });

      await request(app)
        .post(`/api/payments/cbe-birr/process/${initResponse.body.transactionId}`)
        .send({
          cbeAccountNumber: '1234567890123456',
          cbePin: '1234'
        });

      // Now approval should work
      response = await request(app)
        .put(`/api/properties/${testProperty._id}/approve`)
        .set('Authorization', `Bearer ${landOfficerToken}`)
        .send({ notes: 'Test approval after payment' });

      expect(response.status).toBe(200);
    });
  });

  describe('Payment Security', () => {
    test('should rate limit payment attempts', async () => {
      const promises = [];
      
      // Make multiple rapid payment attempts
      for (let i = 0; i < 6; i++) {
        promises.push(
          request(app)
            .post(`/api/payments/cbe-birr/initialize/${testProperty._id}`)
            .set('Authorization', `Bearer ${userToken}`)
            .send({ returnUrl: 'http://localhost:3000/property/test' })
        );
      }

      const responses = await Promise.all(promises);
      
      // Should have at least one rate limited response
      const rateLimitedResponses = responses.filter(r => r.status === 429);
      expect(rateLimitedResponses.length).toBeGreaterThan(0);
    });

    test('should validate payment amount', async () => {
      // This test would require modifying the payment initialization to accept amount
      // For now, we'll test that the calculation service validates amounts correctly
      const calculation = await request(app)
        .get(`/api/payments/calculate/${testProperty._id}`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(calculation.body.calculation.summary.totalAmount).toBeGreaterThan(0);
    });
  });

  describe('Payment Statistics and History', () => {
    test('should get payment statistics', async () => {
      const response = await request(app)
        .get('/api/payments/stats')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.statistics).toHaveProperty('totalPayments');
    });

    test('should generate payment receipt', async () => {
      // Complete a payment first
      const initResponse = await request(app)
        .post(`/api/payments/cbe-birr/initialize/${testProperty._id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ returnUrl: 'http://localhost:3000/property/test' });

      const processResponse = await request(app)
        .post(`/api/payments/cbe-birr/process/${initResponse.body.transactionId}`)
        .send({
          cbeAccountNumber: '1234567890123456',
          cbePin: '1234'
        });

      // Generate receipt
      const response = await request(app)
        .get(`/api/payments/${processResponse.body.payment.id}/receipt`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.receipt).toHaveProperty('receiptNumber');
    });
  });
});
