/**
 * Payment Authorization Middleware
 * Handles authorization and security controls for payment operations
 */

import Property from "../models/Property.js";
import Payment from "../models/Payment.js";
import User from "../models/User.js";

/**
 * Middleware to verify payment authorization
 * Ensures user can only access their own payments or admin/land officer can access all
 */
export const verifyPaymentAccess = async (req, res, next) => {
  try {
    const { id: paymentId } = req.params;
    const userId = req.user._id;
    const userRole = req.user.role;

    // Admin and land officers can access all payments
    if (['admin', 'landOfficer'].includes(userRole)) {
      return next();
    }

    // For regular users, verify they own the payment
    const payment = await Payment.findById(paymentId);
    
    if (!payment) {
      return res.status(404).json({ message: "Payment not found" });
    }

    if (payment.user.toString() !== userId.toString()) {
      return res.status(403).json({ 
        message: "Not authorized to access this payment" 
      });
    }

    next();
  } catch (error) {
    console.error('Payment access verification error:', error);
    res.status(500).json({ 
      message: "Server error during payment authorization",
      error: error.message 
    });
  }
};

/**
 * Middleware to verify property payment authorization
 * Ensures user can only initiate payments for their own properties
 */
export const verifyPropertyPaymentAccess = async (req, res, next) => {
  try {
    const { propertyId } = req.params;
    const userId = req.user._id;
    const userRole = req.user.role;

    // Admin and land officers can access all property payments
    if (['admin', 'landOfficer'].includes(userRole)) {
      return next();
    }

    // For regular users, verify they own the property
    const property = await Property.findById(propertyId);
    
    if (!property) {
      return res.status(404).json({ message: "Property not found" });
    }

    if (property.owner.toString() !== userId.toString()) {
      return res.status(403).json({ 
        message: "Not authorized to make payments for this property" 
      });
    }

    // Add property to request for use in controller
    req.property = property;
    next();
  } catch (error) {
    console.error('Property payment access verification error:', error);
    res.status(500).json({ 
      message: "Server error during property payment authorization",
      error: error.message 
    });
  }
};

/**
 * Middleware to verify payment workflow state
 * Ensures payments can only be made at the correct stage of the workflow
 */
export const verifyPaymentWorkflowState = async (req, res, next) => {
  try {
    const property = req.property; // Set by verifyPropertyPaymentAccess

    // Check if documents are validated
    if (!property.documentsValidated) {
      return res.status(400).json({
        message: "Cannot process payment. Documents must be validated first.",
        workflowStage: "document_validation_required"
      });
    }

    // Check if payment is already completed
    if (property.paymentCompleted) {
      return res.status(400).json({
        message: "Payment has already been completed for this property.",
        workflowStage: "payment_already_completed"
      });
    }

    // Check if property is in correct status
    const validStatuses = ['documents_validated', 'payment_pending'];
    if (!validStatuses.includes(property.status)) {
      return res.status(400).json({
        message: `Cannot process payment. Property status is '${property.status}'. Expected: ${validStatuses.join(' or ')}.`,
        workflowStage: "invalid_property_status"
      });
    }

    next();
  } catch (error) {
    console.error('Payment workflow state verification error:', error);
    res.status(500).json({ 
      message: "Server error during workflow state verification",
      error: error.message 
    });
  }
};

/**
 * Middleware to prevent duplicate payments
 * Ensures only one pending payment exists per property
 */
export const preventDuplicatePayments = async (req, res, next) => {
  try {
    const property = req.property; // Set by verifyPropertyPaymentAccess

    // Check for existing pending payments
    const existingPayment = await Payment.findOne({
      property: property._id,
      status: { $in: ['pending', 'processing'] }
    });

    if (existingPayment) {
      return res.status(400).json({
        message: "A payment is already in progress for this property.",
        existingPayment: {
          id: existingPayment._id,
          transactionId: existingPayment.transactionId,
          status: existingPayment.status,
          amount: existingPayment.amount,
          paymentMethod: existingPayment.paymentMethod,
          createdAt: existingPayment.createdAt
        }
      });
    }

    next();
  } catch (error) {
    console.error('Duplicate payment prevention error:', error);
    res.status(500).json({ 
      message: "Server error during duplicate payment check",
      error: error.message 
    });
  }
};

/**
 * Middleware to validate payment amount
 * Ensures payment amount matches calculated fees
 */
export const validatePaymentAmount = async (req, res, next) => {
  try {
    const { amount } = req.body;
    const property = req.property; // Set by verifyPropertyPaymentAccess

    if (!amount || amount <= 0) {
      return res.status(400).json({
        message: "Invalid payment amount provided"
      });
    }

    // Import here to avoid circular dependency
    const PaymentCalculationService = (await import("../services/paymentCalculationService.js")).default;
    
    // Calculate expected amount
    const calculation = PaymentCalculationService.calculateRegistrationFee(property, req.user);
    const expectedAmount = calculation.summary.totalAmount;

    // Allow small variance for rounding differences
    const variance = Math.abs(amount - expectedAmount);
    const maxVariance = 1; // 1 ETB tolerance

    if (variance > maxVariance) {
      return res.status(400).json({
        message: "Payment amount does not match calculated fees",
        providedAmount: amount,
        expectedAmount: expectedAmount,
        variance: variance
      });
    }

    // Add calculation to request for use in controller
    req.paymentCalculation = calculation;
    next();
  } catch (error) {
    console.error('Payment amount validation error:', error);
    res.status(500).json({ 
      message: "Server error during payment amount validation",
      error: error.message 
    });
  }
};

/**
 * Middleware to rate limit payment attempts
 * Prevents rapid payment attempts that could indicate abuse
 */
export const rateLimitPaymentAttempts = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const timeWindow = 5 * 60 * 1000; // 5 minutes
    const maxAttempts = 5;

    // Count recent payment attempts
    const recentAttempts = await Payment.countDocuments({
      user: userId,
      createdAt: { $gte: new Date(Date.now() - timeWindow) }
    });

    if (recentAttempts >= maxAttempts) {
      return res.status(429).json({
        message: "Too many payment attempts. Please wait before trying again.",
        retryAfter: Math.ceil(timeWindow / 1000), // seconds
        maxAttempts,
        timeWindow: timeWindow / 1000 // seconds
      });
    }

    next();
  } catch (error) {
    console.error('Payment rate limiting error:', error);
    res.status(500).json({ 
      message: "Server error during rate limiting check",
      error: error.message 
    });
  }
};

/**
 * Middleware to log payment security events
 * Logs important payment-related security events for auditing
 */
export const logPaymentSecurityEvent = (eventType) => {
  return (req, res, next) => {
    try {
      const securityEvent = {
        timestamp: new Date(),
        eventType,
        userId: req.user?._id,
        userRole: req.user?.role,
        ip: req.ip || req.connection.remoteAddress,
        userAgent: req.get('User-Agent'),
        propertyId: req.params.propertyId || req.property?._id,
        paymentId: req.params.id,
        transactionId: req.params.transactionId
      };

      // In a production environment, this would be sent to a security logging service
      console.log('🔒 Payment Security Event:', securityEvent);

      next();
    } catch (error) {
      console.error('Payment security logging error:', error);
      // Don't fail the request due to logging errors
      next();
    }
  };
};

/**
 * Middleware to validate payment method
 * Ensures only supported payment methods are used
 */
export const validatePaymentMethod = (req, res, next) => {
  try {
    const supportedMethods = ['cbe_birr', 'telebirr', 'chapa', 'credit_card', 'bank_transfer'];
    const { paymentMethod } = req.body;

    if (paymentMethod && !supportedMethods.includes(paymentMethod)) {
      return res.status(400).json({
        message: "Unsupported payment method",
        supportedMethods
      });
    }

    next();
  } catch (error) {
    console.error('Payment method validation error:', error);
    res.status(500).json({ 
      message: "Server error during payment method validation",
      error: error.message 
    });
  }
};

/**
 * Combined middleware for payment initialization
 * Combines all necessary checks for payment initialization
 */
export const authorizePaymentInitialization = [
  verifyPropertyPaymentAccess,
  verifyPaymentWorkflowState,
  preventDuplicatePayments,
  rateLimitPaymentAttempts,
  validatePaymentMethod,
  logPaymentSecurityEvent('payment_initialization_attempt')
];

/**
 * Combined middleware for payment processing
 * Combines all necessary checks for payment processing
 */
export const authorizePaymentProcessing = [
  logPaymentSecurityEvent('payment_processing_attempt')
];

/**
 * Combined middleware for payment verification
 * Combines all necessary checks for payment verification
 */
export const authorizePaymentVerification = [
  verifyPaymentAccess,
  logPaymentSecurityEvent('payment_verification_attempt')
];
