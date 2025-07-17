/**
 * Simulated Payment Gateway Service
 * Provides realistic simulation of Ethiopian payment methods (CBE Birr, TeleBirr)
 */

import crypto from 'crypto';

class SimulatedPaymentGateway {
  constructor() {
    this.transactions = new Map(); // In-memory transaction store for simulation
    this.successRate = 0.85; // 85% success rate for realistic simulation
  }

  /**
   * Initialize CBE Birr payment
   * @param {Object} paymentData - Payment initialization data
   * @returns {Object} Payment initialization response
   */
  async initializeCBEBirrPayment(paymentData) {
    try {
      const {
        amount,
        currency = 'ETB',
        customerName,
        customerPhone,
        customerEmail,
        description,
        callbackUrl,
        returnUrl,
        transactionRef
      } = paymentData;

      // Generate CBE-specific transaction ID
      const cbeTransactionId = this.generateCBETransactionId();
      
      // Create transaction record
      const transaction = {
        id: cbeTransactionId,
        transactionRef,
        paymentMethod: 'cbe_birr',
        amount,
        currency,
        customerName,
        customerPhone,
        customerEmail,
        description,
        status: 'pending',
        createdAt: new Date(),
        callbackUrl,
        returnUrl,
        // CBE-specific fields
        cbeAccountNumber: null,
        cbeReference: cbeTransactionId,
        sessionId: crypto.randomUUID(),
      };

      this.transactions.set(cbeTransactionId, transaction);

      // Simulate CBE Birr payment URL
      const paymentUrl = `${process.env.FRONTEND_URL}/payment/cbe-birr/${cbeTransactionId}`;

      return {
        success: true,
        transactionId: cbeTransactionId,
        paymentUrl,
        sessionId: transaction.sessionId,
        expiresAt: new Date(Date.now() + 30 * 60 * 1000), // 30 minutes
        instructions: {
          step1: 'You will be redirected to CBE Birr payment interface',
          step2: 'Enter your CBE account number and PIN',
          step3: 'Confirm the payment details',
          step4: 'Complete the transaction'
        }
      };
    } catch (error) {
      console.error('CBE Birr payment initialization error:', error);
      return {
        success: false,
        error: 'Failed to initialize CBE Birr payment',
        details: error.message
      };
    }
  }

  /**
   * Initialize TeleBirr payment
   * @param {Object} paymentData - Payment initialization data
   * @returns {Object} Payment initialization response
   */
  async initializeTeleBirrPayment(paymentData) {
    try {
      const {
        amount,
        currency = 'ETB',
        customerName,
        customerPhone,
        customerEmail,
        description,
        callbackUrl,
        returnUrl,
        transactionRef
      } = paymentData;

      // Generate TeleBirr-specific transaction ID
      const telebirrTransactionId = this.generateTeleBirrTransactionId();
      
      // Create transaction record
      const transaction = {
        id: telebirrTransactionId,
        transactionRef,
        paymentMethod: 'telebirr',
        amount,
        currency,
        customerName,
        customerPhone,
        customerEmail,
        description,
        status: 'pending',
        createdAt: new Date(),
        callbackUrl,
        returnUrl,
        // TeleBirr-specific fields
        telebirrPhone: customerPhone,
        telebirrReference: telebirrTransactionId,
        sessionId: crypto.randomUUID(),
      };

      this.transactions.set(telebirrTransactionId, transaction);

      // Simulate TeleBirr payment URL
      const paymentUrl = `${process.env.FRONTEND_URL}/payment/telebirr/${telebirrTransactionId}`;

      return {
        success: true,
        transactionId: telebirrTransactionId,
        paymentUrl,
        sessionId: transaction.sessionId,
        expiresAt: new Date(Date.now() + 15 * 60 * 1000), // 15 minutes
        instructions: {
          step1: 'You will be redirected to TeleBirr payment interface',
          step2: 'Enter your TeleBirr PIN',
          step3: 'Confirm the payment amount',
          step4: 'Complete the transaction'
        }
      };
    } catch (error) {
      console.error('TeleBirr payment initialization error:', error);
      return {
        success: false,
        error: 'Failed to initialize TeleBirr payment',
        details: error.message
      };
    }
  }

  /**
   * Process CBE Birr payment (simulate user completing payment)
   * @param {string} transactionId - Transaction ID
   * @param {Object} paymentDetails - Payment completion details
   * @returns {Object} Payment processing result
   */
  async processCBEBirrPayment(transactionId, paymentDetails) {
    try {
      const transaction = this.transactions.get(transactionId);
      
      if (!transaction) {
        return {
          success: false,
          error: 'Transaction not found'
        };
      }

      if (transaction.status !== 'pending') {
        return {
          success: false,
          error: 'Transaction already processed'
        };
      }

      const { cbeAccountNumber, cbePin } = paymentDetails;

      // Simulate CBE account validation
      const isValidAccount = this.validateCBEAccount(cbeAccountNumber, cbePin);
      const hasInsufficientFunds = Math.random() < 0.1; // 10% chance of insufficient funds
      const systemError = Math.random() < 0.05; // 5% chance of system error

      if (!isValidAccount) {
        transaction.status = 'failed';
        transaction.failureReason = 'Invalid CBE account number or PIN';
        transaction.completedAt = new Date();
        
        return {
          success: false,
          error: 'Invalid CBE account credentials',
          transactionId
        };
      }

      if (hasInsufficientFunds) {
        transaction.status = 'failed';
        transaction.failureReason = 'Insufficient funds in CBE account';
        transaction.completedAt = new Date();
        
        return {
          success: false,
          error: 'Insufficient funds',
          transactionId
        };
      }

      if (systemError) {
        transaction.status = 'failed';
        transaction.failureReason = 'CBE system temporarily unavailable';
        transaction.completedAt = new Date();
        
        return {
          success: false,
          error: 'Payment system temporarily unavailable',
          transactionId
        };
      }

      // Successful payment
      transaction.status = 'completed';
      transaction.completedAt = new Date();
      transaction.cbeAccountNumber = cbeAccountNumber;
      transaction.cbeConfirmationCode = this.generateCBEConfirmationCode();

      // Simulate callback to merchant
      if (transaction.callbackUrl) {
        this.simulateCallback(transaction);
      }

      return {
        success: true,
        transactionId,
        confirmationCode: transaction.cbeConfirmationCode,
        amount: transaction.amount,
        currency: transaction.currency,
        completedAt: transaction.completedAt
      };
    } catch (error) {
      console.error('CBE Birr payment processing error:', error);
      return {
        success: false,
        error: 'Payment processing failed',
        details: error.message
      };
    }
  }

  /**
   * Process TeleBirr payment (simulate user completing payment)
   * @param {string} transactionId - Transaction ID
   * @param {Object} paymentDetails - Payment completion details
   * @returns {Object} Payment processing result
   */
  async processTeleBirrPayment(transactionId, paymentDetails) {
    try {
      const transaction = this.transactions.get(transactionId);
      
      if (!transaction) {
        return {
          success: false,
          error: 'Transaction not found'
        };
      }

      if (transaction.status !== 'pending') {
        return {
          success: false,
          error: 'Transaction already processed'
        };
      }

      const { telebirrPin } = paymentDetails;

      // Simulate TeleBirr PIN validation
      const isValidPin = this.validateTeleBirrPin(transaction.telebirrPhone, telebirrPin);
      const hasInsufficientBalance = Math.random() < 0.08; // 8% chance of insufficient balance
      const networkError = Math.random() < 0.03; // 3% chance of network error

      if (!isValidPin) {
        transaction.status = 'failed';
        transaction.failureReason = 'Invalid TeleBirr PIN';
        transaction.completedAt = new Date();
        
        return {
          success: false,
          error: 'Invalid TeleBirr PIN',
          transactionId
        };
      }

      if (hasInsufficientBalance) {
        transaction.status = 'failed';
        transaction.failureReason = 'Insufficient TeleBirr balance';
        transaction.completedAt = new Date();
        
        return {
          success: false,
          error: 'Insufficient balance',
          transactionId
        };
      }

      if (networkError) {
        transaction.status = 'failed';
        transaction.failureReason = 'TeleBirr network error';
        transaction.completedAt = new Date();
        
        return {
          success: false,
          error: 'Network error, please try again',
          transactionId
        };
      }

      // Successful payment
      transaction.status = 'completed';
      transaction.completedAt = new Date();
      transaction.telebirrConfirmationCode = this.generateTeleBirrConfirmationCode();

      // Simulate callback to merchant
      if (transaction.callbackUrl) {
        this.simulateCallback(transaction);
      }

      return {
        success: true,
        transactionId,
        confirmationCode: transaction.telebirrConfirmationCode,
        amount: transaction.amount,
        currency: transaction.currency,
        completedAt: transaction.completedAt
      };
    } catch (error) {
      console.error('TeleBirr payment processing error:', error);
      return {
        success: false,
        error: 'Payment processing failed',
        details: error.message
      };
    }
  }

  /**
   * Verify payment status
   * @param {string} transactionId - Transaction ID
   * @returns {Object} Payment status
   */
  async verifyPayment(transactionId) {
    const transaction = this.transactions.get(transactionId);
    
    if (!transaction) {
      return {
        success: false,
        error: 'Transaction not found'
      };
    }

    return {
      success: true,
      transaction: {
        id: transaction.id,
        transactionRef: transaction.transactionRef,
        status: transaction.status,
        amount: transaction.amount,
        currency: transaction.currency,
        paymentMethod: transaction.paymentMethod,
        createdAt: transaction.createdAt,
        completedAt: transaction.completedAt,
        failureReason: transaction.failureReason
      }
    };
  }

  // Helper methods
  generateCBETransactionId() {
    return `CBE${Date.now()}${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
  }

  generateTeleBirrTransactionId() {
    return `TB${Date.now()}${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
  }

  generateCBEConfirmationCode() {
    return `CBE${Math.random().toString(36).substr(2, 8).toUpperCase()}`;
  }

  generateTeleBirrConfirmationCode() {
    return `TB${Math.random().toString(36).substr(2, 8).toUpperCase()}`;
  }

  validateCBEAccount(accountNumber, pin) {
    // Simulate account validation (always return true for demo)
    return accountNumber && accountNumber.length >= 10 && pin && pin.length >= 4;
  }

  validateTeleBirrPin(phoneNumber, pin) {
    // Simulate PIN validation (always return true for demo)
    return phoneNumber && pin && pin.length >= 4;
  }

  async simulateCallback(transaction) {
    // In a real implementation, this would make an HTTP request to the callback URL
    console.log(`Simulating callback for transaction ${transaction.id}:`, {
      transactionId: transaction.id,
      status: transaction.status,
      amount: transaction.amount,
      currency: transaction.currency
    });
  }

  // Get all transactions (for testing/debugging)
  getAllTransactions() {
    return Array.from(this.transactions.values());
  }

  // Clear all transactions (for testing)
  clearTransactions() {
    this.transactions.clear();
  }
}

// Export singleton instance
export default new SimulatedPaymentGateway();
