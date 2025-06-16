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
} from "../controllers/paymentController.js";
import { authenticate, isAdmin, isLandOfficer } from "../middleware/auth.js";
import upload from "../config/multer.js";

const router = express.Router();

// @route   GET /api/payments
// @desc    Get all payments with filters
// @access  Private (Admin, Land Officer)
router.get("/", authenticate, isLandOfficer, getAllPayments);

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

// @route   GET /api/payments/pending
// @desc    Get all pending payments
// @access  Private (Admin, Land Officer)
router.get("/pending", authenticate, isLandOfficer, getPendingPayments);

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

// @route   POST /api/payments/:id/receipt
// @desc    Upload payment receipt
// @access  Private (User)
router.post(
  "/:id/receipt",
  authenticate,
  upload.single("receipt"),
  uploadPaymentReceipt
);

// @route   PUT /api/payments/:id/verify
// @desc    Verify a payment
// @access  Private (Admin, Land Officer)
router.put("/:id/verify", authenticate, isLandOfficer, verifyPayment);

// @route   PUT /api/payments/:id/reject
// @desc    Reject a payment
// @access  Private (Admin, Land Officer)
router.put(
  "/:id/reject",
  [
    authenticate,
    isLandOfficer,
    check("reason", "Reason for rejection is required").not().isEmpty(),
  ],
  rejectPayment
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
