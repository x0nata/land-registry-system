import Document from "../models/Document.js";
import Property from "../models/Property.js";
import ApplicationLog from "../models/ApplicationLog.js";
import { validationResult } from "express-validator";
import fs from "fs";
import { uploadToGridFS, uploadBufferToGridFS, deleteFromGridFS, getFileStream, getFileInfo } from "../config/gridfs.js";

// Helper function to check if all documents for a property are validated
const checkAllDocumentsValidated = async (propertyId) => {
  try {
    const property = await Property.findById(propertyId).populate('documents');
    if (!property || !property.documents || property.documents.length === 0) {
      return false; // No documents means not validated
    }

    const allValidated = property.documents.every(doc => doc.status === 'verified');

    if (allValidated && !property.documentsValidated) {
      // Update property status to documents_validated
      property.documentsValidated = true;
      property.status = 'documents_validated';
      await property.save();

      // Create application log
      await ApplicationLog.create({
        property: propertyId,
        user: property.owner,
        action: "all_documents_validated",
        status: "documents_validated",
        previousStatus: property.status,
        performedBy: null, // System action
        performedByRole: 'system',
        notes: "All documents have been validated"
      });
    }

    return allValidated;
  } catch (error) {
    console.error('Error checking document validation status:', error);
    return false;
  }
};

// @desc    Upload a document for a property
// @route   POST /api/documents/property/:propertyId
// @access  Private (User)
export const uploadDocument = async (req, res) => {
  try {
    console.log("=== UPLOAD REQUEST STARTED ===");
    console.log("Upload request received for property:", req.params.propertyId);
    console.log("User:", req.user._id, "Role:", req.user.role);
    console.log("Request body:", req.body);
    console.log("File info:", req.file ? {
      originalname: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size,
      path: req.file.path
    } : 'No file');

    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log("Validation errors:", errors.array());
      return res.status(400).json({ errors: errors.array() });
    }

    const property = await Property.findById(req.params.propertyId);

    if (!property) {
      return res.status(404).json({ message: "Property not found" });
    }

    // Check if user is the owner
    if (property.owner.toString() !== req.user._id.toString()) {
      return res
        .status(403)
        .json({
          message: "Not authorized to upload documents for this property",
        });
    }

    // Check if file was uploaded
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    let uploadResult;

    // Handle different storage types
    if (req.file.path && req.file.path.startsWith('gridfs://')) {
      // File is already in GridFS (production)
      uploadResult = {
        fileId: req.file.id || req.file.gridfsId,
        filename: req.file.filename,
        originalName: req.file.originalname,
        size: req.file.size
      };
    } else if (req.file.buffer) {
      // File is in memory buffer
      uploadResult = await uploadBufferToGridFS(
        req.file.buffer,
        req.file.originalname,
        {
          documentType: req.body.documentType,
          propertyId: property._id,
          ownerId: req.user._id,
          uploadDate: new Date()
        }
      );
    } else if (req.file.path) {
      // File is on disk (development)
      // Check if file exists
      if (!fs.existsSync(req.file.path)) {
        return res.status(400).json({
          message: "Uploaded file not found",
          filePath: req.file.path
        });
      }

      // Upload file to GridFS
      uploadResult = await uploadToGridFS(
        req.file.path,
        req.file.originalname,
        {
          documentType: req.body.documentType,
          propertyId: property._id,
          ownerId: req.user._id,
          uploadDate: new Date()
        }
      );

      // Remove file from local storage
      try {
        fs.unlinkSync(req.file.path);
      } catch (unlinkError) {
        console.warn("Warning: Could not delete temporary file:", unlinkError.message);
      }
    } else {
      return res.status(400).json({ message: "Invalid file upload format" });
    }

    // Create document in database
    const document = await Document.create({
      property: property._id,
      owner: req.user._id,
      documentType: req.body.documentType,
      documentName: req.body.documentName || req.file.originalname,
      fileId: uploadResult.fileId,
      filename: uploadResult.filename,
      fileType: req.file.mimetype,
      fileSize: req.file.size,
      status: "pending",
    });

    // Add document to property
    property.documents.push(document._id);
    await property.save();

    // Create application log
    await ApplicationLog.create({
      property: property._id,
      user: req.user._id,
      action: "document_uploaded",
      status: property.status,
      performedBy: req.user._id,
      performedByRole: req.user.role,
      notes: `Document uploaded: ${
        req.body.documentName || req.file.originalname
      }`,
    });

    res.status(201).json(document);
  } catch (error) {
    console.error("Error uploading document:", error);
    res.status(500).json({ message: "Server error while uploading document" });
  }
};

// @desc    Get all documents for a property
// @route   GET /api/documents/property/:propertyId
// @access  Private
export const getPropertyDocuments = async (req, res) => {
  try {
    const property = await Property.findById(req.params.propertyId);

    if (!property) {
      return res.status(404).json({ message: "Property not found" });
    }

    // Check if user is authorized to view documents (only owner can access)
    if (property.owner.toString() !== req.user._id.toString()) {
      return res
        .status(403)
        .json({
          message: "Not authorized to view documents for this property",
        });
    }

    const documents = await Document.find({ property: property._id }).sort({
      uploadDate: -1,
    });

    res.json(documents);
  } catch (error) {
    console.error("Error fetching property documents:", error);
    res.status(500).json({ message: "Server error while fetching documents" });
  }
};

// @desc    Get a document by ID
// @route   GET /api/documents/:id
// @access  Private
export const getDocumentById = async (req, res) => {
  try {
    const document = await Document.findById(req.params.id)
      .populate("property")
      .populate("owner", "fullName email nationalId")
      .populate("verifiedBy", "fullName email");

    if (!document) {
      return res.status(404).json({ message: "Document not found" });
    }

    // Check if user is authorized to view this document
    // Allow document owner, admin, and land officers to access
    if (
      document.owner._id.toString() !== req.user._id.toString() &&
      !["admin", "landOfficer"].includes(req.user.role)
    ) {
      return res
        .status(403)
        .json({ message: "Not authorized to view this document" });
    }

    res.json(document);
  } catch (error) {
    console.error("Error fetching document:", error);
    res.status(500).json({ message: "Server error while fetching document" });
  }
};

// @desc    Delete a document
// @route   DELETE /api/documents/:id
// @access  Private (User)
export const deleteDocument = async (req, res) => {
  try {
    const document = await Document.findById(req.params.id);

    if (!document) {
      return res.status(404).json({ message: "Document not found" });
    }

    // Check if user is the owner
    if (document.owner.toString() !== req.user._id.toString()) {
      return res
        .status(403)
        .json({ message: "Not authorized to delete this document" });
    }

    // Delete from GridFS
    try {
      await deleteFromGridFS(document.fileId);
    } catch (gridfsError) {
      console.warn("Warning: Could not delete file from GridFS:", gridfsError.message);
    }

    // Delete document from database
    await document.deleteOne();

    // Remove document from property
    await Property.updateOne(
      { _id: document.property },
      { $pull: { documents: document._id } }
    );

    // Create application log
    await ApplicationLog.create({
      property: document.property,
      user: document.owner,
      action: "document_deleted",
      status: "pending",
      performedBy: req.user._id,
      performedByRole: req.user.role,
      notes: `Document deleted: ${document.documentName}`,
    });

    res.json({ message: "Document removed" });
  } catch (error) {
    console.error("Error deleting document:", error);
    res.status(500).json({ message: "Server error while deleting document" });
  }
};

// @desc    Update a document (replace with new file)
// @route   PUT /api/documents/:id
// @access  Private (User)
export const updateDocument = async (req, res) => {
  try {
    const document = await Document.findById(req.params.id);

    if (!document) {
      return res.status(404).json({ message: "Document not found" });
    }

    // Check if user is the owner
    if (document.owner.toString() !== req.user._id.toString()) {
      return res
        .status(403)
        .json({ message: "Not authorized to update this document" });
    }

    // Check if file was uploaded
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    // Store previous version
    const previousVersion = {
      fileId: document.fileId,
      filename: document.filename,
      uploadDate: document.uploadDate,
      version: document.version,
    };

    let uploadResult;

    // Handle different storage types
    if (req.file.path && req.file.path.startsWith('gridfs://')) {
      // File is already in GridFS (production)
      uploadResult = {
        fileId: req.file.id || req.file.gridfsId,
        filename: req.file.filename,
        originalName: req.file.originalname,
        size: req.file.size
      };
    } else if (req.file.buffer) {
      // File is in memory buffer
      uploadResult = await uploadBufferToGridFS(
        req.file.buffer,
        req.file.originalname,
        {
          documentType: document.documentType,
          propertyId: document.property,
          ownerId: document.owner,
          uploadDate: new Date()
        }
      );
    } else if (req.file.path) {
      // File is on disk (development)
      // Check if file exists
      if (!fs.existsSync(req.file.path)) {
        return res.status(400).json({
          message: "Uploaded file not found",
          filePath: req.file.path
        });
      }

      // Upload new file to GridFS
      uploadResult = await uploadToGridFS(
        req.file.path,
        req.file.originalname,
        {
          documentType: document.documentType,
          propertyId: document.property,
          ownerId: document.owner,
          uploadDate: new Date()
        }
      );

      // Remove file from local storage
      try {
        fs.unlinkSync(req.file.path);
      } catch (unlinkError) {
        console.warn("Warning: Could not delete temporary file:", unlinkError.message);
      }
    } else {
      return res.status(400).json({ message: "Invalid file upload format" });
    }

    // Update document
    document.fileId = uploadResult.fileId;
    document.filename = uploadResult.filename;
    document.fileType = req.file.mimetype;
    document.fileSize = req.file.size;
    document.uploadDate = Date.now();
    document.status = "pending";
    document.verifiedBy = null;
    document.verificationDate = null;
    document.verificationNotes = "";
    document.version += 1;
    document.previousVersions.push(previousVersion);

    const updatedDocument = await document.save();

    // Create application log
    await ApplicationLog.create({
      property: document.property,
      user: document.owner,
      action: "document_updated",
      status: "pending",
      performedBy: req.user._id,
      performedByRole: req.user.role,
      notes: `Document updated: ${document.documentName}`,
    });

    res.json(updatedDocument);
  } catch (error) {
    console.error("Error updating document:", error);
    res.status(500).json({ message: "Server error while updating document" });
  }
};

// @desc    Download/view a document file
// @route   GET /api/documents/:id/download
// @access  Private
export const downloadDocument = async (req, res) => {
  try {
    console.log('=== DOWNLOAD REQUEST STARTED ===');
    console.log('Download request for document ID:', req.params.id);
    console.log('User requesting download:', req.user._id, 'Role:', req.user.role);
    console.log('Request timestamp:', new Date().toISOString());

    // Validate document ID format
    if (!req.params.id || req.params.id.length !== 24) {
      console.log('Invalid document ID format:', req.params.id);
      return res.status(400).json({ message: "Invalid document ID format" });
    }

    console.log('Searching for document in database...');
    const document = await Document.findById(req.params.id);

    if (!document) {
      console.log('Document not found:', req.params.id);
      return res.status(404).json({ message: "Document not found" });
    }

    console.log('Document found:', {
      id: document._id,
      filename: document.filename,
      fileId: document.fileId,
      owner: document.owner
    });

    // Check if user is authorized to view this document
    // Owner can always access, admin and land officers can access any document
    const isOwner = document.owner.toString() === req.user._id.toString();
    const isAdminOrLandOfficer = ['admin', 'landOfficer'].includes(req.user.role);

    if (!isOwner && !isAdminOrLandOfficer) {
      console.log('Authorization failed for user:', req.user._id, 'Role:', req.user.role);
      return res
        .status(403)
        .json({ message: "Not authorized to view this document" });
    }

    console.log('Authorization successful:', {
      userId: req.user._id,
      userRole: req.user.role,
      isOwner,
      isAdminOrLandOfficer
    });

    // Check if document has a valid fileId
    if (!document.fileId) {
      console.log('Document has no fileId:', document._id);
      return res.status(404).json({ message: "Document file not found" });
    }

    try {
      // Get file info from GridFS with timeout
      console.log('Getting file info from GridFS for fileId:', document.fileId);
      console.log('Document fileId type:', typeof document.fileId);
      console.log('Document fileId value:', document.fileId);

      // Validate fileId before proceeding
      if (!document.fileId) {
        throw new Error('Document has no fileId');
      }

      // Add timeout for file info retrieval
      const fileInfoPromise = getFileInfo(document.fileId);
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('File info retrieval timeout')), 10000); // 10 second timeout
      });

      const fileInfo = await Promise.race([fileInfoPromise, timeoutPromise]);
      console.log('File info retrieved:', {
        filename: fileInfo.filename,
        length: fileInfo.length,
        contentType: fileInfo.contentType || document.fileType
      });

      // Set appropriate headers
      const contentType = fileInfo.contentType || document.fileType || 'application/octet-stream';
      const filename = document.filename || fileInfo.filename || 'document';

      res.set({
        'Content-Type': contentType,
        'Content-Length': fileInfo.length,
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      });

      console.log('Headers set:', {
        'Content-Type': contentType,
        'Content-Length': fileInfo.length,
        'Content-Disposition': `attachment; filename="${filename}"`
      });

      // Stream the file with timeout handling
      const downloadStream = getFileStream(document.fileId);

      // Set up stream timeout
      const streamTimeout = setTimeout(() => {
        console.error('Stream timeout - destroying stream');
        downloadStream.destroy();
        if (!res.headersSent) {
          res.status(500).json({ message: 'Download timeout - please try again' });
        }
      }, 25000); // 25 second timeout for streaming

      downloadStream.on('error', (error) => {
        console.error('Error streaming file:', error);
        clearTimeout(streamTimeout);
        if (!res.headersSent) {
          res.status(500).json({ message: 'Error streaming file: ' + error.message });
        }
      });

      downloadStream.on('end', () => {
        console.log('File stream completed successfully');
        clearTimeout(streamTimeout);
      });

      downloadStream.on('close', () => {
        console.log('File stream closed');
        clearTimeout(streamTimeout);
      });

      // Handle client disconnect
      req.on('close', () => {
        console.log('Client disconnected, destroying stream');
        clearTimeout(streamTimeout);
        downloadStream.destroy();
      });

      downloadStream.pipe(res);

    } catch (gridfsError) {
      console.error('GridFS error:', gridfsError);
      if (!res.headersSent) {
        if (gridfsError.message.includes('Invalid file ID')) {
          res.status(400).json({ message: 'Invalid file ID format' });
        } else if (gridfsError.message.includes('File not found')) {
          res.status(404).json({ message: 'File not found in storage' });
        } else {
          res.status(500).json({ message: 'Storage error: ' + gridfsError.message });
        }
      }
    }

  } catch (error) {
    console.error("Error downloading document:", error);
    if (!res.headersSent) {
      res.status(500).json({ message: "Server error while downloading document: " + error.message });
    }
  }
};

// @desc    Preview a document file (inline view)
// @route   GET /api/documents/:id/preview
// @access  Private
export const previewDocument = async (req, res) => {
  try {
    console.log('=== PREVIEW REQUEST STARTED ===');
    console.log('Preview request for document ID:', req.params.id);
    console.log('User requesting preview:', req.user._id, 'Role:', req.user.role);
    console.log('Request timestamp:', new Date().toISOString());

    // Validate document ID format
    if (!req.params.id || req.params.id.length !== 24) {
      console.log('Invalid document ID format:', req.params.id);
      return res.status(400).json({ message: "Invalid document ID format" });
    }

    console.log('Searching for document in database...');
    const document = await Document.findById(req.params.id);

    if (!document) {
      console.log('Document not found:', req.params.id);
      return res.status(404).json({ message: "Document not found" });
    }

    console.log('Document found:', {
      id: document._id,
      filename: document.filename,
      fileId: document.fileId,
      owner: document.owner
    });

    // Check if user is authorized to view this document
    // Owner can always access, admin and land officers can access any document
    const isOwner = document.owner.toString() === req.user._id.toString();
    const isAdminOrLandOfficer = ['admin', 'landOfficer'].includes(req.user.role);

    if (!isOwner && !isAdminOrLandOfficer) {
      console.log('Authorization failed for user:', req.user._id, 'Role:', req.user.role);
      return res
        .status(403)
        .json({ message: "Not authorized to view this document" });
    }

    console.log('Authorization successful:', {
      userId: req.user._id,
      userRole: req.user.role,
      isOwner,
      isAdminOrLandOfficer
    });

    // Check if document has a valid fileId
    if (!document.fileId) {
      console.log('Document has no fileId:', document._id);
      return res.status(404).json({ message: "Document file not found" });
    }

    try {
      // Get file info from GridFS with timeout
      console.log('Getting file info from GridFS for fileId:', document.fileId);
      console.log('Document fileId type:', typeof document.fileId);
      console.log('Document fileId value:', document.fileId);

      // Validate fileId before proceeding
      if (!document.fileId) {
        throw new Error('Document has no fileId');
      }

      // Add timeout for file info retrieval
      const fileInfoPromise = getFileInfo(document.fileId);
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('File info retrieval timeout')), 10000); // 10 second timeout
      });

      const fileInfo = await Promise.race([fileInfoPromise, timeoutPromise]);
      console.log('File info retrieved:', {
        filename: fileInfo.filename,
        length: fileInfo.length,
        contentType: fileInfo.contentType || document.fileType
      });

      // Set appropriate headers for inline viewing
      const contentType = fileInfo.contentType || document.fileType || 'application/octet-stream';
      const filename = document.filename || fileInfo.filename || 'document';

      res.set({
        'Content-Type': contentType,
        'Content-Length': fileInfo.length,
        'Content-Disposition': `inline; filename="${filename}"`,
        'Cache-Control': 'private, max-age=3600', // Cache for 1 hour
        'X-Content-Type-Options': 'nosniff'
      });

      console.log('Preview headers set:', {
        'Content-Type': contentType,
        'Content-Length': fileInfo.length,
        'Content-Disposition': `inline; filename="${filename}"`
      });

      // Stream the file with timeout handling
      const previewStream = getFileStream(document.fileId);

      // Set up stream timeout
      const streamTimeout = setTimeout(() => {
        console.error('Preview stream timeout - destroying stream');
        previewStream.destroy();
        if (!res.headersSent) {
          res.status(500).json({ message: 'Preview timeout - please try again' });
        }
      }, 25000); // 25 second timeout for streaming

      previewStream.on('error', (error) => {
        console.error('Error streaming file for preview:', error);
        clearTimeout(streamTimeout);
        if (!res.headersSent) {
          res.status(500).json({ message: 'Error streaming file: ' + error.message });
        }
      });

      previewStream.on('end', () => {
        console.log('Preview stream completed successfully');
        clearTimeout(streamTimeout);
      });

      previewStream.on('close', () => {
        console.log('Preview stream closed');
        clearTimeout(streamTimeout);
      });

      // Handle client disconnect
      req.on('close', () => {
        console.log('Client disconnected, destroying preview stream');
        clearTimeout(streamTimeout);
        previewStream.destroy();
      });

      previewStream.pipe(res);

    } catch (gridfsError) {
      console.error('GridFS error during preview:', gridfsError);
      if (!res.headersSent) {
        if (gridfsError.message.includes('Invalid file ID')) {
          res.status(400).json({ message: 'Invalid file ID format' });
        } else if (gridfsError.message.includes('File not found')) {
          res.status(404).json({ message: 'File not found in storage' });
        } else {
          res.status(500).json({ message: 'Storage error: ' + gridfsError.message });
        }
      }
    }

  } catch (error) {
    console.error("Error previewing document:", error);
    if (!res.headersSent) {
      res.status(500).json({ message: "Server error while previewing document: " + error.message });
    }
  }
};

// @desc    Get all documents with filters (admin/land officer only)
// @route   GET /api/documents
// @access  Private (Admin, Land Officer)
export const getAllDocuments = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      documentType,
      propertyId,
      ownerId,
      search,
      sortBy = 'uploadDate',
      sortOrder = 'desc'
    } = req.query;

    // Build query
    const query = {};

    // Filter by status if provided
    if (status) {
      query.status = status;
    }

    // Filter by document type if provided
    if (documentType) {
      query.documentType = documentType;
    }

    // Filter by property if provided
    if (propertyId) {
      query.property = propertyId;
    }

    // Filter by owner if provided
    if (ownerId) {
      query.owner = ownerId;
    }

    // Search by document name
    if (search) {
      query.documentName = { $regex: search, $options: 'i' };
    }

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Sort options
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Execute query
    const documents = await Document.find(query)
      .populate('property', 'plotNumber location propertyType')
      .populate('owner', 'fullName email nationalId')
      .populate('verifiedBy', 'fullName email')
      .skip(skip)
      .limit(parseInt(limit))
      .sort(sortOptions);

    // Get total count for pagination
    const total = await Document.countDocuments(query);

    res.json({
      documents,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error("Error fetching documents:", error);
    res.status(500).json({ message: "Server error while fetching documents" });
  }
};

// @desc    Get all pending documents for verification
// @route   GET /api/documents/pending
// @access  Private (Admin, Land Officer)
export const getPendingDocuments = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      dashboard = false
    } = req.query;

    // For dashboard, return fewer items
    const actualLimit = dashboard === 'true' ? 5 : parseInt(limit);
    const skip = dashboard === 'true' ? 0 : (parseInt(page) - 1) * parseInt(limit);

    const pendingDocuments = await Document.find({ status: 'pending' })
      .populate('property', 'plotNumber location propertyType')
      .populate('owner', 'fullName email nationalId')
      .skip(skip)
      .limit(actualLimit)
      .sort({ uploadDate: 1 }); // Oldest first for review queue

    const total = await Document.countDocuments({ status: 'pending' });

    if (dashboard === 'true') {
      // For dashboard, return simple array
      res.json(pendingDocuments);
    } else {
      // For full page, return with pagination
      res.json({
        documents: pendingDocuments,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(total / parseInt(limit)),
        },
      });
    }
  } catch (error) {
    console.error("Error fetching pending documents:", error);
    res.status(500).json({ message: "Server error while fetching pending documents" });
  }
};

// @desc    Verify a document
// @route   PUT /api/documents/:id/verify
// @access  Private (Admin, Land Officer)
export const verifyDocument = async (req, res) => {
  try {
    const document = await Document.findById(req.params.id);

    if (!document) {
      return res.status(404).json({ message: "Document not found" });
    }

    // Update document
    document.status = 'verified';
    document.verifiedBy = req.user._id;
    document.verificationDate = Date.now();
    document.verificationNotes = req.body.notes || '';

    const updatedDocument = await document.save();

    // Check if all documents for the property are now validated
    await checkAllDocumentsValidated(document.property);

    // Create application log
    await ApplicationLog.create({
      property: document.property,
      user: document.owner,
      action: "document_verified",
      status: "verified",
      previousStatus: "pending",
      performedBy: req.user._id,
      performedByRole: req.user.role,
      notes: req.body.notes || "Document verified",
    });

    res.json(updatedDocument);
  } catch (error) {
    console.error("Error verifying document:", error);
    res.status(500).json({ message: "Server error while verifying document" });
  }
};

// @desc    Reject a document
// @route   PUT /api/documents/:id/reject
// @access  Private (Admin, Land Officer)
export const rejectDocument = async (req, res) => {
  try {
    const document = await Document.findById(req.params.id);

    if (!document) {
      return res.status(404).json({ message: "Document not found" });
    }

    // Update document
    document.status = 'rejected';
    document.verifiedBy = req.user._id;
    document.verificationDate = Date.now();
    document.verificationNotes = req.body.reason || '';

    const updatedDocument = await document.save();

    // Create application log
    await ApplicationLog.create({
      property: document.property,
      user: document.owner,
      action: "document_rejected",
      status: "rejected",
      previousStatus: "pending",
      performedBy: req.user._id,
      performedByRole: req.user.role,
      notes: req.body.reason || "Document rejected",
    });

    res.json(updatedDocument);
  } catch (error) {
    console.error("Error rejecting document:", error);
    res.status(500).json({ message: "Server error while rejecting document" });
  }
};

// @desc    Request document update
// @route   PUT /api/documents/:id/request-update
// @access  Private (Admin, Land Officer)
export const requestDocumentUpdate = async (req, res) => {
  try {
    const document = await Document.findById(req.params.id);

    if (!document) {
      return res.status(404).json({ message: "Document not found" });
    }

    // Update document
    document.status = 'needs_update';
    document.verifiedBy = req.user._id;
    document.verificationDate = Date.now();
    document.verificationNotes = req.body.reason || '';

    const updatedDocument = await document.save();

    // Create application log
    await ApplicationLog.create({
      property: document.property,
      user: document.owner,
      action: "document_update_requested",
      status: "needs_update",
      previousStatus: "pending",
      performedBy: req.user._id,
      performedByRole: req.user.role,
      notes: req.body.reason || "Document update requested",
    });

    res.json(updatedDocument);
  } catch (error) {
    console.error("Error requesting document update:", error);
    res.status(500).json({ message: "Server error while requesting document update" });
  }
};
