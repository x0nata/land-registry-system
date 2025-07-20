import express from "express";
import { check } from "express-validator";
import {
  registerProperty,
  getUserProperties,
  getPropertyById,
  updateProperty,
  deleteProperty,
  getAllProperties,
  getPendingProperties,
  getAssignedProperties,
  approveProperty,
  rejectProperty,
  setPropertyUnderReview,
  getPropertyTransferHistory,
  getPropertyPaymentRequirements,
  markPropertyPaymentCompleted,
} from "../controllers/propertyController.js";
import { authenticate, isUser, isAdminOrLandOfficer } from "../middleware/auth.js";
import { dashboardCache } from "../middleware/cache.js";

const router = express.Router();

// @route   GET /api/properties
// @desc    Get all properties (admin/land officer)
// @access  Private (Admin, Land Officer)
router.get("/", authenticate, isAdminOrLandOfficer, getAllProperties);

// @route   GET /api/properties/pending
// @desc    Get pending properties for review
// @access  Private (Admin, Land Officer)
router.get("/pending", authenticate, isAdminOrLandOfficer, dashboardCache, getPendingProperties);

// @route   GET /api/properties/assigned
// @desc    Get properties assigned to the current land officer
// @access  Private (Land Officer)
router.get("/assigned", authenticate, isAdminOrLandOfficer, getAssignedProperties);

// @route   POST /api/properties
// @desc    Register a new property
// @access  Private (User)
router.post(
  "/",
  [
    authenticate,
    check("location.kebele", "Kebele is required").not().isEmpty(),
    check("location.subCity", "Sub-city is required").not().isEmpty(),
    check("plotNumber", "Plot number is required").not().isEmpty(),
    check("area", "Area must be a positive number").isFloat({ min: 0 }),
    check("propertyType", "Property type is required").isIn([
      "residential",
      "commercial",
      "industrial",
      "agricultural",
    ]),
  ],
  registerProperty
);

// @route   GET /api/properties/user
// @desc    Get all properties for the current user
// @access  Private (User)
router.get("/user", authenticate, getUserProperties);

// @route   GET /api/properties/:id
// @desc    Get a property by ID
// @access  Private
router.get("/:id", authenticate, getPropertyById);

// @route   GET /api/properties/:id/transfers
// @desc    Get property transfer history
// @access  Private (Admin, Land Officer)
router.get("/:id/transfers", authenticate, isAdminOrLandOfficer, getPropertyTransferHistory);

// @route   PUT /api/properties/:id
// @desc    Update a property
// @access  Private (User)
router.put(
  "/:id",
  [
    authenticate,
    check("location.kebele", "Kebele is required").optional().not().isEmpty(),
    check("location.subCity", "Sub-city is required")
      .optional()
      .not()
      .isEmpty(),
    check("area", "Area must be a positive number")
      .optional()
      .isFloat({ min: 0 }),
    check("propertyType", "Property type is required")
      .optional()
      .isIn(["residential", "commercial", "industrial", "agricultural"]),
  ],
  updateProperty
);

// @route   PUT /api/properties/:id/approve
// @desc    Approve a property
// @access  Private (Admin, Land Officer)
router.put("/:id/approve", authenticate, isAdminOrLandOfficer, approveProperty);

// @route   PUT /api/properties/:id/reject
// @desc    Reject a property
// @access  Private (Admin, Land Officer)
router.put("/:id/reject", authenticate, isAdminOrLandOfficer, rejectProperty);

// @route   PUT /api/properties/:id/review
// @desc    Set property status to under review
// @access  Private (Admin, Land Officer)
router.put("/:id/review", authenticate, isAdminOrLandOfficer, setPropertyUnderReview);

// @route   DELETE /api/properties/:id
// @desc    Delete a property
// @access  Private (User)
router.delete("/:id", authenticate, deleteProperty);

// @route   GET /api/properties/:id/payment-requirements
// @desc    Check property payment requirements and workflow status
// @access  Private (User, Admin, Land Officer)
router.get("/:id/payment-requirements", authenticate, getPropertyPaymentRequirements);

// @route   PUT /api/properties/:id/payment-completed
// @desc    Update property status after payment completion
// @access  Private (Internal - called by payment system)
router.put("/:id/payment-completed", authenticate, markPropertyPaymentCompleted);

export default router;
