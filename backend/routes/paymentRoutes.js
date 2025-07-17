import express from "express";
import { check } from "express-validator";
import {
  createPayment,
  getPropertyPayments,
  getUserPayments,
  getPaymentById,
  updatePaymentStatus,
  uploadPaymentReceipt,
  getAllPayments,
  getPendingPayments,
  verifyPayment,
  rejectPayment,
  initializeChapaPayment,
  handleChapaCallback,
  verifyChapaPayment,
  calculatePaymentAmount,
  initializeCBEBirrPayment,
  initializeTeleBirrPayment,
  processCBEBirrPayment,
  processTeleBirrPayment,
  generatePaymentReceipt,
  getPaymentStatistics,
  verifyPaymentStatus,
} from "../controllers/paymentController.js";
import { authenticate, isUser, isAdminOrLandOfficer } from "../middleware/auth.js";
import { upload } from "../config/multer.js";
import { check } from "express-validator";
import {
  authorizePaymentInitialization,
  authorizePaymentProcessing,
  authorizePaymentVerification,
  verifyPaymentAccess
} from "../middleware/paymentAuth.js";

const router = express.Router();

// @route   GET /api/payments
// @desc    Get all payments with filters (admin/land officer only)
// @access  Private (Admin, Land Officer)
router.get("/", authenticate, isAdminOrLandOfficer, getAllPayments);

// @route   GET /api/payments/pending
// @desc    Get all pending payments
// @access  Private (Admin, Land Officer)
router.get("/pending", authenticate, isAdminOrLandOfficer, getPendingPayments);

// @route   POST /api/payments/property/:propertyId
// @desc    Create a new payment for a property
// @access  Private (User)
router.post(
  "/property/:propertyId",
  [
    authenticate,
    check("amount", "Amount must be a positive number").isFloat({ min: 0 }),
    check("currency", "Currency is required").optional().isIn(["ETB", "USD"]),
    check("paymentType", "Payment type is required").isIn([
      "registration_fee",
      "tax",
      "transfer_fee",
      "other",
    ]),
    check("paymentMethod", "Payment method is required").isIn([
      "cbe_birr",
      "telebirr",
      "credit_card",
      "bank_transfer",
      "cash",
    ]),
    check("transactionId", "Transaction ID is required")
      .optional()
      .not()
      .isEmpty(),
  ],
  createPayment
);

// @route   GET /api/payments/property/:propertyId
// @desc    Get all payments for a property
// @access  Private
router.get("/property/:propertyId", authenticate, getPropertyPayments);

// @route   GET /api/payments/user
// @desc    Get all payments for the current user
// @access  Private (User)
router.get("/user", authenticate, getUserPayments);

// Payment Calculation and Statistics Routes (must be before /:id routes)

// @route   GET /api/payments/calculate/:propertyId
// @desc    Calculate payment amount for property registration
// @access  Private (User)
router.get("/calculate/:propertyId", authenticate, calculatePaymentAmount);

// @route   GET /api/payments/stats
// @desc    Get payment statistics
// @access  Private
router.get("/stats", authenticate, getPaymentStatistics);

// @route   GET /api/payments/verify/:transactionId
// @desc    Verify payment status by transaction ID
// @access  Private
router.get("/verify/:transactionId", authenticate, ...authorizePaymentVerification, verifyPaymentStatus);

// @route   GET /api/payments/:id
// @desc    Get a payment by ID
// @access  Private
router.get("/:id", authenticate, getPaymentById);

// @route   PUT /api/payments/:id/status
// @desc    Update payment status
// @access  Private (User)
router.put(
  "/:id/status",
  [
    authenticate,
    check("status", "Status is required").isIn([
      "pending",
      "completed",
      "failed",
    ]),
    check("transactionId", "Transaction ID is required")
      .optional()
      .not()
      .isEmpty(),
  ],
  updatePaymentStatus
);

// @route   PUT /api/payments/:id/verify
// @desc    Verify a payment
// @access  Private (Admin, Land Officer)
router.put("/:id/verify", authenticate, isAdminOrLandOfficer, verifyPayment);

// @route   PUT /api/payments/:id/reject
// @desc    Reject a payment
// @access  Private (Admin, Land Officer)
router.put("/:id/reject", authenticate, isAdminOrLandOfficer, rejectPayment);

// @route   POST /api/payments/:id/receipt
// @desc    Upload payment receipt
// @access  Private (User)
router.post(
  "/:id/receipt",
  authenticate,
  upload.single("receipt"),
  uploadPaymentReceipt
);

// @route   GET /api/payments/:id/receipt
// @desc    Generate payment receipt
// @access  Private
router.get("/:id/receipt", authenticate, verifyPaymentAccess, generatePaymentReceipt);

// Ethiopian Payment Methods Routes

// @route   POST /api/payments/cbe-birr/initialize/:propertyId
// @desc    Initialize CBE Birr payment for property
// @access  Private (User)
router.post(
  "/cbe-birr/initialize/:propertyId",
  [
    authenticate,
    ...authorizePaymentInitialization,
    check("returnUrl", "Return URL must be a valid URL").optional().isURL(),
  ],
  initializeCBEBirrPayment
);

// @route   POST /api/payments/cbe-birr/process/:transactionId
// @desc    Process CBE Birr payment completion
// @access  Public (called from payment interface)
router.post(
  "/cbe-birr/process/:transactionId",
  [
    ...authorizePaymentProcessing,
    check("cbeAccountNumber", "CBE account number is required").not().isEmpty(),
    check("cbePin", "CBE PIN is required").isLength({ min: 4 }),
  ],
  processCBEBirrPayment
);

// @route   POST /api/payments/telebirr/initialize/:propertyId
// @desc    Initialize TeleBirr payment for property
// @access  Private (User)
router.post(
  "/telebirr/initialize/:propertyId",
  [
    authenticate,
    ...authorizePaymentInitialization,
    check("returnUrl", "Return URL must be a valid URL").optional().isURL(),
  ],
  initializeTeleBirrPayment
);

// @route   POST /api/payments/telebirr/process/:transactionId
// @desc    Process TeleBirr payment completion
// @access  Public (called from payment interface)
router.post(
  "/telebirr/process/:transactionId",
  [
    ...authorizePaymentProcessing,
    check("telebirrPin", "TeleBirr PIN is required").isLength({ min: 4 }),
  ],
  processTeleBirrPayment
);

// Chapa Payment Routes

// @route   POST /api/payments/chapa/initialize/:propertyId
// @desc    Initialize Chapa payment for property
// @access  Private (User)
router.post(
  "/chapa/initialize/:propertyId",
  [
    authenticate,
    check("returnUrl", "Return URL must be a valid URL").optional().isURL(),
  ],
  initializeChapaPayment
);

// @route   POST /api/payments/chapa/callback
// @desc    Handle Chapa payment callback/webhook
// @access  Public (Webhook)
router.post("/chapa/callback", handleChapaCallback);

// @route   GET /api/payments/chapa/verify/:txRef
// @desc    Verify Chapa payment status
// @access  Private (User)
router.get("/chapa/verify/:txRef", authenticate, verifyChapaPayment);

export default router;
