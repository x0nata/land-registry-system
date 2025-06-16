import { validationResult } from "express-validator";
import Dispute from "../models/Dispute.js";
import Property from "../models/Property.js";
import User from "../models/User.js";
import ApplicationLog from "../models/ApplicationLog.js";

// @desc    Get all disputes (Admin/Land Officer)
// @route   GET /api/disputes
// @access  Private (Admin/Land Officer)
export const getAllDisputes = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const status = req.query.status;
    const priority = req.query.priority;
    const assignedTo = req.query.assignedTo;

    // Build filter object
    const filter = {};
    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    if (assignedTo) filter.assignedTo = assignedTo;

    const disputes = await Dispute.find(filter)
      .populate('property', 'plotNumber location propertyType')
      .populate('disputant', 'fullName email phoneNumber')
      .populate('assignedTo', 'fullName email')
      .sort({ submissionDate: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Dispute.countDocuments(filter);

    // Get statistics
    const stats = await Dispute.aggregate([
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 }
        }
      }
    ]);

    res.json({
      disputes,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalDisputes: total,
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1
      },
      statistics: stats
    });
  } catch (error) {
    console.error("Error fetching disputes:", error);
    res.status(500).json({ message: "Server error while fetching disputes" });
  }
};

// @desc    Get dispute by ID (Admin/Land Officer)
// @route   GET /api/disputes/:id
// @access  Private (Admin/Land Officer)
export const getDisputeById = async (req, res) => {
  try {
    const dispute = await Dispute.findById(req.params.id)
      .populate('property', 'plotNumber location propertyType owner ownershipHistory')
      .populate('disputant', 'fullName email phoneNumber nationalId')
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

// @desc    Assign dispute to officer
// @route   PUT /api/disputes/:id/assign
// @access  Private (Admin)
export const assignDispute = async (req, res) => {
  try {
    const { assignedTo, priority } = req.body;

    const dispute = await Dispute.findById(req.params.id);
    if (!dispute) {
      return res.status(404).json({ message: "Dispute not found" });
    }

    // Verify assigned user exists and has appropriate role
    const assignee = await User.findById(assignedTo);
    if (!assignee || !["admin", "landOfficer"].includes(assignee.role)) {
      return res.status(400).json({ 
        message: "Invalid assignee. Must be admin or land officer." 
      });
    }

    // Update dispute
    dispute.assignedTo = assignedTo;
    if (priority) dispute.priority = priority;
    dispute.status = "under_review";
    dispute.timeline.push({
      action: "Dispute assigned",
      performedBy: req.user._id,
      performedByRole: req.user.role,
      notes: `Assigned to ${assignee.fullName}`
    });

    await dispute.save();

    // Create application log entry
    await ApplicationLog.create({
      property: dispute.property,
      user: dispute.disputant,
      action: "dispute_assigned",
      status: "under_review",
      performedBy: req.user._id,
      performedByRole: req.user.role,
      notes: `Dispute assigned to ${assignee.fullName}`,
      metadata: {
        disputeId: dispute._id,
        assignedTo: assignedTo
      }
    });

    const populatedDispute = await Dispute.findById(dispute._id)
      .populate('assignedTo', 'fullName email');

    res.json({ message: "Dispute assigned successfully", dispute: populatedDispute });
  } catch (error) {
    console.error("Error assigning dispute:", error);
    res.status(500).json({ message: "Server error while assigning dispute" });
  }
};

// @desc    Update dispute status
// @route   PUT /api/disputes/:id/status
// @access  Private (Admin/Land Officer)
export const updateDisputeStatus = async (req, res) => {
  try {
    const { status, notes } = req.body;

    const dispute = await Dispute.findById(req.params.id);
    if (!dispute) {
      return res.status(404).json({ message: "Dispute not found" });
    }

    // Check if user is assigned to this dispute or is admin
    if (req.user.role !== "admin" && 
        dispute.assignedTo?.toString() !== req.user._id.toString()) {
      return res.status(403).json({ 
        message: "You can only update disputes assigned to you" 
      });
    }

    const previousStatus = dispute.status;
    dispute.status = status;
    dispute.timeline.push({
      action: `Status changed from ${previousStatus} to ${status}`,
      performedBy: req.user._id,
      performedByRole: req.user.role,
      notes: notes || `Status updated to ${status}`
    });

    await dispute.save();

    // Create application log entry
    await ApplicationLog.create({
      property: dispute.property,
      user: dispute.disputant,
      action: "dispute_under_review",
      status: status,
      previousStatus: previousStatus,
      performedBy: req.user._id,
      performedByRole: req.user.role,
      notes: notes || `Dispute status updated to ${status}`,
      metadata: {
        disputeId: dispute._id,
        previousStatus,
        newStatus: status
      }
    });

    res.json({ message: "Dispute status updated successfully", dispute });
  } catch (error) {
    console.error("Error updating dispute status:", error);
    res.status(500).json({ message: "Server error while updating dispute status" });
  }
};

// @desc    Resolve dispute
// @route   PUT /api/disputes/:id/resolve
// @access  Private (Admin/Land Officer)
export const resolveDispute = async (req, res) => {
  try {
    const { decision, resolutionNotes, actionRequired } = req.body;

    const dispute = await Dispute.findById(req.params.id);
    if (!dispute) {
      return res.status(404).json({ message: "Dispute not found" });
    }

    // Check if user is assigned to this dispute or is admin
    if (req.user.role !== "admin" && 
        dispute.assignedTo?.toString() !== req.user._id.toString()) {
      return res.status(403).json({ 
        message: "You can only resolve disputes assigned to you" 
      });
    }

    // Update dispute with resolution
    dispute.status = "resolved";
    dispute.resolution = {
      decision,
      resolutionNotes,
      resolvedBy: req.user._id,
      resolutionDate: new Date(),
      actionRequired
    };
    dispute.timeline.push({
      action: "Dispute resolved",
      performedBy: req.user._id,
      performedByRole: req.user.role,
      notes: `Dispute resolved with decision: ${decision}`
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
      user: dispute.disputant,
      action: "dispute_resolved",
      status: "resolved",
      performedBy: req.user._id,
      performedByRole: req.user.role,
      notes: `Dispute resolved: ${decision}`,
      metadata: {
        disputeId: dispute._id,
        decision,
        resolutionNotes
      }
    });

    const populatedDispute = await Dispute.findById(dispute._id)
      .populate('resolution.resolvedBy', 'fullName');

    res.json({ message: "Dispute resolved successfully", dispute: populatedDispute });
  } catch (error) {
    console.error("Error resolving dispute:", error);
    res.status(500).json({ message: "Server error while resolving dispute" });
  }
};

// @desc    Reject dispute
// @route   PUT /api/disputes/:id/reject
// @access  Private (Admin/Land Officer)
export const rejectDispute = async (req, res) => {
  try {
    const { rejectionReason } = req.body;

    const dispute = await Dispute.findById(req.params.id);
    if (!dispute) {
      return res.status(404).json({ message: "Dispute not found" });
    }

    // Check if user is assigned to this dispute or is admin
    if (req.user.role !== "admin" && 
        dispute.assignedTo?.toString() !== req.user._id.toString()) {
      return res.status(403).json({ 
        message: "You can only reject disputes assigned to you" 
      });
    }

    // Update dispute status
    dispute.status = "rejected";
    dispute.timeline.push({
      action: "Dispute rejected",
      performedBy: req.user._id,
      performedByRole: req.user.role,
      notes: rejectionReason || "Dispute rejected"
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
      user: dispute.disputant,
      action: "dispute_rejected",
      status: "rejected",
      performedBy: req.user._id,
      performedByRole: req.user.role,
      notes: rejectionReason || "Dispute rejected",
      metadata: {
        disputeId: dispute._id,
        rejectionReason
      }
    });

    res.json({ message: "Dispute rejected successfully", dispute });
  } catch (error) {
    console.error("Error rejecting dispute:", error);
    res.status(500).json({ message: "Server error while rejecting dispute" });
  }
};
