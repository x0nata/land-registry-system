import Property from "../models/Property.js";
import PropertyTransfer from "../models/PropertyTransfer.js";
import ApplicationLog from "../models/ApplicationLog.js";
import { validationResult } from "express-validator";

// @desc    Register a new property
// @route   POST /api/properties
// @access  Private (User)
export const registerProperty = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { location, plotNumber, area, propertyType } = req.body;

    // Check if property with this plot number already exists
    const propertyExists = await Property.findOne({ plotNumber });

    if (propertyExists) {
      return res
        .status(400)
        .json({ message: "Property with this plot number already exists" });
    }

    // Create new property
    const property = await Property.create({
      owner: req.user._id,
      location,
      plotNumber,
      area,
      propertyType,
      status: "pending",
    });

    if (property) {
      // Create application log for property registration
      await ApplicationLog.create({
        property: property._id,
        user: req.user._id,
        action: "application_submitted",
        status: "pending",
        performedBy: req.user._id,
        performedByRole: req.user.role,
        notes: "Property registration application submitted",
      });

      res.status(201).json(property);
    } else {
      res.status(400).json({ message: "Invalid property data" });
    }
  } catch (error) {
    console.error("Error registering property:", error);
    res
      .status(500)
      .json({ message: "Server error while registering property" });
  }
};

// @desc    Get all properties for the current user
// @route   GET /api/properties/user
// @access  Private (User)
export const getUserProperties = async (req, res) => {
  try {
    const properties = await Property.find({ owner: req.user._id }).sort({
      registrationDate: -1,
    });

    res.json(properties);
  } catch (error) {
    console.error("Error fetching user properties:", error);
    res.status(500).json({ message: "Server error while fetching properties" });
  }
};

// @desc    Get a property by ID
// @route   GET /api/properties/:id
// @access  Private
export const getPropertyById = async (req, res) => {
  try {
    const property = await Property.findById(req.params.id)
      .populate("owner", "fullName email nationalId")
      .populate("documents")
      .populate("payments")
      .populate("reviewedBy", "fullName email");

    if (!property) {
      return res.status(404).json({ message: "Property not found" });
    }

    // Check if user is authorized to view this property (only owner can access)
    if (property.owner._id.toString() !== req.user._id.toString()) {
      return res
        .status(403)
        .json({ message: "Not authorized to view this property" });
    }

    res.json(property);
  } catch (error) {
    console.error("Error fetching property:", error);
    res.status(500).json({ message: "Server error while fetching property" });
  }
};

// @desc    Update a property
// @route   PUT /api/properties/:id
// @access  Private (User)
export const updateProperty = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const property = await Property.findById(req.params.id);

    if (!property) {
      return res.status(404).json({ message: "Property not found" });
    }

    // Check if user is the owner
    if (property.owner.toString() !== req.user._id.toString()) {
      return res
        .status(403)
        .json({ message: "Not authorized to update this property" });
    }

    // Check if property is in a state that can be updated
    if (!["pending", "rejected", "needs_update"].includes(property.status)) {
      return res.status(400).json({
        message: "Property cannot be updated in its current status",
      });
    }

    // Update property fields
    property.location = req.body.location || property.location;
    property.area = req.body.area || property.area;
    property.propertyType = req.body.propertyType || property.propertyType;
    property.lastUpdated = Date.now();

    // If property was rejected or needs update, set status back to pending
    if (["rejected", "needs_update"].includes(property.status)) {
      property.status = "pending";
    }

    const updatedProperty = await property.save();

    // Create application log
    await ApplicationLog.create({
      property: property._id,
      user: req.user._id,
      action: "application_updated",
      status: property.status,
      previousStatus: property.status,
      performedBy: req.user._id,
      performedByRole: req.user.role,
      notes: "Property information updated",
    });

    res.json(updatedProperty);
  } catch (error) {
    console.error("Error updating property:", error);
    res.status(500).json({ message: "Server error while updating property" });
  }
};

// @desc    Delete a property
// @route   DELETE /api/properties/:id
// @access  Private (User)
export const deleteProperty = async (req, res) => {
  try {
    const property = await Property.findById(req.params.id);

    if (!property) {
      return res.status(404).json({ message: "Property not found" });
    }

    // Check if user is the owner
    if (
      property.owner.toString() !== req.user._id.toString() &&
      req.user.role !== "admin"
    ) {
      return res
        .status(403)
        .json({ message: "Not authorized to delete this property" });
    }

    // Check if property is in a state that can be deleted
    if (!["pending", "rejected"].includes(property.status)) {
      return res.status(400).json({
        message: "Property cannot be deleted in its current status",
      });
    }

    await property.deleteOne();

    // Create application log
    await ApplicationLog.create({
      property: property._id,
      user: req.user._id,
      action: "application_deleted",
      status: "deleted",
      previousStatus: property.status,
      performedBy: req.user._id,
      performedByRole: req.user.role,
      notes: "Property registration application deleted",
    });

    res.json({ message: "Property removed" });
  } catch (error) {
    console.error("Error deleting property:", error);
    res.status(500).json({ message: "Server error while deleting property" });
  }
};

// @desc    Get all properties (admin/land officer)
// @route   GET /api/properties
// @access  Private (Admin, Land Officer)
export const getAllProperties = async (req, res) => {
  try {
    const {
      status,
      propertyType,
      subCity,
      kebele,
      search,
      page = 1,
      limit = 10,
    } = req.query;

    // Build query
    const query = {};

    // Filter by status if provided
    if (status) {
      query.status = status;
    }

    // Filter by property type if provided
    if (propertyType) {
      query.propertyType = propertyType;
    }

    // Filter by location if provided
    if (subCity || kebele) {
      query.location = {};
      if (subCity) query.location.subCity = subCity;
      if (kebele) query.location.kebele = kebele;
    }

    // Search by plot number or owner's national ID
    if (search) {
      query.$or = [{ plotNumber: { $regex: search, $options: "i" } }];
    }

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Execute query
    const properties = await Property.find(query)
      .populate("owner", "fullName email nationalId")
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ registrationDate: -1 });

    // Get total count for pagination
    const total = await Property.countDocuments(query);

    res.json({
      properties,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error("Error fetching properties:", error);
    res.status(500).json({ message: "Server error while fetching properties" });
  }
};

// @desc    Get pending properties for review
// @route   GET /api/properties/pending
// @access  Private (Admin, Land Officer)
export const getPendingProperties = async (req, res) => {
  try {
    const pendingProperties = await Property.find({ status: "pending" })
      .populate("owner", "fullName email nationalId")
      .sort({ registrationDate: 1 });

    res.json(pendingProperties);
  } catch (error) {
    console.error("Error fetching pending properties:", error);
    res
      .status(500)
      .json({ message: "Server error while fetching pending properties" });
  }
};

// @desc    Get properties assigned to the current land officer
// @route   GET /api/properties/assigned
// @access  Private (Land Officer)
export const getAssignedProperties = async (req, res) => {
  try {
    const {
      status,
      propertyType,
      subCity,
      kebele,
      search,
      page = 1,
      limit = 10,
    } = req.query;

    // Build query for properties assigned to this land officer
    // For now, we'll return all properties that need review (pending, under_review)
    // In a real system, you might have an assignedTo field
    const query = {
      status: { $in: ["pending", "under_review"] }
    };

    // Filter by status if provided
    if (status) {
      query.status = status;
    }

    // Filter by property type if provided
    if (propertyType) {
      query.propertyType = propertyType;
    }

    // Filter by location if provided
    if (subCity || kebele) {
      query.location = {};
      if (subCity) query.location.subCity = subCity;
      if (kebele) query.location.kebele = kebele;
    }

    // Search by plot number or owner's national ID
    if (search) {
      query.$or = [{ plotNumber: { $regex: search, $options: "i" } }];
    }

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Execute query
    const properties = await Property.find(query)
      .populate("owner", "fullName email nationalId")
      .populate("documents")
      .populate("reviewedBy", "fullName email")
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ registrationDate: 1 }); // Oldest first for review queue

    // Get total count for pagination
    const total = await Property.countDocuments(query);

    res.json({
      properties,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error("Error fetching assigned properties:", error);
    res.status(500).json({ message: "Server error while fetching assigned properties" });
  }
};

// @desc    Approve a property
// @route   PUT /api/properties/:id/approve
// @access  Private (Admin, Land Officer)
export const approveProperty = async (req, res) => {
  try {
    const property = await Property.findById(req.params.id).populate('documents');

    if (!property) {
      return res.status(404).json({ message: "Property not found" });
    }

    // Check if all documents are validated
    if (!property.documentsValidated) {
      return res.status(400).json({
        message: "Cannot approve property. All documents must be validated first."
      });
    }

    // Check if payment is completed
    if (!property.paymentCompleted) {
      return res.status(400).json({
        message: "Cannot approve property. Payment must be completed first."
      });
    }

    // Update property status
    property.status = "approved";
    property.reviewedBy = req.user._id;
    property.reviewNotes = req.body.notes || "";
    property.lastUpdated = Date.now();

    const updatedProperty = await property.save();

    // Create application log
    await ApplicationLog.create({
      property: property._id,
      user: property.owner,
      action: "application_approved",
      status: "approved",
      previousStatus: property.status,
      performedBy: req.user._id,
      performedByRole: req.user.role,
      notes: req.body.notes || "Property registration approved",
    });

    res.json(updatedProperty);
  } catch (error) {
    console.error("Error approving property:", error);
    res.status(500).json({ message: "Server error while approving property" });
  }
};

// @desc    Reject a property
// @route   PUT /api/properties/:id/reject
// @access  Private (Admin, Land Officer)
export const rejectProperty = async (req, res) => {
  try {
    const property = await Property.findById(req.params.id);

    if (!property) {
      return res.status(404).json({ message: "Property not found" });
    }

    // Update property status
    property.status = "rejected";
    property.reviewedBy = req.user._id;
    property.reviewNotes = req.body.reason || "";
    property.lastUpdated = Date.now();

    const updatedProperty = await property.save();

    // Create application log
    await ApplicationLog.create({
      property: property._id,
      user: property.owner,
      action: "application_rejected",
      status: "rejected",
      previousStatus: property.status,
      performedBy: req.user._id,
      performedByRole: req.user.role,
      notes: req.body.reason || "Property registration rejected",
    });

    res.json(updatedProperty);
  } catch (error) {
    console.error("Error rejecting property:", error);
    res.status(500).json({ message: "Server error while rejecting property" });
  }
};

// @desc    Set property status to under review
// @route   PUT /api/properties/:id/review
// @access  Private (Admin, Land Officer)
export const setPropertyUnderReview = async (req, res) => {
  try {
    const property = await Property.findById(req.params.id);

    if (!property) {
      return res.status(404).json({ message: "Property not found" });
    }

    // Check if property is in a state that can be reviewed
    if (property.status !== "pending") {
      return res.status(400).json({
        message: "Property cannot be set to under review in its current status",
      });
    }

    // Update property status
    property.status = "under_review";
    property.reviewedBy = req.user._id;
    property.lastUpdated = Date.now();

    const updatedProperty = await property.save();

    // Create application log
    await ApplicationLog.create({
      property: property._id,
      user: property.owner,
      action: "status_changed",
      status: "under_review",
      previousStatus: "pending",
      performedBy: req.user._id,
      performedByRole: req.user.role,
      notes: "Property registration under review",
    });

    res.json(updatedProperty);
  } catch (error) {
    console.error("Error setting property under review:", error);
    res
      .status(500)
      .json({ message: "Server error while updating property status" });
  }
};

// @desc    Get property transfer history
// @route   GET /api/properties/:id/transfers
// @access  Private (Admin, Land Officer)
export const getPropertyTransferHistory = async (req, res) => {
  try {
    const property = await Property.findById(req.params.id);

    if (!property) {
      return res.status(404).json({ message: "Property not found" });
    }

    // Check if user is authorized to view this property's transfer history
    if (
      property.owner.toString() !== req.user._id.toString() &&
      !["admin", "landOfficer"].includes(req.user.role)
    ) {
      return res
        .status(403)
        .json({ message: "Not authorized to view this property's transfer history" });
    }

    // Get all transfers for this property
    const transfers = await PropertyTransfer.find({ property: req.params.id })
      .populate('previousOwner', 'fullName email phoneNumber nationalId')
      .populate('newOwner', 'fullName email phoneNumber nationalId')
      .populate('timeline.performedBy', 'fullName')
      .populate('approvals.approver', 'fullName')
      .populate('complianceChecks.ethiopianLawCompliance.checkedBy', 'fullName')
      .populate('complianceChecks.taxClearance.checkedBy', 'fullName')
      .populate('complianceChecks.fraudPrevention.checkedBy', 'fullName')
      .sort({ initiationDate: -1 });

    // Get current transfer if any
    const currentTransfer = transfers.find(transfer =>
      ['initiated', 'documents_pending', 'under_review', 'verification_pending', 'approved'].includes(transfer.status)
    );

    // Get completed transfers
    const completedTransfers = transfers.filter(transfer =>
      transfer.status === 'completed'
    );

    // Get rejected/cancelled transfers
    const rejectedTransfers = transfers.filter(transfer =>
      ['rejected', 'cancelled'].includes(transfer.status)
    );

    res.json({
      property: {
        _id: property._id,
        plotNumber: property.plotNumber,
        location: property.location,
        propertyType: property.propertyType,
        area: property.area
      },
      currentTransfer,
      completedTransfers,
      rejectedTransfers,
      totalTransfers: transfers.length,
      transferHistory: transfers
    });
  } catch (error) {
    console.error("Error fetching property transfer history:", error);
    res.status(500).json({ message: "Server error while fetching transfer history" });
  }
};
