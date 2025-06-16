import express from "express";
import { check } from "express-validator";
import {
  getPropertyLogs,
  getUserLogs,
  addComment,
  getUserRecentActivities,
} from "../controllers/applicationLogController.js";
import { authenticate, isUser } from "../middleware/auth.js";

const router = express.Router();

// @route   GET /api/logs/property/:propertyId
// @desc    Get application logs for a property
// @access  Private
router.get("/property/:propertyId", authenticate, getPropertyLogs);

// @route   GET /api/logs/user
// @desc    Get application logs for the current user
// @access  Private (User)
router.get("/user", authenticate, getUserLogs);

// @route   GET /api/logs/user/recent
// @desc    Get recent activities for the current user
// @access  Private (User)
router.get("/user/recent", authenticate, getUserRecentActivities);

// @route   POST /api/logs/property/:propertyId/comment
// @desc    Add a comment to a property application
// @access  Private
router.post(
  "/property/:propertyId/comment",
  [authenticate, check("comment", "Comment is required").not().isEmpty()],
  addComment
);

export default router;
