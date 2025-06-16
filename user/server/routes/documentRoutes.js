import express from "express";
import { check } from "express-validator";
import {
  uploadDocument,
  getPropertyDocuments,
  getDocumentById,
  deleteDocument,
  updateDocument,
  downloadDocument,
  previewDocument,
} from "../controllers/documentController.js";
import { authenticate, isUser } from "../middleware/auth.js";
import upload from "../config/multer.js";

const router = express.Router();



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



// @route   GET /api/documents/:id
// @desc    Get a document by ID
// @access  Private
router.get("/:id", authenticate, getDocumentById);

// @route   GET /api/documents/:id/download
// @desc    Download/view a document file
// @access  Private
router.get("/:id/download", authenticate, downloadDocument);

// @route   GET /api/documents/:id/preview
// @desc    Preview a document file (inline view)
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

// @route   GET /api/documents/health
// @desc    Health check for document service
// @access  Private
router.get("/health", authenticate, (req, res) => {
  try {
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      user: req.user._id,
      message: 'Document service is running'
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
});

export default router;
