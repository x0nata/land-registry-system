import { validationResult } from "express-validator";
import PropertyTransfer from "../models/PropertyTransfer.js";
import Property from "../models/Property.js";
import User from "../models/User.js";
import ApplicationLog from "../models/ApplicationLog.js";

// @desc    Get all transfers (Admin/Land Officer)
// @route   GET /api/transfers
// @access  Private (Admin/Land Officer)
export const getAllTransfers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const status = req.query.status;
    const transferType = req.query.transferType;

    // Build filter object
    const filter = {};
    if (status) filter.status = status;
    if (transferType) filter.transferType = transferType;

    const transfers = await PropertyTransfer.find(filter)
      .populate('property', 'plotNumber location propertyType')
      .populate('previousOwner', 'fullName email phoneNumber')
      .populate('newOwner', 'fullName email phoneNumber')
      .sort({ initiationDate: -1 })
      .skip(skip)
      .limit(limit);

    const total = await PropertyTransfer.countDocuments(filter);

    // Get statistics
    const stats = await PropertyTransfer.aggregate([
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 }
        }
      }
    ]);

    res.json({
      transfers,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalTransfers: total,
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1
      },
      statistics: stats
    });
  } catch (error) {
    console.error("Error fetching transfers:", error);
    res.status(500).json({ message: "Server error while fetching transfers" });
  }
};

// @desc    Get transfer by ID (Admin/Land Officer)
// @route   GET /api/transfers/:id
// @access  Private (Admin/Land Officer)
export const getTransferById = async (req, res) => {
  try {
    const transfer = await PropertyTransfer.findById(req.params.id)
      .populate('property', 'plotNumber location propertyType ownershipHistory')
      .populate('previousOwner', 'fullName email phoneNumber nationalId')
      .populate('newOwner', 'fullName email phoneNumber nationalId')
      .populate('timeline.performedBy', 'fullName')
      .populate('approvals.approver', 'fullName')
      .populate('complianceChecks.ethiopianLawCompliance.checkedBy', 'fullName')
      .populate('complianceChecks.taxClearance.checkedBy', 'fullName')
      .populate('complianceChecks.fraudPrevention.checkedBy', 'fullName');

    if (!transfer) {
      return res.status(404).json({ message: "Transfer not found" });
    }

    res.json(transfer);
  } catch (error) {
    console.error("Error fetching transfer:", error);
    res.status(500).json({ message: "Server error while fetching transfer" });
  }
};

// @desc    Review transfer documents
// @route   PUT /api/transfers/:id/review-documents
// @access  Private (Admin/Land Officer)
export const reviewTransferDocuments = async (req, res) => {
  try {
    const { documentReviews } = req.body;

    const transfer = await PropertyTransfer.findById(req.params.id);
    if (!transfer) {
      return res.status(404).json({ message: "Transfer not found" });
    }

    // Update document verification status
    documentReviews.forEach(review => {
      const document = transfer.documents.id(review.documentId);
      if (document) {
        document.verificationStatus = review.status;
        document.verifiedBy = req.user._id;
        document.verificationDate = new Date();
        document.verificationNotes = review.notes;
      }
    });

    // Check if all documents are verified
    const allDocumentsVerified = transfer.documents.every(
      doc => doc.verificationStatus === "verified"
    );

    if (allDocumentsVerified) {
      transfer.status = "verification_pending";
    }

    transfer.timeline.push({
      action: "Documents reviewed",
      performedBy: req.user._id,
      performedByRole: req.user.role,
      notes: `Reviewed ${documentReviews.length} document(s)`
    });

    await transfer.save();

    // Create application log entry
    await ApplicationLog.create({
      property: transfer.property,
      user: transfer.previousOwner,
      action: "transfer_documents_reviewed",
      status: transfer.status,
      performedBy: req.user._id,
      performedByRole: req.user.role,
      notes: `Transfer documents reviewed: ${documentReviews.length} document(s)`,
      metadata: {
        transferId: transfer._id,
        reviewCount: documentReviews.length
      }
    });

    res.json({ message: "Documents reviewed successfully", transfer });
  } catch (error) {
    console.error("Error reviewing transfer documents:", error);
    res.status(500).json({ message: "Server error while reviewing documents" });
  }
};

// @desc    Perform compliance checks
// @route   PUT /api/transfers/:id/compliance
// @access  Private (Admin/Land Officer)
export const performComplianceChecks = async (req, res) => {
  try {
    const { 
      ethiopianLawCompliance, 
      taxClearance, 
      fraudPrevention 
    } = req.body;

    const transfer = await PropertyTransfer.findById(req.params.id);
    if (!transfer) {
      return res.status(404).json({ message: "Transfer not found" });
    }

    // Update compliance checks
    if (ethiopianLawCompliance) {
      transfer.complianceChecks.ethiopianLawCompliance = {
        checked: true,
        checkedBy: req.user._id,
        checkedDate: new Date(),
        notes: ethiopianLawCompliance.notes
      };
    }

    if (taxClearance) {
      transfer.complianceChecks.taxClearance = {
        checked: true,
        checkedBy: req.user._id,
        checkedDate: new Date(),
        notes: taxClearance.notes
      };
    }

    if (fraudPrevention) {
      transfer.complianceChecks.fraudPrevention = {
        checked: true,
        checkedBy: req.user._id,
        checkedDate: new Date(),
        riskLevel: fraudPrevention.riskLevel,
        notes: fraudPrevention.notes
      };
    }

    transfer.timeline.push({
      action: "Compliance checks performed",
      performedBy: req.user._id,
      performedByRole: req.user.role,
      notes: "Ethiopian law compliance, tax clearance, and fraud prevention checks completed"
    });

    await transfer.save();

    // Create application log entry
    await ApplicationLog.create({
      property: transfer.property,
      user: transfer.previousOwner,
      action: "transfer_compliance_checked",
      status: transfer.status,
      performedBy: req.user._id,
      performedByRole: req.user.role,
      notes: "Transfer compliance checks completed",
      metadata: {
        transferId: transfer._id,
        complianceChecks: {
          ethiopianLaw: !!ethiopianLawCompliance,
          taxClearance: !!taxClearance,
          fraudPrevention: !!fraudPrevention
        }
      }
    });

    res.json({ message: "Compliance checks completed successfully", transfer });
  } catch (error) {
    console.error("Error performing compliance checks:", error);
    res.status(500).json({ message: "Server error while performing compliance checks" });
  }
};

// @desc    Approve/Reject transfer
// @route   PUT /api/transfers/:id/approve
// @access  Private (Admin/Land Officer)
export const approveTransfer = async (req, res) => {
  try {
    const { approvalStatus, notes } = req.body;

    const transfer = await PropertyTransfer.findById(req.params.id);
    if (!transfer) {
      return res.status(404).json({ message: "Transfer not found" });
    }

    // Add approval record
    const approval = {
      approverRole: req.user.role,
      approver: req.user._id,
      approvalStatus,
      approvalDate: new Date(),
      notes
    };

    // Define the full set of required roles statically
    const requiredApprovals = ["admin", "landOfficer"];

    transfer.approvals.push(approval);

    // Update transfer status based on approval
    if (approvalStatus === "approved") {
      // Check if all required approvals are received
      const receivedApprovals = transfer.approvals
        .filter(a => a.approvalStatus === "approved")
        .map(a => a.approverRole);

      const allApprovalsReceived = requiredApprovals.every(
        role => receivedApprovals.includes(role)
      );

      if (allApprovalsReceived) {
        transfer.status = "approved";
      }
    } else if (approvalStatus === "rejected") {
      transfer.status = "rejected";
    }

    transfer.timeline.push({
      action: `Transfer ${approvalStatus} by ${req.user.role}`,
      performedBy: req.user._id,
      performedByRole: req.user.role,
      notes: notes || `Transfer ${approvalStatus}`
    });

    await transfer.save();

    // Create application log entry
    await ApplicationLog.create({
      property: transfer.property,
      user: transfer.previousOwner,
      action: approvalStatus === "approved" ? "transfer_approved" : "transfer_rejected",
      status: transfer.status,
      performedBy: req.user._id,
      performedByRole: req.user.role,
      notes: notes || `Transfer ${approvalStatus} by ${req.user.role}`,
      metadata: {
        transferId: transfer._id,
        approvalStatus,
        approverRole: req.user.role
      }
    });

    res.json({
      message: `Transfer ${approvalStatus} successfully`,
      transfer
    });
  } catch (error) {
    console.error("Error approving/rejecting transfer:", error);
    res.status(500).json({ message: "Server error while processing approval" });
  }
};

// @desc    Complete transfer (change ownership)
// @route   PUT /api/transfers/:id/complete
// @access  Private (Admin)
export const completeTransfer = async (req, res) => {
  try {
    const transfer = await PropertyTransfer.findById(req.params.id);
    if (!transfer) {
      return res.status(404).json({ message: "Transfer not found" });
    }

    if (transfer.status !== "approved") {
      return res.status(400).json({
        message: "Transfer must be approved before completion"
      });
    }

    // Update property ownership
    const property = await Property.findById(transfer.property);
    if (!property) {
      return res.status(404).json({ message: "Property not found" });
    }

    // Add to ownership history
    const currentOwnership = property.ownershipHistory.find(
      h => !h.endDate
    );

    if (currentOwnership) {
      currentOwnership.endDate = new Date();
    }

    property.ownershipHistory.push({
      owner: transfer.newOwner,
      startDate: new Date(),
      transferType: transfer.transferType,
      transferReference: transfer._id
    });

    // Update property owner and transfer status
    property.owner = transfer.newOwner;
    property.isTransferred = true;
    property.currentTransfer = undefined;

    await property.save();

    // Update transfer status
    transfer.status = "completed";
    transfer.completionDate = new Date();
    transfer.timeline.push({
      action: "Transfer completed - ownership changed",
      performedBy: req.user._id,
      performedByRole: req.user.role,
      notes: "Property ownership successfully transferred"
    });

    await transfer.save();

    // Create application log entries for both users
    await ApplicationLog.create({
      property: transfer.property,
      user: transfer.previousOwner,
      action: "ownership_transferred",
      status: "completed",
      performedBy: req.user._id,
      performedByRole: req.user.role,
      notes: "Property ownership transferred to new owner",
      metadata: {
        transferId: transfer._id,
        newOwnerId: transfer.newOwner
      }
    });

    await ApplicationLog.create({
      property: transfer.property,
      user: transfer.newOwner,
      action: "ownership_transferred",
      status: "completed",
      performedBy: req.user._id,
      performedByRole: req.user.role,
      notes: "Property ownership received from previous owner",
      metadata: {
        transferId: transfer._id,
        previousOwnerId: transfer.previousOwner
      }
    });

    res.json({
      message: "Transfer completed successfully. Ownership has been changed.",
      transfer
    });
  } catch (error) {
    console.error("Error completing transfer:", error);
    res.status(500).json({ message: "Server error while completing transfer" });
  }
};
