import express from "express";
import { check } from "express-validator";
import {
  uploadDocument,
  getPropertyDocuments,
  getDocumentById,
  deleteDocument,
  updateDocument,
  getAllDocuments,
  getPendingDocuments,
  verifyDocument,
  rejectDocument,
  requestDocumentUpdate,
  downloadDocument,
  previewDocument,
} from "../controllers/documentController.js";
import { authenticate, isAdmin, isLandOfficer } from "../middleware/auth.js";
import upload from "../config/multer.js";

const router = express.Router();

// @route   GET /api/documents
// @desc    Get all documents with filters
// @access  Private (Admin, Land Officer)
router.get("/", authenticate, isLandOfficer, getAllDocuments);

// @route   POST /api/documents/property/:propertyId
// @desc    Upload a document for a property
// @access  Private (User)
router.post(
  "/property/:propertyId",
  authenticate,
  upload.single("file"),
  [
    check("documentType", "Document type is required").isIn([
      "title_deed",
      "id_copy",
      "application_form",
      "tax_clearance",
      "other",
    ]),
    check("documentName", "Document name is required").not().isEmpty(),
  ],
  uploadDocument
);

// @route   GET /api/documents/property/:propertyId
// @desc    Get all documents for a property
// @access  Private
router.get("/property/:propertyId", authenticate, getPropertyDocuments);

// @route   GET /api/documents/pending
// @desc    Get all pending documents for verification
// @access  Private (Admin, Land Officer)
router.get("/pending", authenticate, isLandOfficer, getPendingDocuments);

// @route   GET /api/documents/:id
// @desc    Get a document by ID
// @access  Private
router.get("/:id", authenticate, getDocumentById);

// @route   GET /api/documents/:id/download
// @desc    Download/view a document file
// @access  Private
router.get("/:id/download", authenticate, downloadDocument);

// @route   GET /api/documents/:id/preview
// @desc    Preview a document file (inline display)
// @access  Private
router.get("/:id/preview", authenticate, previewDocument);

// @route   PUT /api/documents/:id
// @desc    Update a document (replace with new file)
// @access  Private (User)
router.put("/:id", authenticate, upload.single("file"), updateDocument);

// @route   DELETE /api/documents/:id
// @desc    Delete a document
// @access  Private (User)
router.delete("/:id", authenticate, deleteDocument);

// @route   PUT /api/documents/:id/verify
// @desc    Verify a document
// @access  Private (Admin, Land Officer)
router.put("/:id/verify", authenticate, isLandOfficer, verifyDocument);

// @route   PUT /api/documents/:id/reject
// @desc    Reject a document
// @access  Private (Admin, Land Officer)
router.put(
  "/:id/reject",
  [
    authenticate,
    isLandOfficer,
    check("reason", "Reason for rejection is required").not().isEmpty(),
  ],
  rejectDocument
);

// @route   PUT /api/documents/:id/request-update
// @desc    Request document update
// @access  Private (Admin, Land Officer)
router.put(
  "/:id/request-update",
  [
    authenticate,
    isLandOfficer,
    check("reason", "Reason for update request is required").not().isEmpty(),
  ],
  requestDocumentUpdate
);

export default router;
