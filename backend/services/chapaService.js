import axios from 'axios';
import crypto from 'crypto';

class ChapaService {
  constructor() {
    this.baseURL = process.env.CHAPA_BASE_URL || 'https://api.chapa.co/v1';
    this.secretKey = process.env.CHAPA_SECRET_KEY;
    this.publicKey = process.env.CHAPA_PUBLIC_KEY;
    this.webhookSecret = process.env.CHAPA_WEBHOOK_SECRET;
  }

  // Check if Chapa is properly configured
  isConfigured() {
    return !!this.secretKey;
  }

  // Validate configuration before making API calls
  validateConfiguration() {
    if (!this.secretKey) {
      throw new Error('CHAPA_SECRET_KEY environment variable is required. Please configure Chapa credentials in your .env file.');
    }
  }

  /**
   * Initialize a payment transaction with Chapa
   * @param {Object} paymentData - Payment initialization data
   * @returns {Promise<Object>} - Chapa response with checkout URL
   */
  async initializePayment(paymentData) {
    try {
      // Validate Chapa configuration
      this.validateConfiguration();

      const {
        amount,
        currency = 'ETB',
        email,
        firstName,
        lastName,
        phoneNumber,
        txRef,
        callbackUrl,
        returnUrl,
        customization = {}
      } = paymentData;

      // Validate required fields
      if (!amount || !email || !txRef) {
        throw new Error('Amount, email, and transaction reference are required');
      }

      const payload = {
        amount: amount.toString(),
        currency,
        email,
        first_name: firstName,
        last_name: lastName,
        phone_number: phoneNumber,
        tx_ref: txRef,
        callback_url: callbackUrl,
        return_url: returnUrl,
        customization: {
          title: customization.title || 'Property Registration Payment',
          description: customization.description || 'Payment for property registration processing fee',
          ...customization
        }
      };

      const response = await axios.post(
        `${this.baseURL}/transaction/initialize`,
        payload,
        {
          headers: {
            'Authorization': `Bearer ${this.secretKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return response.data;
    } catch (error) {
      console.error('Chapa payment initialization error:', error.response?.data || error.message);
      throw new Error(
        error.response?.data?.message ||
        'Failed to initialize payment with Chapa'
      );
    }
  }

  /**
   * Verify a payment transaction
   * @param {string} txRef - Transaction reference
   * @returns {Promise<Object>} - Payment verification result
   */
  async verifyPayment(txRef) {
    try {
      // Validate Chapa configuration
      this.validateConfiguration();

      if (!txRef) {
        throw new Error('Transaction reference is required');
      }

      const response = await axios.get(
        `${this.baseURL}/transaction/verify/${txRef}`,
        {
          headers: {
            'Authorization': `Bearer ${this.secretKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return response.data;
    } catch (error) {
      console.error('Chapa payment verification error:', error.response?.data || error.message);
      throw new Error(
        error.response?.data?.message ||
        'Failed to verify payment with Chapa'
      );
    }
  }

  /**
   * Validate webhook signature
   * @param {string} payload - Raw webhook payload
   * @param {string} signature - Webhook signature from headers
   * @returns {boolean} - Whether signature is valid
   */
  validateWebhookSignature(payload, signature) {
    try {
      if (!this.webhookSecret) {
        return true; // Allow webhook if secret not configured (for development)
      }

      const expectedSignature = crypto
        .createHmac('sha256', this.webhookSecret)
        .update(payload, 'utf8')
        .digest('hex');

      return crypto.timingSafeEqual(
        Buffer.from(signature, 'hex'),
        Buffer.from(expectedSignature, 'hex')
      );
    } catch (error) {
      return false;
    }
  }

  /**
   * Generate a unique transaction reference
   * @param {string} propertyId - Property ID
   * @param {string} userId - User ID
   * @returns {string} - Unique transaction reference
   */
  generateTxRef(propertyId, userId) {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    return `prop_${propertyId}_${userId}_${timestamp}_${random}`;
  }

  /**
   * Calculate processing fee based on property value or type
   * @param {Object} property - Property object
   * @returns {number} - Processing fee amount
   */
  calculateProcessingFee(property) {
    // Base processing fee structure
    const baseFees = {
      residential: 500,
      commercial: 1000,
      industrial: 1500,
      agricultural: 300
    };

    let fee = baseFees[property.propertyType] || 500;

    // Add area-based fee (1 ETB per square meter)
    if (property.area) {
      fee += property.area * 1;
    }

    return Math.max(fee, 100); // Minimum fee of 100 ETB
  }
}

export default new ChapaService();
