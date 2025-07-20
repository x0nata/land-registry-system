import express from "express";
import { check } from "express-validator";
import {
  getPropertyLogs,
  getUserLogs,
  getAllLogs,
  addComment,
  getRecentActivities,
  getUserRecentActivities,
  getApplicationStats,
} from "../controllers/applicationLogController.js";
import { authenticate, isUser, isAdminOrLandOfficer } from "../middleware/auth.js";
import { recentActivitiesCache } from "../middleware/cache.js";

const router = express.Router();

// @route   GET /api/logs/property/:propertyId
// @desc    Get application logs for a property
// @access  Private
router.get("/property/:propertyId", authenticate, getPropertyLogs);

// @route   GET /api/logs/user
// @desc    Get application logs for the current user
// @access  Private (User)
router.get("/user", authenticate, getUserLogs);

// @route   GET /api/logs
// @desc    Get all application logs
// @access  Private (Admin)
router.get("/", authenticate, isAdminOrLandOfficer, getAllLogs);

// @route   GET /api/logs/recent
// @desc    Get recent activities
// @access  Private (Admin, Land Officer)
router.get("/recent", authenticate, isAdminOrLandOfficer, recentActivitiesCache, getRecentActivities);

// @route   GET /api/logs/user/recent
// @desc    Get recent activities for the current user
// @access  Private (User)
router.get("/user/recent", authenticate, recentActivitiesCache, getUserRecentActivities);

// @route   GET /api/logs/stats
// @desc    Get application statistics
// @access  Private (Admin)
router.get("/stats", authenticate, isAdminOrLandOfficer, getApplicationStats);

// @route   POST /api/logs/property/:propertyId/comment
// @desc    Add a comment to a property application
// @access  Private
router.post(
  "/property/:propertyId/comment",
  [authenticate, check("comment", "Comment is required").not().isEmpty()],
  addComment
);

export default router;
