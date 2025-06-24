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
} from "../controllers/propertyController.js";
import { authenticate, isAdmin, isLandOfficer, isOwnerOrLandOfficerOrAdmin } from "../middleware/auth.js";
import Property from "../models/Property.js";
import Document from "../models/Document.js";
import ApplicationLog from "../models/ApplicationLog.js";

const router = express.Router();

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

// @route   GET /api/properties/pending
// @desc    Get pending properties for review
// @access  Private (Admin, Land Officer)
router.get("/pending", authenticate, isLandOfficer, getPendingProperties);

// @route   GET /api/properties/assigned
// @desc    Get properties assigned to the current land officer
// @access  Private (Land Officer)
router.get("/assigned", authenticate, isLandOfficer, getAssignedProperties);

// @route   GET /api/properties
// @desc    Get all properties (admin/land officer)
// @access  Private (Admin, Land Officer)
router.get("/", authenticate, isLandOfficer, getAllProperties);

// @route   GET /api/properties/:id
// @desc    Get a property by ID
// @access  Private (User)
router.get("/:id", authenticate, getPropertyById);

// @route   GET /api/properties/:id/transfers
// @desc    Get property transfer history
// @access  Private (Admin, Land Officer, Owner)
router.get("/:id/transfers", authenticate, isOwnerOrLandOfficerOrAdmin, getPropertyTransferHistory);

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

// @route   DELETE /api/properties/:id
// @desc    Delete a property
// @access  Private (User)
router.delete("/:id", authenticate, deleteProperty);

// @route   PUT /api/properties/:id/approve
// @desc    Approve a property
// @access  Private (Admin, Land Officer)
router.put("/:id/approve", authenticate, isLandOfficer, approveProperty);

// @route   PUT /api/properties/:id/reject
// @desc    Reject a property
// @access  Private (Admin, Land Officer)
router.put(
  "/:id/reject",
  [
    authenticate,
    isLandOfficer,
    check("reason", "Reason for rejection is required").not().isEmpty(),
  ],
  rejectProperty
);

// @route   PUT /api/properties/:id/review
// @desc    Set property status to under review
// @access  Private (Admin, Land Officer)
router.put("/:id/review", authenticate, isLandOfficer, setPropertyUnderReview);

// @route   PUT /api/properties/:propertyId/documents/:documentId/verify
// @desc    Verify a document for a property
// @access  Private (Admin, Land Officer)
router.put(
  "/:propertyId/documents/:documentId/verify",
  [
    authenticate,
    isLandOfficer,
    check("verified", "Verified status is required").isBoolean(),
    check("notes", "Notes must be a string").optional().isString(),
  ],
  async (req, res) => {
    try {
      const { propertyId, documentId } = req.params;
      const { verified, notes } = req.body;

      // Find the property
      const property = await Property.findById(propertyId).populate("documents");
      if (!property) {
        return res.status(404).json({ message: "Property not found" });
      }

      // Find the document
      const document = await Document.findById(documentId);
      if (!document) {
        return res.status(404).json({ message: "Document not found" });
      }

      // Verify the document belongs to this property
      if (document.property.toString() !== propertyId) {
        return res.status(400).json({ message: "Document does not belong to this property" });
      }

      // Update document verification status
      document.verified = verified;
      document.verificationNotes = notes || "";
      document.verifiedBy = req.user._id;
      document.verificationDate = new Date();

      await document.save();

      // Create application log
      await ApplicationLog.create({
        property: propertyId,
        user: property.owner,
        action: verified ? "document_verified" : "document_rejected",
        status: verified ? "verified" : "rejected",
        performedBy: req.user._id,
        performedByRole: req.user.role,
        notes: notes || `Document ${verified ? 'verified' : 'rejected'}: ${document.documentName}`,
      });

      res.json({
        message: `Document ${verified ? 'verified' : 'rejected'} successfully`,
        document,
      });
    } catch (error) {
      console.error("Error verifying document:", error);
      res.status(500).json({ message: "Server error while verifying document" });
    }
  }
);

export default router;
