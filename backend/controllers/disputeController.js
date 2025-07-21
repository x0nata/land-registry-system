import { validationResult } from "express-validator";
import Dispute from "../models/Dispute.js";
import Property from "../models/Property.js";
import ApplicationLog from "../models/ApplicationLog.js";
import User from "../models/User.js";
import NotificationService from "../services/notificationService.js";

// @desc    Submit a new dispute
// @route   POST /api/disputes
// @access  Private (User)
export const submitDispute = async (req, res) => {
  try {
    console.log('Dispute submission started:', {
      userId: req.user?._id,
      userRole: req.user?.role,
      body: req.body
    });

    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('Validation errors:', errors.array());
      return res.status(400).json({ errors: errors.array() });
    }

    const { property, disputeType, title, description, evidence } = req.body;

    // Verify that the property exists and user owns it
    const propertyExists = await Property.findById(property);
    if (!propertyExists) {
      return res.status(404).json({ message: "Property not found" });
    }

    // Check if the user owns this property
    if (propertyExists.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "You can only submit disputes for your own properties" });
    }

    // Check if there's already an active dispute for this property
    const existingDispute = await Dispute.findOne({
      property,
      status: { $in: ["submitted", "under_review", "investigation", "mediation"] }
    });

    if (existingDispute) {
      return res.status(400).json({ 
        message: "There is already an active dispute for this property" 
      });
    }

    // Create new dispute (exclude evidence for now to avoid validation issues)
    const disputeData = {
      property,
      disputant: req.user._id,
      disputeType,
      title,
      description,
      timeline: [{
        action: "Dispute submitted",
        performedBy: req.user._id,
        performedByRole: req.user.role,
        notes: "Initial dispute submission"
      }]
    };

    // Only add evidence if it's provided and valid
    if (evidence && Array.isArray(evidence) && evidence.length > 0) {
      // Validate that all evidence has proper ObjectIds
      const validEvidence = evidence.filter(ev =>
        ev.fileId &&
        typeof ev.fileId === 'string' &&
        ev.fileId.match(/^[0-9a-fA-F]{24}$/) // Valid ObjectId format
      );

      if (validEvidence.length > 0) {
        disputeData.evidence = validEvidence;
      }
    }

    const dispute = await Dispute.create(disputeData);

    // Update property to mark it has an active dispute
    await Property.findByIdAndUpdate(property, {
      hasActiveDispute: true,
      $push: { disputes: dispute._id }
    });

    // Create application log entry
    await ApplicationLog.create({
      property,
      user: req.user._id,
      action: "dispute_submitted",
      status: "under_review",
      performedBy: req.user._id,
      performedByRole: req.user.role,
      notes: `Dispute submitted: ${title}`,
      metadata: {
        disputeId: dispute._id,
        disputeType
      }
    });

    // Populate the dispute with property and disputant details
    const populatedDispute = await Dispute.findById(dispute._id)
      .populate('property', 'plotNumber location propertyType')
      .populate('disputant', 'fullName email phoneNumber');

    // Send notification to admins/land officers
    try {
      await NotificationService.sendDisputeSubmittedNotification(
        dispute,
        propertyExists,
        req.user
      );
    } catch (notificationError) {
      console.error('Error sending dispute notification:', notificationError);
      // Don't fail the dispute submission if notification fails
    }

    res.status(201).json(populatedDispute);
  } catch (error) {
    console.error("Error submitting dispute:", error);
    console.error("Error stack:", error.stack);
    res.status(500).json({
      message: "Server error while submitting dispute",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Get user's disputes
// @route   GET /api/disputes/my-disputes
// @access  Private (User)
export const getUserDisputes = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const disputes = await Dispute.find({ disputant: req.user._id })
      .populate('property', 'plotNumber location propertyType')
      .populate('assignedTo', 'fullName email')
      .sort({ submissionDate: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Dispute.countDocuments({ disputant: req.user._id });

    res.json({
      disputes,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalDisputes: total,
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error("Error fetching user disputes:", error);
    res.status(500).json({ message: "Server error while fetching disputes" });
  }
};

// @desc    Get dispute by ID
// @route   GET /api/disputes/:id
// @access  Private (User - only their own disputes)
export const getDisputeById = async (req, res) => {
  try {
    const dispute = await Dispute.findOne({
      _id: req.params.id,
      disputant: req.user._id
    })
      .populate('property', 'plotNumber location propertyType owner')
      .populate('disputant', 'fullName email phoneNumber')
      .populate('assignedTo', 'fullName email')
      .populate('resolution.resolvedBy', 'fullName')
      .populate('timeline.performedBy', 'fullName');

    if (!dispute) {
      return res.status(404).json({ message: "Dispute not found" });
    }

    res.json(dispute);
  } catch (error) {
    console.error("Error fetching dispute:", error);
    res.status(500).json({ message: "Server error while fetching dispute" });
  }
};

// @desc    Update dispute (withdraw)
// @route   PUT /api/disputes/:id/withdraw
// @access  Private (User - only their own disputes)
export const withdrawDispute = async (req, res) => {
  try {
    const { reason } = req.body;

    const dispute = await Dispute.findOne({
      _id: req.params.id,
      disputant: req.user._id,
      status: { $in: ["submitted", "under_review", "investigation"] }
    });

    if (!dispute) {
      return res.status(404).json({ 
        message: "Dispute not found or cannot be withdrawn" 
      });
    }

    // Update dispute status
    dispute.status = "withdrawn";
    dispute.timeline.push({
      action: "Dispute withdrawn by disputant",
      performedBy: req.user._id,
      performedByRole: req.user.role,
      notes: reason || "Dispute withdrawn by user"
    });

    await dispute.save();

    // Update property to remove active dispute flag if no other active disputes
    const activeDisputes = await Dispute.countDocuments({
      property: dispute.property,
      status: { $in: ["submitted", "under_review", "investigation", "mediation"] }
    });

    if (activeDisputes === 0) {
      await Property.findByIdAndUpdate(dispute.property, {
        hasActiveDispute: false
      });
    }

    // Create application log entry
    await ApplicationLog.create({
      property: dispute.property,
      user: req.user._id,
      action: "dispute_withdrawn",
      status: "withdrawn",
      performedBy: req.user._id,
      performedByRole: req.user.role,
      notes: reason || "Dispute withdrawn by user",
      metadata: {
        disputeId: dispute._id
      }
    });

    res.json({ message: "Dispute withdrawn successfully", dispute });
  } catch (error) {
    console.error("Error withdrawing dispute:", error);
    res.status(500).json({ message: "Server error while withdrawing dispute" });
  }
};

// @desc    Add evidence to dispute
// @route   POST /api/disputes/:id/evidence
// @access  Private (User - only their own disputes)
export const addEvidence = async (req, res) => {
  try {
    const { documentType, documentName, fileId, filename, fileType } = req.body;

    const dispute = await Dispute.findOne({
      _id: req.params.id,
      disputant: req.user._id,
      status: { $in: ["submitted", "under_review", "investigation"] }
    });

    if (!dispute) {
      return res.status(404).json({ 
        message: "Dispute not found or evidence cannot be added" 
      });
    }

    // Add evidence to dispute
    dispute.evidence.push({
      documentType,
      documentName,
      fileId,
      filename,
      fileType
    });

    dispute.timeline.push({
      action: "Evidence added",
      performedBy: req.user._id,
      performedByRole: req.user.role,
      notes: `Added evidence: ${documentName}`
    });

    await dispute.save();

    res.json({ message: "Evidence added successfully", dispute });
  } catch (error) {
    console.error("Error adding evidence:", error);
    res.status(500).json({ message: "Server error while adding evidence" });
  }
};

// Admin/Land Officer Controllers

// @desc    Get all disputes (Admin/Land Officer)
// @route   GET /api/disputes/admin/all
// @access  Private (Admin, Land Officer)
export const getAllDisputes = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      disputeType,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Build filter object
    const filter = {};

    if (status && status !== 'all') {
      filter.status = status;
    }

    if (disputeType && disputeType !== 'all') {
      filter.disputeType = disputeType;
    }

    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Get disputes with pagination
    const disputes = await Dispute.find(filter)
      .populate('property', 'plotNumber location propertyType owner')
      .populate('disputant', 'fullName email phoneNumber')
      .populate('assignedTo', 'fullName email role')
      .populate('resolution.resolvedBy', 'fullName')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));

    // Get total count for pagination
    const total = await Dispute.countDocuments(filter);

    // Calculate pagination info
    const totalPages = Math.ceil(total / parseInt(limit));
    const hasNextPage = parseInt(page) < totalPages;
    const hasPrevPage = parseInt(page) > 1;

    res.json({
      disputes,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalItems: total,
        itemsPerPage: parseInt(limit),
        hasNextPage,
        hasPrevPage
      }
    });
  } catch (error) {
    console.error("Error fetching all disputes:", error);
    res.status(500).json({ message: "Server error while fetching disputes" });
  }
};

// @desc    Get dispute by ID (Admin/Land Officer)
// @route   GET /api/disputes/admin/:id
// @access  Private (Admin, Land Officer)
export const getDisputeByIdAdmin = async (req, res) => {
  try {
    const dispute = await Dispute.findById(req.params.id)
      .populate('property', 'plotNumber location propertyType owner documents')
      .populate('disputant', 'fullName email phoneNumber')
      .populate('assignedTo', 'fullName email role')
      .populate('resolution.resolvedBy', 'fullName')
      .populate('timeline.performedBy', 'fullName role');

    if (!dispute) {
      return res.status(404).json({ message: "Dispute not found" });
    }

    res.json(dispute);
  } catch (error) {
    console.error("Error fetching dispute:", error);
    res.status(500).json({ message: "Server error while fetching dispute" });
  }
};

// @desc    Update dispute status (Admin/Land Officer)
// @route   PUT /api/disputes/admin/:id/status
// @access  Private (Admin, Land Officer)
export const updateDisputeStatus = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { status, notes } = req.body;

    const dispute = await Dispute.findById(req.params.id);
    if (!dispute) {
      return res.status(404).json({ message: "Dispute not found" });
    }

    // Update dispute status
    dispute.status = status;
    dispute.timeline.push({
      action: `Status updated to ${status}`,
      performedBy: req.user._id,
      performedByRole: req.user.role,
      notes
    });

    await dispute.save();

    // Populate the updated dispute
    const populatedDispute = await Dispute.findById(dispute._id)
      .populate('property', 'plotNumber location propertyType')
      .populate('disputant', 'fullName email phoneNumber')
      .populate('assignedTo', 'fullName email role');

    // Send status update notification to disputant
    try {
      await NotificationService.sendDisputeStatusUpdateNotification(
        dispute,
        populatedDispute.property,
        populatedDispute.disputant,
        status,
        notes
      );
    } catch (notificationError) {
      console.error('Error sending dispute status update notification:', notificationError);
    }

    res.json(populatedDispute);
  } catch (error) {
    console.error("Error updating dispute status:", error);
    res.status(500).json({ message: "Server error while updating dispute status" });
  }
};

// @desc    Resolve a dispute (Admin/Land Officer)
// @route   PUT /api/disputes/admin/:id/resolve
// @access  Private (Admin, Land Officer)
export const resolveDispute = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { decision, resolutionNotes, actionRequired } = req.body;

    const dispute = await Dispute.findById(req.params.id);
    if (!dispute) {
      return res.status(404).json({ message: "Dispute not found" });
    }

    // Update dispute with resolution
    dispute.status = "resolved";
    dispute.resolution = {
      decision,
      resolutionNotes,
      resolvedBy: req.user._id,
      resolutionDate: new Date(),
      actionRequired: actionRequired || ""
    };

    dispute.timeline.push({
      action: `Dispute resolved with decision: ${decision}`,
      performedBy: req.user._id,
      performedByRole: req.user.role,
      notes: resolutionNotes
    });

    await dispute.save();

    // Update property to remove active dispute flag if resolved
    await Property.findByIdAndUpdate(dispute.property, {
      hasActiveDispute: false
    });

    // Create application log entry
    await ApplicationLog.create({
      property: dispute.property,
      user: dispute.disputant,
      action: "dispute_resolved",
      status: "resolved",
      performedBy: req.user._id,
      performedByRole: req.user.role,
      notes: `Dispute resolved: ${decision}`,
      metadata: {
        disputeId: dispute._id,
        decision,
        resolvedBy: req.user._id
      }
    });

    // Populate the resolved dispute
    const populatedDispute = await Dispute.findById(dispute._id)
      .populate('property', 'plotNumber location propertyType')
      .populate('disputant', 'fullName email phoneNumber')
      .populate('assignedTo', 'fullName email role')
      .populate('resolution.resolvedBy', 'fullName');

    // Send resolution notification to disputant
    try {
      await NotificationService.sendDisputeResolvedNotification(
        dispute,
        populatedDispute.property,
        populatedDispute.disputant,
        decision,
        resolutionNotes
      );
    } catch (notificationError) {
      console.error('Error sending dispute resolution notification:', notificationError);
    }

    res.json(populatedDispute);
  } catch (error) {
    console.error("Error resolving dispute:", error);
    res.status(500).json({ message: "Server error while resolving dispute" });
  }
};

// @desc    Assign dispute to a land officer (Admin only)
// @route   PUT /api/disputes/admin/:id/assign
// @access  Private (Admin)
export const assignDispute = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { assignedTo, notes } = req.body;

    const dispute = await Dispute.findById(req.params.id);
    if (!dispute) {
      return res.status(404).json({ message: "Dispute not found" });
    }

    // Verify the assigned user exists and is a land officer
    const assignedUser = await User.findById(assignedTo);
    if (!assignedUser || assignedUser.role !== 'landOfficer') {
      return res.status(400).json({ message: "Invalid land officer assignment" });
    }

    // Update dispute assignment
    dispute.assignedTo = assignedTo;
    dispute.assignedDate = new Date();
    dispute.timeline.push({
      action: `Dispute assigned to ${assignedUser.fullName}`,
      performedBy: req.user._id,
      performedByRole: req.user.role,
      notes: notes || `Assigned to land officer for review`
    });

    await dispute.save();

    // Populate the assigned dispute
    const populatedDispute = await Dispute.findById(dispute._id)
      .populate('property', 'plotNumber location propertyType')
      .populate('disputant', 'fullName email phoneNumber')
      .populate('assignedTo', 'fullName email role');

    res.json(populatedDispute);
  } catch (error) {
    console.error("Error assigning dispute:", error);
    res.status(500).json({ message: "Server error while assigning dispute" });
  }
};
