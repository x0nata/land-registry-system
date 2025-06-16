import { validationResult } from "express-validator";
import Dispute from "../models/Dispute.js";
import Property from "../models/Property.js";
import ApplicationLog from "../models/ApplicationLog.js";

// @desc    Submit a new dispute
// @route   POST /api/disputes
// @access  Private (User)
export const submitDispute = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { property, disputeType, title, description, evidence } = req.body;

    // Verify that the property exists
    const propertyExists = await Property.findById(property);
    if (!propertyExists) {
      return res.status(404).json({ message: "Property not found" });
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

    // Create new dispute
    const dispute = await Dispute.create({
      property,
      disputant: req.user._id,
      disputeType,
      title,
      description,
      evidence: evidence || [],
      timeline: [{
        action: "Dispute submitted",
        performedBy: req.user._id,
        performedByRole: req.user.role,
        notes: "Initial dispute submission"
      }]
    });

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

    res.status(201).json(populatedDispute);
  } catch (error) {
    console.error("Error submitting dispute:", error);
    res.status(500).json({ message: "Server error while submitting dispute" });
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
