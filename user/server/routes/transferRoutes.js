import express from "express";
import { check } from "express-validator";
import {
  initiateTransfer,
  getUserTransfers,
  getTransferById,
  cancelTransfer,
  uploadTransferDocuments,
} from "../controllers/transferController.js";
import { authenticate, isUser } from "../middleware/auth.js";

const router = express.Router();

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

export default router;
