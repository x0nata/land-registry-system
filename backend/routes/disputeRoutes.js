import express from "express";
import { check } from "express-validator";
import {
  submitDispute,
  getUserDisputes,
  getDisputeById,
  withdrawDispute,
  addEvidence,
  getAllDisputes,
  getDisputeByIdAdmin,
  updateDisputeStatus,
  resolveDispute,
  assignDispute,
} from "../controllers/disputeController.js";
import { authenticate, isUser, isAdminOrLandOfficer, isAdmin } from "../middleware/auth.js";

const router = express.Router();

// @route   POST /api/disputes
// @desc    Submit a new dispute
// @access  Private (User)
router.post(
  "/",
  [
    authenticate,
    isUser,
    check("property", "Property ID is required").isMongoId(),
    check("disputeType", "Dispute type is required").isIn([
      "ownership_dispute",
      "boundary_dispute",
      "documentation_error",
      "fraudulent_registration",
      "inheritance_dispute",
      "other"
    ]),
    check("title", "Title is required").not().isEmpty().isLength({ max: 200 }),
    check("description", "Description is required").not().isEmpty().isLength({ max: 2000 }),
  ],
  submitDispute
);

// @route   GET /api/disputes/my-disputes
// @desc    Get user's disputes
// @access  Private (User)
router.get("/my-disputes", authenticate, isUser, getUserDisputes);

// @route   GET /api/disputes/:id
// @desc    Get dispute by ID
// @access  Private (User - only their own disputes)
router.get("/:id", authenticate, isUser, getDisputeById);

// @route   PUT /api/disputes/:id/withdraw
// @desc    Withdraw a dispute
// @access  Private (User - only their own disputes)
router.put(
  "/:id/withdraw",
  [
    authenticate,
    isUser,
    check("reason", "Withdrawal reason is required").optional().isLength({ max: 500 }),
  ],
  withdrawDispute
);

// @route   POST /api/disputes/:id/evidence
// @desc    Add evidence to dispute
// @access  Private (User - only their own disputes)
router.post(
  "/:id/evidence",
  [
    authenticate,
    isUser,
    check("documentType", "Document type is required").isIn([
      "legal_document",
      "photo",
      "witness_statement",
      "other"
    ]),
    check("documentName", "Document name is required").not().isEmpty(),
    check("fileId", "File ID is required").isMongoId(),
    check("filename", "Filename is required").not().isEmpty(),
    check("fileType", "File type is required").not().isEmpty(),
  ],
  addEvidence
);

// Admin/Land Officer Routes

// @route   GET /api/disputes/admin/all
// @desc    Get all disputes (Admin/Land Officer)
// @access  Private (Admin, Land Officer)
router.get("/admin/all", authenticate, isAdminOrLandOfficer, getAllDisputes);

// @route   GET /api/disputes/admin/:id
// @desc    Get dispute by ID (Admin/Land Officer)
// @access  Private (Admin, Land Officer)
router.get("/admin/:id", authenticate, isAdminOrLandOfficer, getDisputeByIdAdmin);

// @route   PUT /api/disputes/admin/:id/status
// @desc    Update dispute status (Admin/Land Officer)
// @access  Private (Admin, Land Officer)
router.put(
  "/admin/:id/status",
  [
    authenticate,
    isAdminOrLandOfficer,
    check("status", "Status is required").isIn([
      "submitted",
      "under_review",
      "investigation",
      "mediation",
      "resolved",
      "dismissed",
      "withdrawn"
    ]),
    check("notes", "Notes are required when updating status").not().isEmpty().isLength({ max: 1000 }),
  ],
  updateDisputeStatus
);

// @route   PUT /api/disputes/admin/:id/resolve
// @desc    Resolve a dispute (Admin/Land Officer)
// @access  Private (Admin, Land Officer)
router.put(
  "/admin/:id/resolve",
  [
    authenticate,
    isAdminOrLandOfficer,
    check("decision", "Decision is required").isIn([
      "in_favor_of_disputant",
      "in_favor_of_respondent",
      "compromise",
      "dismissed"
    ]),
    check("resolutionNotes", "Resolution notes are required").not().isEmpty().isLength({ max: 2000 }),
    check("actionRequired", "Action required field is optional").optional().isLength({ max: 1000 }),
  ],
  resolveDispute
);

// @route   PUT /api/disputes/admin/:id/assign
// @desc    Assign dispute to a land officer (Admin only)
// @access  Private (Admin)
router.put(
  "/admin/:id/assign",
  [
    authenticate,
    isAdmin,
    check("assignedTo", "Assigned to user ID is required").isMongoId(),
    check("notes", "Assignment notes are optional").optional().isLength({ max: 500 }),
  ],
  assignDispute
);

export default router;
