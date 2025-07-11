import express from "express";
import { check } from "express-validator";
import {
  submitDispute,
  getUserDisputes,
  getDisputeById,
  withdrawDispute,
  addEvidence,
} from "../controllers/disputeController.js";
import { authenticate, isUser } from "../middleware/auth.js";

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

export default router;
