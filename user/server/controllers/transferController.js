import { validationResult } from "express-validator";
import PropertyTransfer from "../models/PropertyTransfer.js";
import Property from "../models/Property.js";
import User from "../models/User.js";
import ApplicationLog from "../models/ApplicationLog.js";

// @desc    Initiate property transfer
// @route   POST /api/transfers
// @access  Private (User)
export const initiateTransfer = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { 
      property, 
      newOwnerEmail, 
      transferType, 
      transferReason, 
      transferValue 
    } = req.body;

    // Verify that the property exists and user is the owner
    const propertyExists = await Property.findOne({
      _id: property,
      owner: req.user._id
    });

    if (!propertyExists) {
      return res.status(404).json({ 
        message: "Property not found or you are not the owner" 
      });
    }

    // Check if property has active disputes
    if (propertyExists.hasActiveDispute) {
      return res.status(400).json({ 
        message: "Cannot transfer property with active disputes" 
      });
    }

    // Check if there's already an active transfer for this property
    const existingTransfer = await PropertyTransfer.findOne({
      property,
      status: { $in: ["initiated", "documents_pending", "under_review", "verification_pending"] }
    });

    if (existingTransfer) {
      return res.status(400).json({ 
        message: "There is already an active transfer for this property" 
      });
    }

    // Find the new owner by email
    const newOwner = await User.findOne({ email: newOwnerEmail });
    if (!newOwner) {
      return res.status(404).json({ 
        message: "New owner not found. They must be registered in the system." 
      });
    }

    // Prevent self-transfer
    if (newOwner._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ 
        message: "Cannot transfer property to yourself" 
      });
    }

    // Create new transfer
    const transfer = await PropertyTransfer.create({
      property,
      previousOwner: req.user._id,
      newOwner: newOwner._id,
      transferType,
      transferReason,
      transferValue: transferValue || { amount: 0, currency: "ETB" },
      timeline: [{
        action: "Transfer initiated",
        performedBy: req.user._id,
        performedByRole: req.user.role,
        notes: "Property transfer initiated by owner"
      }]
    });

    // Update property to mark it has an active transfer
    await Property.findByIdAndUpdate(property, {
      currentTransfer: transfer._id,
      $push: { transferHistory: transfer._id }
    });

    // Create application log entry
    await ApplicationLog.create({
      property,
      user: req.user._id,
      action: "transfer_initiated",
      status: "under_review",
      performedBy: req.user._id,
      performedByRole: req.user.role,
      notes: `Property transfer initiated to ${newOwner.fullName}`,
      metadata: {
        transferId: transfer._id,
        transferType,
        newOwnerId: newOwner._id
      }
    });

    // Populate the transfer with property and user details
    const populatedTransfer = await PropertyTransfer.findById(transfer._id)
      .populate('property', 'plotNumber location propertyType')
      .populate('previousOwner', 'fullName email phoneNumber')
      .populate('newOwner', 'fullName email phoneNumber');

    res.status(201).json(populatedTransfer);
  } catch (error) {
    console.error("Error initiating transfer:", error);
    res.status(500).json({ message: "Server error while initiating transfer" });
  }
};

// @desc    Get user's transfers (as previous or new owner)
// @route   GET /api/transfers/my-transfers
// @access  Private (User)
export const getUserTransfers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const transfers = await PropertyTransfer.find({
      $or: [
        { previousOwner: req.user._id },
        { newOwner: req.user._id }
      ]
    })
      .populate('property', 'plotNumber location propertyType')
      .populate('previousOwner', 'fullName email')
      .populate('newOwner', 'fullName email')
      .sort({ initiationDate: -1 })
      .skip(skip)
      .limit(limit);

    const total = await PropertyTransfer.countDocuments({
      $or: [
        { previousOwner: req.user._id },
        { newOwner: req.user._id }
      ]
    });

    res.json({
      transfers,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalTransfers: total,
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error("Error fetching user transfers:", error);
    res.status(500).json({ message: "Server error while fetching transfers" });
  }
};

// @desc    Get transfer by ID
// @route   GET /api/transfers/:id
// @access  Private (User - only their own transfers)
export const getTransferById = async (req, res) => {
  try {
    const transfer = await PropertyTransfer.findOne({
      _id: req.params.id,
      $or: [
        { previousOwner: req.user._id },
        { newOwner: req.user._id }
      ]
    })
      .populate('property', 'plotNumber location propertyType ownershipHistory')
      .populate('previousOwner', 'fullName email phoneNumber')
      .populate('newOwner', 'fullName email phoneNumber')
      .populate('timeline.performedBy', 'fullName')
      .populate('approvals.approver', 'fullName');

    if (!transfer) {
      return res.status(404).json({ message: "Transfer not found" });
    }

    res.json(transfer);
  } catch (error) {
    console.error("Error fetching transfer:", error);
    res.status(500).json({ message: "Server error while fetching transfer" });
  }
};

// @desc    Cancel transfer
// @route   PUT /api/transfers/:id/cancel
// @access  Private (User - only previous owner)
export const cancelTransfer = async (req, res) => {
  try {
    const { reason } = req.body;

    const transfer = await PropertyTransfer.findOne({
      _id: req.params.id,
      previousOwner: req.user._id,
      status: { $in: ["initiated", "documents_pending", "under_review"] }
    });

    if (!transfer) {
      return res.status(404).json({ 
        message: "Transfer not found or cannot be cancelled" 
      });
    }

    // Update transfer status
    transfer.status = "cancelled";
    transfer.timeline.push({
      action: "Transfer cancelled by previous owner",
      performedBy: req.user._id,
      performedByRole: req.user.role,
      notes: reason || "Transfer cancelled by previous owner"
    });

    await transfer.save();

    // Update property to remove current transfer
    await Property.findByIdAndUpdate(transfer.property, {
      $unset: { currentTransfer: 1 }
    });

    // Create application log entry
    await ApplicationLog.create({
      property: transfer.property,
      user: req.user._id,
      action: "transfer_cancelled",
      status: "cancelled",
      performedBy: req.user._id,
      performedByRole: req.user.role,
      notes: reason || "Transfer cancelled by previous owner",
      metadata: {
        transferId: transfer._id
      }
    });

    res.json({ message: "Transfer cancelled successfully", transfer });
  } catch (error) {
    console.error("Error cancelling transfer:", error);
    res.status(500).json({ message: "Server error while cancelling transfer" });
  }
};

// @desc    Upload transfer documents
// @route   POST /api/transfers/:id/documents
// @access  Private (User - only previous owner)
export const uploadTransferDocuments = async (req, res) => {
  try {
    // Validate request
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { documents } = req.body;
    if (!Array.isArray(documents) || documents.length === 0) {
      return res.status(400).json({ message: "Documents array must not be empty" });
    }

    const transfer = await PropertyTransfer.findOne({
      _id: req.params.id,
      previousOwner: req.user._id,
      status: { $in: ["initiated", "documents_pending"] }
    });

    if (!transfer) {
      return res.status(404).json({ 
        message: "Transfer not found or documents cannot be uploaded" 
      });
    }

    // Add documents to transfer
    transfer.documents.push(...documents);
    transfer.status = "under_review";
    transfer.timeline.push({
      action: "Transfer documents uploaded",
      performedBy: req.user._id,
      performedByRole: req.user.role,
      notes: `Uploaded ${documents.length} document(s)`
    });

    await transfer.save();

    // Create application log entry
    await ApplicationLog.create({
      property: transfer.property,
      user: req.user._id,
      action: "transfer_documents_uploaded",
      status: "under_review",
      performedBy: req.user._id,
      performedByRole: req.user.role,
      notes: `Transfer documents uploaded: ${documents.length} document(s)`,
      metadata: {
        transferId: transfer._id,
        documentCount: documents.length
      }
    });

    res.json({ message: "Documents uploaded successfully", transfer });
  } catch (error) {
    console.error("Error uploading transfer documents:", error);
    res.status(500).json({ message: "Server error while uploading documents" });
  }
};
