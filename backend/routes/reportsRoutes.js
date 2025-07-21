import express from "express";
import {
  getPropertyStats,
  getUserStats,
  getDocumentStats,
  getPaymentStats,
  generateApplicationReport,
  generateSummaryReport,
  downloadReport,
  getActivityLogs,
  getPerformanceMetrics,
} from "../controllers/reportsController.js";
import { authenticate, isAdmin, isAdminOrLandOfficer } from "../middleware/auth.js";

const router = express.Router();

// @route   GET /api/reports/properties
// @desc    Get property statistics
// @access  Admin, Land Officer
router.get("/properties", authenticate, isAdminOrLandOfficer, getPropertyStats);

// @route   GET /api/reports/users
// @desc    Get user statistics
// @access  Admin
router.get("/users", authenticate, isAdmin, getUserStats);

// @route   GET /api/reports/documents
// @desc    Get document statistics
// @access  Admin, Land Officer
router.get("/documents", authenticate, isAdminOrLandOfficer, getDocumentStats);

// @route   GET /api/reports/payments
// @desc    Get payment statistics
// @access  Admin, Land Officer
router.get("/payments", authenticate, isAdminOrLandOfficer, getPaymentStats);

// @route   GET /api/reports/applications
// @desc    Generate application statistics report
// @access  Admin, Land Officer
router.get("/applications", authenticate, isAdminOrLandOfficer, generateApplicationReport);

// @route   GET /api/reports/summary
// @desc    Generate summary report
// @access  Admin
router.get("/summary", authenticate, isAdmin, generateSummaryReport);

// @route   GET /api/reports/:reportType/download
// @desc    Download report as PDF/Excel
// @access  Admin
router.get("/:reportType/download", authenticate, isAdmin, downloadReport);

// @route   GET /api/reports/activity
// @desc    Get activity logs for reports
// @access  Admin, Land Officer
router.get("/activity", authenticate, isAdminOrLandOfficer, getActivityLogs);

// @route   GET /api/reports/performance
// @desc    Get performance metrics
// @access  Admin
router.get("/performance", authenticate, isAdmin, getPerformanceMetrics);

export default router;
