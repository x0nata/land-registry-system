import express from "express";
import { check } from "express-validator";
import {
  getSystemSettings,
  updateSystemSettings,
  getFeeSettings,
  updateFeeSettings,
  getNotificationSettings,
  updateNotificationSettings,
  getSecuritySettings,
  updateSecuritySettings,
} from "../controllers/settingsController.js";
import { authenticate, isAdmin } from "../middleware/auth.js";

const router = express.Router();

// @route   GET /api/settings
// @desc    Get system settings
// @access  Admin
router.get("/", authenticate, isAdmin, getSystemSettings);

// @route   PUT /api/settings
// @desc    Update system settings
// @access  Admin
router.put(
  "/",
  [
    authenticate,
    isAdmin,
    check("systemName", "System name is required").optional().not().isEmpty(),
    check("contactEmail", "Please include a valid email").optional().isEmail(),
    check("contactPhone", "Phone number is required").optional().not().isEmpty(),
  ],
  updateSystemSettings
);

// @route   GET /api/settings/fees
// @desc    Get fee settings
// @access  Admin
router.get("/fees", authenticate, isAdmin, getFeeSettings);

// @route   PUT /api/settings/fees
// @desc    Update fee settings
// @access  Admin
router.put(
  "/fees",
  [
    authenticate,
    isAdmin,
    check("registrationFee", "Registration fee must be a number").optional().isNumeric(),
    check("documentVerificationFee", "Document verification fee must be a number").optional().isNumeric(),
    check("transferFee", "Transfer fee must be a number").optional().isNumeric(),
    check("certificateIssueFee", "Certificate issue fee must be a number").optional().isNumeric(),
  ],
  updateFeeSettings
);

// @route   GET /api/settings/notifications
// @desc    Get notification settings
// @access  Admin
router.get("/notifications", authenticate, isAdmin, getNotificationSettings);

// @route   PUT /api/settings/notifications
// @desc    Update notification settings
// @access  Admin
router.put("/notifications", authenticate, isAdmin, updateNotificationSettings);

// @route   GET /api/settings/security
// @desc    Get security settings
// @access  Admin
router.get("/security", authenticate, isAdmin, getSecuritySettings);

// @route   PUT /api/settings/security
// @desc    Update security settings
// @access  Admin
router.put("/security", authenticate, isAdmin, updateSecuritySettings);

export default router;
