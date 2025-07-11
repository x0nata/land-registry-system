import Payment from "../models/Payment.js";
import Property from "../models/Property.js";
import ApplicationLog from "../models/ApplicationLog.js";
import { validationResult } from "express-validator";
import fs from "fs";
import chapaService from "../services/chapaService.js";

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
    // Check if Chapa is configured
    if (!chapaService.isConfigured()) {
      return res.status(503).json({
        message: "Payment service is not configured. Please contact administrator."
      });
    }

    const { propertyId } = req.params;
    const { returnUrl } = req.body;

    // Find property and verify ownership
    const property = await Property.findById(propertyId).populate('owner');
    if (!property) {
      return res.status(404).json({ message: "Property not found" });
    }

    if (property.owner._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Access denied. You can only pay for your own properties" });
    }

    // Check if documents are validated
    if (!property.documentsValidated) {
      return res.status(400).json({
        message: "Cannot proceed with payment. All documents must be validated first."
      });
    }

    // Check if payment already completed
    if (property.paymentCompleted) {
      return res.status(400).json({
        message: "Payment already completed for this property"
      });
    }

    // Calculate processing fee
    const amount = chapaService.calculateProcessingFee(property);

    // Generate unique transaction reference
    const txRef = chapaService.generateTxRef(propertyId, req.user._id.toString());

    // Prepare payment data
    const paymentData = {
      amount,
      currency: 'ETB',
      email: req.user.email,
      firstName: req.user.fullName.split(' ')[0],
      lastName: req.user.fullName.split(' ').slice(1).join(' ') || '',
      phoneNumber: req.user.phoneNumber,
      txRef,
      callbackUrl: `${process.env.BACKEND_URL}/api/payments/chapa/callback`,
      returnUrl: returnUrl || `${process.env.FRONTEND_URL}/property/${propertyId}`,
      customization: {
        title: 'Property Registration Payment',
        description: `Payment for property registration - Plot: ${property.plotNumber}`
      }
    };

    // Initialize payment with Chapa
    const chapaResponse = await chapaService.initializePayment(paymentData);

    // Create payment record
    const payment = await Payment.create({
      property: propertyId,
      user: req.user._id,
      amount,
      currency: 'ETB',
      paymentType: 'registration_fee',
      paymentMethod: 'chapa',
      transactionId: txRef,
      status: 'pending'
    });

    // Update property with transaction reference
    property.chapaTransactionRef = txRef;
    property.status = 'payment_pending';
    await property.save();

    // Add payment to property
    property.payments.push(payment._id);
    await property.save();

    // Create application log
    await ApplicationLog.create({
      property: propertyId,
      user: req.user._id,
      action: "payment_initiated",
      status: "payment_pending",
      performedBy: req.user._id,
      performedByRole: req.user.role,
      notes: `Chapa payment initiated - Amount: ${amount} ETB`
    });

    res.json({
      success: true,
      payment,
      checkoutUrl: chapaResponse.data.checkout_url,
      txRef
    });

  } catch (error) {
    console.error("Error initializing Chapa payment:", error);
    res.status(500).json({
      message: "Server error while initializing payment",
      error: error.message
    });
  }
};

// @desc    Handle Chapa payment callback/webhook
// @route   POST /api/payments/chapa/callback
// @access  Public (Webhook)
export const handleChapaCallback = async (req, res) => {
  try {
    const { trx_ref, ref_id, status } = req.body;

    if (!trx_ref) {
      return res.status(400).json({ message: "Transaction reference is required" });
    }

    // Find payment by transaction reference
    const payment = await Payment.findOne({ transactionId: trx_ref })
      .populate('property')
      .populate('user');

    if (!payment) {
      return res.status(404).json({ message: "Payment not found" });
    }

    // Verify payment with Chapa
    const verificationResult = await chapaService.verifyPayment(trx_ref);

    if (verificationResult.status === 'success' && verificationResult.data.status === 'success') {
      // Payment successful
      payment.status = 'completed';
      payment.verificationDate = new Date();
      await payment.save();

      // Update property status
      const property = payment.property;
      property.paymentCompleted = true;
      property.status = 'payment_completed';
      await property.save();

      // Create application log
      await ApplicationLog.create({
        property: property._id,
        user: payment.user._id,
        action: "payment_completed",
        status: "payment_completed",
        previousStatus: "payment_pending",
        performedBy: payment.user._id,
        performedByRole: payment.user.role,
        notes: `Chapa payment completed - Ref: ${ref_id}`
      });

      res.json({ success: true, message: "Payment verified successfully" });
    } else {
      // Payment failed
      payment.status = 'failed';
      await payment.save();

      // Update property status back to documents_validated
      const property = payment.property;
      property.status = 'documents_validated';
      await property.save();

      // Create application log
      await ApplicationLog.create({
        property: property._id,
        user: payment.user._id,
        action: "payment_failed",
        status: "documents_validated",
        previousStatus: "payment_pending",
        performedBy: payment.user._id,
        performedByRole: payment.user.role,
        notes: `Chapa payment failed - Ref: ${ref_id}`
      });

      res.json({ success: false, message: "Payment verification failed" });
    }

  } catch (error) {
    console.error("Error handling Chapa callback:", error);
    res.status(500).json({
      message: "Server error while processing payment callback",
      error: error.message
    });
  }
};

// @desc    Verify Chapa payment status
// @route   GET /api/payments/chapa/verify/:txRef
// @access  Private (User)
export const verifyChapaPayment = async (req, res) => {
  try {
    // Check if Chapa is configured
    if (!chapaService.isConfigured()) {
      return res.status(503).json({
        message: "Payment service is not configured. Please contact administrator."
      });
    }

    const { txRef } = req.params;

    // Find payment by transaction reference
    const payment = await Payment.findOne({ transactionId: txRef })
      .populate('property')
      .populate('user');

    if (!payment) {
      return res.status(404).json({ message: "Payment not found" });
    }

    // Verify ownership
    if (payment.user._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Access denied" });
    }

    // Verify payment with Chapa
    const verificationResult = await chapaService.verifyPayment(txRef);

    res.json({
      payment,
      chapaStatus: verificationResult.data,
      verified: verificationResult.status === 'success' && verificationResult.data.status === 'success'
    });

  } catch (error) {
    console.error("Error verifying Chapa payment:", error);
    res.status(500).json({
      message: "Server error while verifying payment",
      error: error.message
    });
  }
};
