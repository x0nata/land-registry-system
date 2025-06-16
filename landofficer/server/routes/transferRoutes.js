import express from "express";
import { check } from "express-validator";
import {
  getAllTransfers,
  getTransferById,
  reviewTransferDocuments,
  performComplianceChecks,
  approveTransfer,
  completeTransfer,
} from "../controllers/transferController.js";
import { authenticate, isAdmin, isLandOfficer } from "../middleware/auth.js";

const router = express.Router();

// @route   GET /api/transfers
// @desc    Get all transfers
// @access  Private (Admin/Land Officer)
router.get("/", authenticate, isLandOfficer, getAllTransfers);

// @route   GET /api/transfers/:id
// @desc    Get transfer by ID
// @access  Private (Admin/Land Officer)
router.get("/:id", authenticate, isLandOfficer, getTransferById);

// @route   PUT /api/transfers/:id/review-documents
// @desc    Review transfer documents
// @access  Private (Admin/Land Officer)
router.put(
  "/:id/review-documents",
  [
    authenticate,
    isLandOfficer,
    check("documentReviews", "Document reviews array is required").isArray({ min: 1 }),
    check("documentReviews.*.documentId", "Document ID is required").isMongoId(),
    check("documentReviews.*.status", "Document status is required").isIn(["verified", "rejected"]),
    check("documentReviews.*.notes", "Review notes cannot exceed 500 characters").optional().isLength({ max: 500 }),
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
    isLandOfficer,
    check("ethiopianLawCompliance.notes", "Ethiopian law compliance notes cannot exceed 500 characters").optional().isLength({ max: 500 }),
    check("taxClearance.notes", "Tax clearance notes cannot exceed 500 characters").optional().isLength({ max: 500 }),
    check("fraudPrevention.riskLevel", "Risk level must be valid").optional().isIn(["low", "medium", "high"]),
    check("fraudPrevention.notes", "Fraud prevention notes cannot exceed 500 characters").optional().isLength({ max: 500 }),
  ],
  performComplianceChecks
);

// @route   PUT /api/transfers/:id/approve
// @desc    Approve or reject transfer
// @access  Private (Admin/Land Officer)
router.put(
  "/:id/approve",
  [
    authenticate,
    isLandOfficer,
    check("approvalStatus", "Approval status is required").isIn(["approved", "rejected"]),
    check("notes", "Notes cannot exceed 500 characters").optional().isLength({ max: 500 }),
  ],
  approveTransfer
);

// @route   PUT /api/transfers/:id/complete
// @desc    Complete transfer (change ownership)
// @access  Private (Admin)
router.put("/:id/complete", authenticate, isAdmin, completeTransfer);

export default router;
