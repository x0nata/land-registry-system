import Payment from "../models/Payment.js";
import Property from "../models/Property.js";
import ApplicationLog from "../models/ApplicationLog.js";
import User from "../models/User.js";
import { validationResult } from "express-validator";
import fs from "fs";
import PaymentCalculationService from "../services/paymentCalculationService.js";
import simulatedPaymentGateway from "../services/simulatedPaymentGateway.js";
import NotificationService from "../services/notificationService.js";
import crypto from "crypto";

// @desc    Create a new payment for a property
// @route   POST /api/payments/property/:propertyId
// @access  Private (User)
export const createPayment = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const property = await Property.findById(req.params.propertyId);

    if (!property) {
      return res.status(404).json({ message: "Property not found" });
    }

    // Check if user is the owner
    if (property.owner.toString() !== req.user._id.toString()) {
      return res
        .status(403)
        .json({ message: "Not authorized to make payments for this property" });
    }

    const { amount, currency, paymentType, paymentMethod, transactionId } =
      req.body;

    // Create payment
    const payment = await Payment.create({
      property: property._id,
      user: req.user._id,
      amount,
      currency: currency || "ETB",
      paymentType,
      paymentMethod,
      transactionId,
      status: "pending",
    });

    // Add payment to property
    property.payments.push(payment._id);
    await property.save();

    // Create application log
    await ApplicationLog.create({
      property: property._id,
      user: req.user._id,
      action: "payment_made",
      status: property.status,
      performedBy: req.user._id,
      performedByRole: req.user.role,
      notes: `Payment of ${amount} ${
        currency || "ETB"
      } made for ${paymentType}`,
    });

    res.status(201).json(payment);
  } catch (error) {
    console.error("Error creating payment:", error);
    res.status(500).json({ message: "Server error while creating payment" });
  }
};

// @desc    Get all payments for a property
// @route   GET /api/payments/property/:propertyId
// @access  Private
export const getPropertyPayments = async (req, res) => {
  try {
    const property = await Property.findById(req.params.propertyId);

    if (!property) {
      return res.status(404).json({ message: "Property not found" });
    }

    // Check if user is authorized to view payments
    if (
      property.owner.toString() !== req.user._id.toString() &&
      !["admin", "landOfficer"].includes(req.user.role)
    ) {
      return res
        .status(403)
        .json({ message: "Not authorized to view payments for this property" });
    }

    const payments = await Payment.find({ property: property._id }).sort({
      paymentDate: -1,
    });

    res.json(payments);
  } catch (error) {
    console.error("Error fetching property payments:", error);
    res.status(500).json({ message: "Server error while fetching payments" });
  }
};

// @desc    Get all payments for the current user
// @route   GET /api/payments/user
// @access  Private (User)
export const getUserPayments = async (req, res) => {
  try {
    const payments = await Payment.find({ user: req.user._id })
      .populate("property", "plotNumber location propertyType")
      .sort({ paymentDate: -1 });

    res.json(payments);
  } catch (error) {
    console.error("Error fetching user payments:", error);
    res.status(500).json({ message: "Server error while fetching payments" });
  }
};

// @desc    Get a payment by ID
// @route   GET /api/payments/:id
// @access  Private
export const getPaymentById = async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id)
      .populate("property")
      .populate("user", "fullName email nationalId")
      .populate("verifiedBy", "fullName email");

    if (!payment) {
      return res.status(404).json({ message: "Payment not found" });
    }

    // Check if user is authorized to view this payment
    if (
      payment.user._id.toString() !== req.user._id.toString() &&
      !["admin", "landOfficer"].includes(req.user.role)
    ) {
      return res
        .status(403)
        .json({ message: "Not authorized to view this payment" });
    }

    res.json(payment);
  } catch (error) {
    console.error("Error fetching payment:", error);
    res.status(500).json({ message: "Server error while fetching payment" });
  }
};

// @desc    Update payment status
// @route   PUT /api/payments/:id/status
// @access  Private (User)
export const updatePaymentStatus = async (req, res) => {
  try {
    const { status, transactionId } = req.body;

    // Validate status
    if (!["pending", "completed", "failed"].includes(status)) {
      return res.status(400).json({ message: "Invalid payment status" });
    }

    const payment = await Payment.findById(req.params.id);

    if (!payment) {
      return res.status(404).json({ message: "Payment not found" });
    }

    // Check if user is the owner
    if (payment.user.toString() !== req.user._id.toString()) {
      return res
        .status(403)
        .json({ message: "Not authorized to update this payment" });
    }

    // Update payment
    payment.status = status;
    if (transactionId) {
      payment.transactionId = transactionId;
    }

    const updatedPayment = await payment.save();

    // Create application log
    await ApplicationLog.create({
      property: payment.property,
      user: payment.user,
      action: `payment_${status}`,
      status: status,
      previousStatus: payment.status,
      performedBy: req.user._id,
      performedByRole: req.user.role,
      notes: `Payment status updated to ${status}`,
    });

    res.json(updatedPayment);
  } catch (error) {
    console.error("Error updating payment status:", error);
    res
      .status(500)
      .json({ message: "Server error while updating payment status" });
  }
};

// @desc    Upload payment receipt
// @route   POST /api/payments/:id/receipt
// @access  Private (User)
export const uploadPaymentReceipt = async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id);

    if (!payment) {
      return res.status(404).json({ message: "Payment not found" });
    }

    // Check if user is the owner
    if (payment.user.toString() !== req.user._id.toString()) {
      return res
        .status(403)
        .json({ message: "Not authorized to upload receipt for this payment" });
    }

    // Check if file was uploaded
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    // If there's an existing receipt, delete it from Cloudinary
    if (payment.receiptUrl) {
      const publicId = payment.receiptUrl.split("/").pop().split(".")[0];
      await cloudinary.uploader.destroy(`payment-receipts/${publicId}`);
    }

    // Upload file to Cloudinary
    const result = await cloudinary.uploader.upload(req.file.path, {
      folder: "payment-receipts",
      resource_type: "auto",
    });

    // Remove file from local storage
    fs.unlinkSync(req.file.path);

    // Update payment
    payment.receiptUrl = result.secure_url;
    payment.status = "pending"; // Reset to pending for verification

    const updatedPayment = await payment.save();

    // Create application log
    await ApplicationLog.create({
      property: payment.property,
      user: payment.user,
      action: "payment_receipt_uploaded",
      status: "pending",
      performedBy: req.user._id,
      performedByRole: req.user.role,
      notes: "Payment receipt uploaded",
    });

    res.json(updatedPayment);
  } catch (error) {
    console.error("Error uploading payment receipt:", error);
    res
      .status(500)
      .json({ message: "Server error while uploading payment receipt" });
  }
};

// @desc    Get all payments with filters (admin/land officer only)
// @route   GET /api/payments
// @access  Private (Admin, Land Officer)
export const getAllPayments = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      paymentType,
      paymentMethod,
      propertyId,
      userId,
      search,
      sortBy = 'paymentDate',
      sortOrder = 'desc'
    } = req.query;

    // Build query
    const query = {};

    // Filter by status if provided
    if (status) {
      query.status = status;
    }

    // Filter by payment type if provided
    if (paymentType) {
      query.paymentType = paymentType;
    }

    // Filter by payment method if provided
    if (paymentMethod) {
      query.paymentMethod = paymentMethod;
    }

    // Filter by property if provided
    if (propertyId) {
      query.property = propertyId;
    }

    // Filter by user if provided
    if (userId) {
      query.user = userId;
    }

    // Search by transaction ID
    if (search) {
      query.transactionId = { $regex: search, $options: 'i' };
    }

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Sort options
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Execute query
    const payments = await Payment.find(query)
      .populate('property', 'plotNumber location propertyType')
      .populate('user', 'fullName email nationalId')
      .populate('verifiedBy', 'fullName email')
      .skip(skip)
      .limit(parseInt(limit))
      .sort(sortOptions);

    // Get total count for pagination
    const total = await Payment.countDocuments(query);

    res.json({
      payments,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error("Error fetching payments:", error);
    res.status(500).json({ message: "Server error while fetching payments" });
  }
};

// @desc    Get all pending payments
// @route   GET /api/payments/pending
// @access  Private (Admin, Land Officer)
export const getPendingPayments = async (req, res) => {
  try {
    const pendingPayments = await Payment.find({ status: "pending" })
      .populate("property", "plotNumber location propertyType")
      .populate("user", "fullName email nationalId")
      .sort({ paymentDate: 1 });

    res.json(pendingPayments);
  } catch (error) {
    console.error("Error fetching pending payments:", error);
    res
      .status(500)
      .json({ message: "Server error while fetching pending payments" });
  }
};

// @desc    Verify a payment
// @route   PUT /api/payments/:id/verify
// @access  Private (Admin, Land Officer)
export const verifyPayment = async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id);

    if (!payment) {
      return res.status(404).json({ message: "Payment not found" });
    }

    // Update payment
    payment.status = "completed";
    payment.verifiedBy = req.user._id;
    payment.verificationDate = Date.now();
    payment.notes = req.body.notes || "";

    const updatedPayment = await payment.save();

    // Create application log
    await ApplicationLog.create({
      property: payment.property,
      user: payment.user,
      action: "payment_verified",
      status: "completed",
      previousStatus: "pending",
      performedBy: req.user._id,
      performedByRole: req.user.role,
      notes: req.body.notes || "Payment verified",
    });

    res.json(updatedPayment);
  } catch (error) {
    console.error("Error verifying payment:", error);
    res.status(500).json({ message: "Server error while verifying payment" });
  }
};

// @desc    Reject a payment
// @route   PUT /api/payments/:id/reject
// @access  Private (Admin, Land Officer)
export const rejectPayment = async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id);

    if (!payment) {
      return res.status(404).json({ message: "Payment not found" });
    }

    // Update payment
    payment.status = "failed";
    payment.verifiedBy = req.user._id;
    payment.verificationDate = Date.now();
    payment.notes = req.body.reason || "";

    const updatedPayment = await payment.save();

    // Create application log
    await ApplicationLog.create({
      property: payment.property,
      user: payment.user,
      action: "payment_rejected",
      status: "failed",
      previousStatus: "pending",
      performedBy: req.user._id,
      performedByRole: req.user.role,
      notes: req.body.reason || "Payment rejected",
    });

    res.json(updatedPayment);
  } catch (error) {
    console.error("Error rejecting payment:", error);
    res.status(500).json({ message: "Server error while rejecting payment" });
  }
};

// @desc    Initialize Chapa payment for property
// @route   POST /api/payments/chapa/initialize/:propertyId
// @access  Private (User)
export const initializeChapaPayment = async (req, res) => {
  try {
    // Chapa service is deprecated - redirect to CBE Birr or TeleBirr
    return res.status(503).json({
      message: "Chapa payment is no longer supported. Please use CBE Birr or TeleBirr payment methods.",
      supportedMethods: ["cbe_birr", "telebirr"]
    });
  } catch (error) {
    console.error("Error with Chapa payment:", error);
    res.status(500).json({
      message: "Chapa payment service is not available",
      error: error.message
    });
  }
};

// @desc    Handle Chapa payment callback/webhook
// @route   POST /api/payments/chapa/callback
// @access  Public (Webhook)
export const handleChapaCallback = async (req, res) => {
  try {
    // Chapa service is deprecated
    return res.status(503).json({
      message: "Chapa payment service is no longer supported"
    });

  } catch (error) {
    console.error("Error with Chapa callback:", error);
    res.status(500).json({
      message: "Chapa payment service is not available",
      error: error.message
    });
  }
};

// @desc    Verify Chapa payment status
// @route   GET /api/payments/chapa/verify/:txRef
// @access  Private (User)
export const verifyChapaPayment = async (req, res) => {
  try {
    // Chapa service is deprecated
    return res.status(503).json({
      message: "Chapa payment service is no longer supported. Please use CBE Birr or TeleBirr payment methods.",
      supportedMethods: ["cbe_birr", "telebirr"]
    });
  } catch (error) {
    console.error("Error with Chapa payment:", error);
    res.status(500).json({
      message: "Chapa payment service is not available",
      error: error.message
    });
  }
};

// @desc    Calculate payment amount for property registration
// @route   GET /api/payments/calculate/:propertyId
// @access  Private (User)
export const calculatePaymentAmount = async (req, res) => {
  try {
    const property = await Property.findById(req.params.propertyId).populate('owner');

    if (!property) {
      return res.status(404).json({ message: "Property not found" });
    }

    // Check if user is the owner
    if (property.owner._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        message: "Not authorized to calculate payment for this property"
      });
    }

    // Get calculation options from query parameters
    const options = {
      isFirstTimeOwner: req.query.firstTimeOwner === 'true',
      isVeteran: req.query.veteran === 'true',
      hasDisability: req.query.disability === 'true',
      isLowIncome: req.query.lowIncome === 'true',
    };

    // Calculate registration fee
    const calculation = PaymentCalculationService.calculateRegistrationFee(
      property,
      req.user,
      options
    );

    res.json({
      success: true,
      property: {
        id: property._id,
        plotNumber: property.plotNumber,
        propertyType: property.propertyType,
        area: property.area,
        location: property.location
      },
      calculation,
      paymentRequired: !property.paymentCompleted
    });
  } catch (error) {
    console.error("Error calculating payment amount:", error);
    res.status(500).json({
      message: "Server error while calculating payment amount",
      error: error.message
    });
  }
};

// @desc    Initialize CBE Birr payment
// @route   POST /api/payments/cbe-birr/initialize/:propertyId
// @access  Private (User)
export const initializeCBEBirrPayment = async (req, res) => {
  try {
    const property = await Property.findById(req.params.propertyId).populate('owner');

    if (!property) {
      return res.status(404).json({ message: "Property not found" });
    }

    // Check if user is the owner
    if (property.owner._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        message: "Not authorized to make payment for this property"
      });
    }

    // Check if documents are validated
    if (!property.documentsValidated) {
      return res.status(400).json({
        message: "Cannot process payment. Documents must be validated first."
      });
    }

    // Check if payment is already completed
    if (property.paymentCompleted) {
      return res.status(400).json({
        message: "Payment has already been completed for this property."
      });
    }

    // Calculate payment amount
    const calculation = PaymentCalculationService.calculateRegistrationFee(property, req.user);
    const amount = calculation.summary.totalAmount;

    // Generate transaction reference
    const transactionRef = `LR-${property._id}-${Date.now()}`;

    // Initialize CBE Birr payment
    const paymentData = {
      amount,
      currency: 'ETB',
      customerName: req.user.fullName,
      customerPhone: req.user.phoneNumber,
      customerEmail: req.user.email,
      description: `Property registration payment for plot ${property.plotNumber}`,
      callbackUrl: `${process.env.BACKEND_URL}/api/payments/cbe-birr/callback`,
      returnUrl: req.body.returnUrl || `${process.env.FRONTEND_URL}/property/${property._id}`,
      transactionRef
    };

    const gatewayResponse = await simulatedPaymentGateway.initializeCBEBirrPayment(paymentData);

    if (!gatewayResponse.success) {
      return res.status(500).json({
        message: "Failed to initialize CBE Birr payment",
        error: gatewayResponse.error
      });
    }

    // Create payment record
    const payment = await Payment.create({
      property: property._id,
      user: req.user._id,
      amount,
      currency: 'ETB',
      paymentType: 'registration_fee',
      paymentMethod: 'cbe_birr',
      transactionId: gatewayResponse.transactionId,
      status: 'pending',
      feeBreakdown: calculation.summary,
      paymentMethodDetails: {
        cbeTransactionRef: gatewayResponse.transactionId
      }
    });

    // Update property status
    property.status = 'payment_pending';
    property.payments.push(payment._id);
    await property.save();

    // Create application log
    await ApplicationLog.create({
      property: property._id,
      user: req.user._id,
      action: "cbe_payment_initiated",
      status: "payment_pending",
      performedBy: req.user._id,
      performedByRole: req.user.role,
      notes: `CBE Birr payment initiated - Amount: ${amount} ETB`
    });

    res.json({
      success: true,
      payment,
      paymentUrl: gatewayResponse.paymentUrl,
      transactionId: gatewayResponse.transactionId,
      expiresAt: gatewayResponse.expiresAt,
      instructions: gatewayResponse.instructions
    });
  } catch (error) {
    console.error("Error initializing CBE Birr payment:", error);
    res.status(500).json({
      message: "Server error while initializing CBE Birr payment",
      error: error.message
    });
  }
};

// @desc    Initialize TeleBirr payment
// @route   POST /api/payments/telebirr/initialize/:propertyId
// @access  Private (User)
export const initializeTeleBirrPayment = async (req, res) => {
  try {
    const property = await Property.findById(req.params.propertyId).populate('owner');

    if (!property) {
      return res.status(404).json({ message: "Property not found" });
    }

    // Check if user is the owner
    if (property.owner._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        message: "Not authorized to make payment for this property"
      });
    }

    // Check if documents are validated
    if (!property.documentsValidated) {
      return res.status(400).json({
        message: "Cannot process payment. Documents must be validated first."
      });
    }

    // Check if payment is already completed
    if (property.paymentCompleted) {
      return res.status(400).json({
        message: "Payment has already been completed for this property."
      });
    }

    // Calculate payment amount
    const calculation = PaymentCalculationService.calculateRegistrationFee(property, req.user);
    const amount = calculation.summary.totalAmount;

    // Generate transaction reference
    const transactionRef = `LR-TB-${property._id}-${Date.now()}`;

    // Initialize TeleBirr payment
    const paymentData = {
      amount,
      currency: 'ETB',
      customerName: req.user.fullName,
      customerPhone: req.user.phoneNumber,
      customerEmail: req.user.email,
      description: `Property registration payment for plot ${property.plotNumber}`,
      callbackUrl: `${process.env.BACKEND_URL}/api/payments/telebirr/callback`,
      returnUrl: req.body.returnUrl || `${process.env.FRONTEND_URL}/property/${property._id}`,
      transactionRef
    };

    const gatewayResponse = await simulatedPaymentGateway.initializeTeleBirrPayment(paymentData);

    if (!gatewayResponse.success) {
      return res.status(500).json({
        message: "Failed to initialize TeleBirr payment",
        error: gatewayResponse.error
      });
    }

    // Create payment record
    const payment = await Payment.create({
      property: property._id,
      user: req.user._id,
      amount,
      currency: 'ETB',
      paymentType: 'registration_fee',
      paymentMethod: 'telebirr',
      transactionId: gatewayResponse.transactionId,
      status: 'pending',
      feeBreakdown: calculation.summary,
      paymentMethodDetails: {
        telebirrPhoneNumber: req.user.phoneNumber,
        telebirrTransactionId: gatewayResponse.transactionId
      }
    });

    // Update property status
    property.status = 'payment_pending';
    property.payments.push(payment._id);
    await property.save();

    // Create application log
    await ApplicationLog.create({
      property: property._id,
      user: req.user._id,
      action: "telebirr_payment_initiated",
      status: "payment_pending",
      performedBy: req.user._id,
      performedByRole: req.user.role,
      notes: `TeleBirr payment initiated - Amount: ${amount} ETB`
    });

    res.json({
      success: true,
      payment,
      paymentUrl: gatewayResponse.paymentUrl,
      transactionId: gatewayResponse.transactionId,
      expiresAt: gatewayResponse.expiresAt,
      instructions: gatewayResponse.instructions
    });
  } catch (error) {
    console.error("Error initializing TeleBirr payment:", error);
    res.status(500).json({
      message: "Server error while initializing TeleBirr payment",
      error: error.message
    });
  }
};

// @desc    Process CBE Birr payment completion
// @route   POST /api/payments/cbe-birr/process/:transactionId
// @access  Public (called from payment interface)
export const processCBEBirrPayment = async (req, res) => {
  try {
    const { transactionId } = req.params;
    const { cbeAccountNumber, cbePin } = req.body;

    // Find payment by transaction ID
    const payment = await Payment.findOne({
      transactionId,
      paymentMethod: 'cbe_birr',
      status: 'pending'
    }).populate('property');

    if (!payment) {
      return res.status(404).json({
        message: "Payment transaction not found or already processed"
      });
    }

    // Process payment through gateway
    const processingResult = await simulatedPaymentGateway.processCBEBirrPayment(
      transactionId,
      { cbeAccountNumber, cbePin }
    );

    if (processingResult.success) {
      // Update payment status
      payment.status = 'completed';
      payment.completedDate = new Date();
      payment.paymentMethodDetails.cbeAccountNumber = cbeAccountNumber;
      payment.generateReceiptNumber();
      await payment.save();

      // Update property status
      const property = payment.property;
      property.paymentCompleted = true;
      property.status = 'payment_completed';
      await property.save();

      // Create application log
      await ApplicationLog.create({
        property: property._id,
        user: payment.user,
        action: "payment_completed",
        status: "payment_completed",
        previousStatus: "payment_pending",
        performedBy: payment.user,
        performedByRole: 'user',
        notes: `CBE Birr payment completed - Confirmation: ${processingResult.confirmationCode}`
      });

      // Send payment success notification
      const user = await User.findById(payment.user);
      await NotificationService.sendPaymentSuccessNotification(payment, property, user);

      // Send property ready for approval notification to land officers
      await NotificationService.sendPropertyReadyForApprovalNotification(property, user);

      res.json({
        success: true,
        message: "Payment completed successfully",
        payment: {
          id: payment._id,
          amount: payment.amount,
          currency: payment.currency,
          status: payment.status,
          receiptNumber: payment.receiptNumber,
          confirmationCode: processingResult.confirmationCode,
          completedAt: payment.completedDate
        }
      });
    } else {
      // Update payment status to failed
      payment.status = 'failed';
      payment.notes = processingResult.error;
      await payment.save();

      // Update property status back to documents_validated
      const property = payment.property;
      property.status = 'documents_validated';
      await property.save();

      // Create application log
      await ApplicationLog.create({
        property: property._id,
        user: payment.user,
        action: "payment_failed",
        status: "documents_validated",
        previousStatus: "payment_pending",
        performedBy: payment.user,
        performedByRole: 'user',
        notes: `CBE Birr payment failed - ${processingResult.error}`
      });

      // Send payment failure notification
      const user = await User.findById(payment.user);
      await NotificationService.sendPaymentFailedNotification(payment, property, user, processingResult.error);

      res.status(400).json({
        success: false,
        message: processingResult.error,
        transactionId
      });
    }
  } catch (error) {
    console.error("Error processing CBE Birr payment:", error);
    res.status(500).json({
      message: "Server error while processing CBE Birr payment",
      error: error.message
    });
  }
};

// @desc    Process TeleBirr payment completion
// @route   POST /api/payments/telebirr/process/:transactionId
// @access  Public (called from payment interface)
export const processTeleBirrPayment = async (req, res) => {
  try {
    const { transactionId } = req.params;
    const { telebirrPin } = req.body;

    // Find payment by transaction ID
    const payment = await Payment.findOne({
      transactionId,
      paymentMethod: 'telebirr',
      status: 'pending'
    }).populate('property');

    if (!payment) {
      return res.status(404).json({
        message: "Payment transaction not found or already processed"
      });
    }

    // Process payment through gateway
    const processingResult = await simulatedPaymentGateway.processTeleBirrPayment(
      transactionId,
      { telebirrPin }
    );

    if (processingResult.success) {
      // Update payment status
      payment.status = 'completed';
      payment.completedDate = new Date();
      payment.generateReceiptNumber();
      await payment.save();

      // Update property status
      const property = payment.property;
      property.paymentCompleted = true;
      property.status = 'payment_completed';
      await property.save();

      // Create application log
      await ApplicationLog.create({
        property: property._id,
        user: payment.user,
        action: "payment_completed",
        status: "payment_completed",
        previousStatus: "payment_pending",
        performedBy: payment.user,
        performedByRole: 'user',
        notes: `TeleBirr payment completed - Confirmation: ${processingResult.confirmationCode}`
      });

      // Send payment success notification
      const user = await User.findById(payment.user);
      await NotificationService.sendPaymentSuccessNotification(payment, property, user);

      // Send property ready for approval notification to land officers
      await NotificationService.sendPropertyReadyForApprovalNotification(property, user);

      res.json({
        success: true,
        message: "Payment completed successfully",
        payment: {
          id: payment._id,
          amount: payment.amount,
          currency: payment.currency,
          status: payment.status,
          receiptNumber: payment.receiptNumber,
          confirmationCode: processingResult.confirmationCode,
          completedAt: payment.completedDate
        }
      });
    } else {
      // Update payment status to failed
      payment.status = 'failed';
      payment.notes = processingResult.error;
      await payment.save();

      // Update property status back to documents_validated
      const property = payment.property;
      property.status = 'documents_validated';
      await property.save();

      // Create application log
      await ApplicationLog.create({
        property: property._id,
        user: payment.user,
        action: "payment_failed",
        status: "documents_validated",
        previousStatus: "payment_pending",
        performedBy: payment.user,
        performedByRole: 'user',
        notes: `TeleBirr payment failed - ${processingResult.error}`
      });

      // Send payment failure notification
      const user = await User.findById(payment.user);
      await NotificationService.sendPaymentFailedNotification(payment, property, user, processingResult.error);

      res.status(400).json({
        success: false,
        message: processingResult.error,
        transactionId
      });
    }
  } catch (error) {
    console.error("Error processing TeleBirr payment:", error);
    res.status(500).json({
      message: "Server error while processing TeleBirr payment",
      error: error.message
    });
  }
};

// @desc    Generate payment receipt
// @route   GET /api/payments/:id/receipt
// @access  Private
export const generatePaymentReceipt = async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id)
      .populate('property', 'plotNumber location propertyType area')
      .populate('user', 'fullName email phoneNumber nationalId');

    if (!payment) {
      return res.status(404).json({ message: "Payment not found" });
    }

    // Check authorization
    if (
      payment.user._id.toString() !== req.user._id.toString() &&
      !["admin", "landOfficer"].includes(req.user.role)
    ) {
      return res.status(403).json({
        message: "Not authorized to view this receipt"
      });
    }

    if (payment.status !== 'completed') {
      return res.status(400).json({
        message: "Receipt can only be generated for completed payments"
      });
    }

    // Generate receipt data
    const receiptData = {
      receiptNumber: payment.receiptNumber,
      paymentId: payment._id,
      transactionId: payment.transactionId,
      paymentDate: payment.completedDate || payment.paymentDate,
      amount: payment.amount,
      currency: payment.currency,
      paymentMethod: payment.paymentMethod,
      paymentType: payment.paymentType,
      feeBreakdown: payment.feeBreakdown,
      property: {
        plotNumber: payment.property.plotNumber,
        location: payment.property.location,
        propertyType: payment.property.propertyType,
        area: payment.property.area
      },
      customer: {
        name: payment.user.fullName,
        email: payment.user.email,
        phone: payment.user.phoneNumber,
        nationalId: payment.user.nationalId
      },
      generatedAt: new Date(),
      officialStamp: "Ethiopian Land Registry Authority"
    };

    res.json({
      success: true,
      receipt: receiptData
    });
  } catch (error) {
    console.error("Error generating payment receipt:", error);
    res.status(500).json({
      message: "Server error while generating receipt",
      error: error.message
    });
  }
};

// @desc    Get payment statistics
// @route   GET /api/payments/stats
// @access  Private
export const getPaymentStatistics = async (req, res) => {
  try {
    const userId = req.user.role === 'user' ? req.user._id : null;
    const stats = await Payment.getPaymentStats(userId);

    // Get additional statistics
    const recentPayments = await Payment.find(
      userId ? { user: userId } : {}
    )
      .populate('property', 'plotNumber propertyType')
      .sort({ paymentDate: -1 })
      .limit(5);

    const paymentMethodStats = await Payment.aggregate([
      ...(userId ? [{ $match: { user: userId } }] : []),
      {
        $group: {
          _id: '$paymentMethod',
          count: { $sum: 1 },
          totalAmount: { $sum: '$amount' }
        }
      }
    ]);

    res.json({
      success: true,
      statistics: stats,
      recentPayments,
      paymentMethodBreakdown: paymentMethodStats
    });
  } catch (error) {
    console.error("Error fetching payment statistics:", error);
    res.status(500).json({
      message: "Server error while fetching payment statistics",
      error: error.message
    });
  }
};

// @desc    Verify payment status by transaction ID
// @route   GET /api/payments/verify/:transactionId
// @access  Private
export const verifyPaymentStatus = async (req, res) => {
  try {
    const { transactionId } = req.params;

    // Find payment in database
    const payment = await Payment.findOne({ transactionId })
      .populate('property', 'plotNumber status')
      .populate('user', 'fullName email');

    if (!payment) {
      return res.status(404).json({
        message: "Payment transaction not found"
      });
    }

    // Check authorization
    if (
      payment.user._id.toString() !== req.user._id.toString() &&
      !["admin", "landOfficer"].includes(req.user.role)
    ) {
      return res.status(403).json({
        message: "Not authorized to verify this payment"
      });
    }

    // Verify with payment gateway if needed
    let gatewayVerification = null;
    if (['cbe_birr', 'telebirr'].includes(payment.paymentMethod)) {
      gatewayVerification = await simulatedPaymentGateway.verifyPayment(transactionId);
    }

    res.json({
      success: true,
      payment: {
        id: payment._id,
        transactionId: payment.transactionId,
        status: payment.status,
        amount: payment.amount,
        currency: payment.currency,
        paymentMethod: payment.paymentMethod,
        paymentDate: payment.paymentDate,
        completedDate: payment.completedDate,
        receiptNumber: payment.receiptNumber,
        property: payment.property,
        user: payment.user
      },
      gatewayVerification
    });
  } catch (error) {
    console.error("Error verifying payment status:", error);
    res.status(500).json({
      message: "Server error while verifying payment status",
      error: error.message
    });
  }
};
