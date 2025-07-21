import ApplicationLog from "../models/ApplicationLog.js";
import Property from "../models/Property.js";
import { validationResult } from "express-validator";

// @desc    Get application logs for a property
// @route   GET /api/logs/property/:propertyId
// @access  Private
export const getPropertyLogs = async (req, res) => {
  try {
    const property = await Property.findById(req.params.propertyId);

    if (!property) {
      return res.status(404).json({ message: "Property not found" });
    }

    // Check if user is authorized to view logs
    if (
      property.owner.toString() !== req.user._id.toString() &&
      !["admin", "landOfficer"].includes(req.user.role)
    ) {
      return res
        .status(403)
        .json({ message: "Not authorized to view logs for this property" });
    }

    const logs = await ApplicationLog.find({ property: property._id })
      .populate("performedBy", "fullName email role")
      .sort({ timestamp: -1 });

    res.json(logs);
  } catch (error) {
    console.error("Error fetching property logs:", error);
    res.status(500).json({ message: "Server error while fetching logs" });
  }
};

// @desc    Get application logs for the current user
// @route   GET /api/logs/user
// @access  Private (User)
export const getUserLogs = async (req, res) => {
  try {
    const logs = await ApplicationLog.find({ user: req.user._id })
      .populate("property", "plotNumber location propertyType")
      .populate("performedBy", "fullName email role")
      .sort({ timestamp: -1 });

    res.json(logs);
  } catch (error) {
    console.error("Error fetching user logs:", error);
    res.status(500).json({ message: "Server error while fetching logs" });
  }
};

// @desc    Get all application logs
// @route   GET /api/logs
// @access  Private (Admin)
export const getAllLogs = async (req, res) => {
  try {
    const {
      action,
      status,
      user,
      property,
      startDate,
      endDate,
      page = 1,
      limit = 20,
    } = req.query;

    // Build query
    const query = {};

    // Filter by action if provided
    if (action) {
      query.action = action;
    }

    // Filter by status if provided
    if (status) {
      query.status = status;
    }

    // Filter by user if provided
    if (user) {
      query.user = user;
    }

    // Filter by property if provided
    if (property) {
      query.property = property;
    }

    // Filter by date range if provided
    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) {
        query.timestamp.$gte = new Date(startDate);
      }
      if (endDate) {
        query.timestamp.$lte = new Date(endDate);
      }
    }

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Execute query
    const logs = await ApplicationLog.find(query)
      .populate("property", "plotNumber location propertyType")
      .populate("user", "fullName email nationalId")
      .populate("performedBy", "fullName email role")
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ timestamp: -1 });

    // Get total count for pagination
    const total = await ApplicationLog.countDocuments(query);

    res.json({
      logs,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error("Error fetching logs:", error);
    res.status(500).json({ message: "Server error while fetching logs" });
  }
};

// @desc    Add a comment to a property application
// @route   POST /api/logs/property/:propertyId/comment
// @access  Private
export const addComment = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const property = await Property.findById(req.params.propertyId);

    if (!property) {
      return res.status(404).json({ message: "Property not found" });
    }

    // Check if user is authorized to add comments
    if (
      property.owner.toString() !== req.user._id.toString() &&
      !["admin", "landOfficer"].includes(req.user.role)
    ) {
      return res
        .status(403)
        .json({ message: "Not authorized to add comments to this property" });
    }

    // Create application log
    const log = await ApplicationLog.create({
      property: property._id,
      user: property.owner,
      action: "comment_added",
      status: property.status,
      performedBy: req.user._id,
      performedByRole: req.user.role,
      notes: req.body.comment,
    });

    res.status(201).json(log);
  } catch (error) {
    console.error("Error adding comment:", error);
    res.status(500).json({ message: "Server error while adding comment" });
  }
};

// @desc    Get recent activities
// @route   GET /api/logs/recent
// @access  Private (Admin, Land Officer)
export const getRecentActivities = async (req, res) => {
  try {
    const { limit = 10 } = req.query;

    const recentActivities = await ApplicationLog.find()
      .populate({
        path: "property",
        select: "plotNumber location propertyType",
        options: { strictPopulate: false }
      })
      .populate({
        path: "user",
        select: "fullName email nationalId",
        options: { strictPopulate: false }
      })
      .populate({
        path: "performedBy",
        select: "fullName email role",
        options: { strictPopulate: false }
      })
      .limit(parseInt(limit))
      .sort({ timestamp: -1 });

    res.json(recentActivities);
  } catch (error) {
    console.error("Error fetching recent activities:", error);
    res
      .status(500)
      .json({
        message: "Server error while fetching recent activities",
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
  }
};

// @desc    Get recent activities for the current user
// @route   GET /api/logs/user/recent
// @access  Private (User)
export const getUserRecentActivities = async (req, res) => {
  try {
    const { limit = 10 } = req.query;

    console.log('Fetching recent activities for user:', req.user._id);

    // Get activities where the user is either the owner or the performer
    const recentActivities = await ApplicationLog.find({
      $or: [
        { user: req.user._id },
        { performedBy: req.user._id }
      ]
    })
      .populate({
        path: "property",
        select: "plotNumber location propertyType",
        options: { strictPopulate: false }
      })
      .populate({
        path: "user",
        select: "fullName email nationalId",
        options: { strictPopulate: false }
      })
      .populate({
        path: "performedBy",
        select: "fullName email role",
        options: { strictPopulate: false }
      })
      .limit(parseInt(limit))
      .sort({ timestamp: -1 });

    console.log(`Found ${recentActivities.length} recent activities`);
    res.json(recentActivities);
  } catch (error) {
    console.error("Error fetching user recent activities:", error);
    console.error("Error details:", error.message);
    console.error("Error stack:", error.stack);
    res
      .status(500)
      .json({
        message: "Server error while fetching user recent activities",
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
  }
};

// @desc    Get application statistics
// @route   GET /api/logs/stats
// @access  Private (Admin)
export const getApplicationStats = async (req, res) => {
  try {
    const { timeframe = "month" } = req.query;

    // Set date range based on timeframe
    const endDate = new Date();
    const startDate = new Date();

    switch (timeframe) {
      case "week":
        startDate.setDate(startDate.getDate() - 7);
        break;
      case "month":
        startDate.setMonth(startDate.getMonth() - 1);
        break;
      case "year":
        startDate.setFullYear(startDate.getFullYear() - 1);
        break;
      default:
        startDate.setMonth(startDate.getMonth() - 1);
    }

    // Get total applications
    const totalApplications = await ApplicationLog.countDocuments({
      action: "application_submitted",
      timestamp: { $gte: startDate, $lte: endDate },
    });

    // Get approved applications
    const approvedApplications = await ApplicationLog.countDocuments({
      action: "application_approved",
      timestamp: { $gte: startDate, $lte: endDate },
    });

    // Get rejected applications
    const rejectedApplications = await ApplicationLog.countDocuments({
      action: "application_rejected",
      timestamp: { $gte: startDate, $lte: endDate },
    });

    // Get pending applications
    const pendingApplications =
      totalApplications - (approvedApplications + rejectedApplications);

    // Get document statistics
    const documentsUploaded = await ApplicationLog.countDocuments({
      action: "document_uploaded",
      timestamp: { $gte: startDate, $lte: endDate },
    });

    const documentsVerified = await ApplicationLog.countDocuments({
      action: "document_verified",
      timestamp: { $gte: startDate, $lte: endDate },
    });

    const documentsRejected = await ApplicationLog.countDocuments({
      action: "document_rejected",
      timestamp: { $gte: startDate, $lte: endDate },
    });

    // Get payment statistics
    const paymentsMade = await ApplicationLog.countDocuments({
      action: "payment_made",
      timestamp: { $gte: startDate, $lte: endDate },
    });

    const paymentsVerified = await ApplicationLog.countDocuments({
      action: "payment_verified",
      timestamp: { $gte: startDate, $lte: endDate },
    });

    const paymentsRejected = await ApplicationLog.countDocuments({
      action: "payment_rejected",
      timestamp: { $gte: startDate, $lte: endDate },
    });

    res.json({
      timeframe,
      period: {
        start: startDate,
        end: endDate,
      },
      applications: {
        total: totalApplications,
        approved: approvedApplications,
        rejected: rejectedApplications,
        pending: pendingApplications,
      },
      documents: {
        uploaded: documentsUploaded,
        verified: documentsVerified,
        rejected: documentsRejected,
      },
      payments: {
        made: paymentsMade,
        verified: paymentsVerified,
        rejected: paymentsRejected,
      },
    });
  } catch (error) {
    console.error("Error fetching application statistics:", error);
    res
      .status(500)
      .json({ message: "Server error while fetching application statistics" });
  }
};
