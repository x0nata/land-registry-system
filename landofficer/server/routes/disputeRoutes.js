import express from "express";
import { check } from "express-validator";
import {
  getAllDisputes,
  getDisputeById,
  assignDispute,
  updateDisputeStatus,
  resolveDispute,
  rejectDispute,
} from "../controllers/disputeController.js";
import { authenticate, isAdmin, isLandOfficer } from "../middleware/auth.js";

const router = express.Router();

// @route   GET /api/disputes
// @desc    Get all disputes
// @access  Private (Admin/Land Officer)
router.get("/", authenticate, isLandOfficer, getAllDisputes);

// @route   GET /api/disputes/:id
// @desc    Get dispute by ID
// @access  Private (Admin/Land Officer)
router.get(
  "/:id",
  authenticate,
  isAdmin,
  isLandOfficer,
  getDisputeById
);

// @route   PUT /api/disputes/:id/assign
// @desc    Assign dispute to officer
// @access  Private (Admin)
router.put(
  "/:id/assign",
  [
    authenticate,
    isAdmin,
    check("assignedTo", "Assigned user ID is required").isMongoId(),
    check("priority", "Priority must be valid").optional().isIn(["low", "medium", "high", "urgent"]),
  ],
  assignDispute
);

// @route   PUT /api/disputes/:id/status
// @desc    Update dispute status
// @access  Private (Admin/Land Officer)
router.put(
  "/:id/status",
  [
    authenticate,
    isLandOfficer,
    check("status", "Status is required").isIn([
      "submitted",
      "under_review",
      "investigation",
      "mediation",
      "resolved",
      "rejected",
      "withdrawn"
    ]),
    check("notes", "Notes cannot exceed 500 characters").optional().isLength({ max: 500 }),
  ],
  updateDisputeStatus
);

// @route   PUT /api/disputes/:id/resolve
// @desc    Resolve dispute
// @access  Private (Admin/Land Officer)
router.put(
  "/:id/resolve",
  [
    authenticate,
    isLandOfficer,
    check("decision", "Decision is required").isIn([
      "in_favor_of_disputant",
      "in_favor_of_respondent",
      "compromise",
      "dismissed"
    ]),
    check("resolutionNotes", "Resolution notes are required").not().isEmpty().isLength({ max: 2000 }),
    check("actionRequired", "Action required cannot exceed 1000 characters").optional().isLength({ max: 1000 }),
  ],
  resolveDispute
);

// @route   PUT /api/disputes/:id/reject
// @desc    Reject dispute
// @access  Private (Admin/Land Officer)
router.put(
  "/:id/reject",
  [
    authenticate,
    isLandOfficer,
    check("rejectionReason", "Rejection reason is required").not().isEmpty().isLength({ max: 500 }),
  ],
  rejectDispute
);

export default router;
