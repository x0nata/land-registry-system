import express from "express";
import { check } from "express-validator";
import {
  initiateTransfer,
  getUserTransfers,
  getTransferById,
  cancelTransfer,
  uploadTransferDocuments,
  getAllTransfers,
  getTransferByIdAdmin,
  reviewTransferDocuments,
  performComplianceChecks,
  approveTransfer,
  completeTransfer,
} from "../controllers/transferController.js";
import { authenticate, isUser, isAdminOrLandOfficer, isAdmin } from "../middleware/auth.js";

const router = express.Router();

// @route   GET /api/transfers
// @desc    Get all transfers (Admin/Land Officer)
// @access  Private (Admin/Land Officer)
router.get("/", authenticate, isAdminOrLandOfficer, getAllTransfers);

// @route   POST /api/transfers
// @desc    Initiate property transfer
// @access  Private (User)
router.post(
  "/",
  [
    authenticate,
    isUser,
    check("property", "Property ID is required").isMongoId(),
    check("newOwnerEmail", "New owner email is required").isEmail(),
    check("transferType", "Transfer type is required").isIn([
      "sale",
      "inheritance",
      "gift",
      "court_order",
      "government_acquisition",
      "exchange",
      "other"
    ]),
    check("transferReason", "Transfer reason is required").not().isEmpty().isLength({ max: 1000 }),
    check("transferValue.amount", "Transfer value must be a positive number").optional().isFloat({ min: 0 }),
  ],
  initiateTransfer
);

// @route   GET /api/transfers/my-transfers
// @desc    Get user's transfers
// @access  Private (User)
router.get("/my-transfers", authenticate, isUser, getUserTransfers);

// @route   GET /api/transfers/:id
// @desc    Get transfer by ID
// @access  Private (User - only their own transfers)
router.get("/:id", authenticate, isUser, getTransferById);

// @route   GET /api/transfers/:id/admin
// @desc    Get transfer by ID (Admin/Land Officer version)
// @access  Private (Admin/Land Officer)
router.get("/:id/admin", authenticate, isAdminOrLandOfficer, getTransferByIdAdmin);

// @route   PUT /api/transfers/:id/cancel
// @desc    Cancel a transfer
// @access  Private (User - only previous owner)
router.put(
  "/:id/cancel",
  [
    authenticate,
    isUser,
    check("reason", "Cancellation reason is required").optional().isLength({ max: 500 }),
  ],
  cancelTransfer
);

// @route   POST /api/transfers/:id/documents
// @desc    Upload transfer documents
// @access  Private (User - only previous owner)
router.post(
  "/:id/documents",
  [
    authenticate,
    isUser,
    check("documents", "Documents array is required").isArray({ min: 1 }),
    check("documents.*.documentType", "Document type is required").isIn([
      "sale_agreement",
      "inheritance_certificate",
      "court_order",
      "id_documents",
      "tax_clearance",
      "valuation_report",
      "other"
    ]),
    check("documents.*.documentName", "Document name is required").not().isEmpty(),
    check("documents.*.fileId", "File ID is required").isMongoId(),
    check("documents.*.filename", "Filename is required").not().isEmpty(),
    check("documents.*.fileType", "File type is required").not().isEmpty(),
  ],
  uploadTransferDocuments
);

// @route   PUT /api/transfers/:id/review-documents
// @desc    Review transfer documents
// @access  Private (Admin/Land Officer)
router.put(
  "/:id/review-documents",
  [
    authenticate,
    isAdminOrLandOfficer,
    check("documentReviews", "Document reviews array is required").isArray({ min: 1 }),
    check("documentReviews.*.documentId", "Document ID is required").isMongoId(),
    check("documentReviews.*.status", "Review status is required").isIn(["approved", "rejected", "needs_revision"]),
    check("documentReviews.*.notes", "Review notes are required").not().isEmpty(),
  ],
  reviewTransferDocuments
);

// @route   PUT /api/transfers/:id/compliance
// @desc    Perform compliance checks
// @access  Private (Admin/Land Officer)
router.put(
  "/:id/compliance",
  [
    authenticate,
    isAdminOrLandOfficer,
    check("ethiopianLawCompliance.status", "Ethiopian law compliance status is required").optional().isIn(["compliant", "non_compliant", "pending"]),
    check("taxClearance.status", "Tax clearance status is required").optional().isIn(["compliant", "non_compliant", "pending"]),
    check("fraudPrevention.status", "Fraud prevention status is required").optional().isIn(["compliant", "non_compliant", "pending"]),
  ],
  performComplianceChecks
);

// @route   PUT /api/transfers/:id/approve
// @desc    Approve/Reject transfer
// @access  Private (Admin/Land Officer)
router.put(
  "/:id/approve",
  [
    authenticate,
    isAdminOrLandOfficer,
    check("approvalStatus", "Approval status is required").isIn(["approved", "rejected"]),
    check("notes", "Notes are required").not().isEmpty(),
  ],
  approveTransfer
);

// @route   PUT /api/transfers/:id/complete
// @desc    Complete transfer (change ownership)
// @access  Private (Admin)
router.put("/:id/complete", authenticate, isAdmin, completeTransfer);

export default router;
