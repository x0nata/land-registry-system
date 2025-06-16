import Document from "../models/Document.js";
import Property from "../models/Property.js";
import ApplicationLog from "../models/ApplicationLog.js";
import { validationResult } from "express-validator";
import fs from "fs";
import { uploadToGridFS, deleteFromGridFS, getFileStream, getFileInfo, fileExists } from "../config/gridfs.js";

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
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
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

    // Check if file exists
    if (!fs.existsSync(req.file.path)) {
      return res.status(400).json({
        message: "Uploaded file not found",
        filePath: req.file.path
      });
    }

    // Upload file to GridFS
    const uploadResult = await uploadToGridFS(
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

    // Check if user is authorized to view documents
    if (
      property.owner.toString() !== req.user._id.toString() &&
      !["admin", "landOfficer"].includes(req.user.role)
    ) {
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
    if (
      document.owner.toString() !== req.user._id.toString() &&
      req.user.role !== "admin"
    ) {
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

    // Check if file exists
    if (!fs.existsSync(req.file.path)) {
      return res.status(400).json({
        message: "Uploaded file not found",
        filePath: req.file.path
      });
    }

    // Upload new file to GridFS
    const uploadResult = await uploadToGridFS(
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
      search
    } = req.query;

    // Build filter object
    const filter = {};

    if (status && status !== 'all') {
      if (status === 'pending') {
        filter.status = 'pending';
      } else if (status === 'verified') {
        filter.status = 'verified';
      } else if (status === 'rejected') {
        filter.status = 'rejected';
      } else if (status === 'needs_update') {
        filter.status = 'needs_update';
      }
    }

    if (documentType && documentType !== 'all') {
      filter.documentType = documentType;
    }

    // Build search filter
    let searchFilter = {};
    if (search) {
      searchFilter = {
        $or: [
          { documentName: { $regex: search, $options: 'i' } },
          { documentType: { $regex: search, $options: 'i' } }
        ]
      };
    }

    // Combine filters
    const finalFilter = { ...filter, ...searchFilter };

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Get documents with pagination
    const documents = await Document.find(finalFilter)
      .populate("property", "plotNumber location propertyType area")
      .populate("owner", "fullName email nationalId")
      .populate("verifiedBy", "fullName email")
      .sort({ uploadDate: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Get total count for pagination
    const total = await Document.countDocuments(finalFilter);
    const totalPages = Math.ceil(total / parseInt(limit));

    res.json({
      documents,
      total,
      totalPages,
      currentPage: parseInt(page),
      hasNextPage: parseInt(page) < totalPages,
      hasPrevPage: parseInt(page) > 1
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
    const pendingDocuments = await Document.find({ status: "pending" })
      .populate("property")
      .populate("owner", "fullName email nationalId")
      .sort({ uploadDate: 1 });

    res.json(pendingDocuments);
  } catch (error) {
    console.error("Error fetching pending documents:", error);
    res
      .status(500)
      .json({ message: "Server error while fetching pending documents" });
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
    document.status = "verified";
    document.verifiedBy = req.user._id;
    document.verificationDate = Date.now();
    document.verificationNotes = req.body.notes || "";

    const updatedDocument = await document.save();

    // Create application log
    await ApplicationLog.create({
      property: document.property,
      user: document.owner,
      action: "document_verified",
      status: "verified",
      previousStatus: "pending",
      performedBy: req.user._id,
      performedByRole: req.user.role,
      notes: req.body.notes || `Document verified: ${document.documentName}`,
    });

    // Check if all documents for this property are now validated
    await checkAllDocumentsValidated(document.property);

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
    document.status = "rejected";
    document.verifiedBy = req.user._id;
    document.verificationDate = Date.now();
    document.verificationNotes = req.body.reason || "";

    const updatedDocument = await document.save();

    // Reset property validation status since a document was rejected
    const property = await Property.findById(document.property);
    if (property && property.documentsValidated) {
      property.documentsValidated = false;
      property.status = 'documents_pending';
      await property.save();
    }

    // Create application log
    await ApplicationLog.create({
      property: document.property,
      user: document.owner,
      action: "document_rejected",
      status: "rejected",
      previousStatus: "pending",
      performedBy: req.user._id,
      performedByRole: req.user.role,
      notes: req.body.reason || `Document rejected: ${document.documentName}`,
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
    document.status = "needs_update";
    document.verifiedBy = req.user._id;
    document.verificationDate = Date.now();
    document.verificationNotes = req.body.reason || "";

    const updatedDocument = await document.save();

    // Create application log
    await ApplicationLog.create({
      property: document.property,
      user: document.owner,
      action: "document_needs_update",
      status: "needs_update",
      previousStatus: document.status,
      performedBy: req.user._id,
      performedByRole: req.user.role,
      notes:
        req.body.reason ||
        `Document update requested: ${document.documentName}`,
    });

    res.json(updatedDocument);
  } catch (error) {
    console.error("Error requesting document update:", error);
    res
      .status(500)
      .json({ message: "Server error while requesting document update" });
  }
};

// @desc    Download/view a document file
// @route   GET /api/documents/:id/download
// @access  Private
export const downloadDocument = async (req, res) => {
  try {
    console.log('Download request for document ID:', req.params.id);
    console.log('User requesting download:', req.user._id, 'Role:', req.user.role);

    const document = await Document.findById(req.params.id);

    if (!document) {
      console.log('Document not found:', req.params.id);
      return res.status(404).json({ message: "Document not found" });
    }

    console.log('Document found:', document._id, 'Owner:', document.owner, 'FileId:', document.fileId);
    console.log('Document details:', {
      documentName: document.documentName,
      filename: document.filename,
      fileType: document.fileType,
      fileSize: document.fileSize,
      status: document.status
    });

    // Check if user is authorized to view this document
    if (
      document.owner.toString() !== req.user._id.toString() &&
      !["admin", "landOfficer"].includes(req.user.role)
    ) {
      console.log('Authorization failed for user:', req.user._id);
      return res
        .status(403)
        .json({ message: "Not authorized to view this document" });
    }

    try {
      // Check if file exists first
      console.log('Checking if file exists in GridFS for fileId:', document.fileId);
      const exists = await fileExists(document.fileId);

      if (!exists) {
        console.log('File not found in GridFS:', document.fileId);
        return res.status(404).json({ message: 'File not found in storage' });
      }

      // Get file info from GridFS
      console.log('Getting file info from GridFS for fileId:', document.fileId);
      const fileInfo = await getFileInfo(document.fileId);
      console.log('File info retrieved:', {
        id: fileInfo._id,
        filename: fileInfo.filename,
        length: fileInfo.length,
        contentType: fileInfo.contentType
      });

      // Determine the correct content type
      let contentType = document.fileType || fileInfo.contentType;
      if (!contentType) {
        // Fallback based on file extension
        const ext = document.filename.toLowerCase().split('.').pop();
        switch (ext) {
          case 'pdf':
            contentType = 'application/pdf';
            break;
          case 'jpg':
          case 'jpeg':
            contentType = 'image/jpeg';
            break;
          case 'png':
            contentType = 'image/png';
            break;
          case 'gif':
            contentType = 'image/gif';
            break;
          case 'doc':
            contentType = 'application/msword';
            break;
          case 'docx':
            contentType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
            break;
          default:
            contentType = 'application/octet-stream';
        }
      }

      console.log('Using content type for download:', contentType);

      // Set appropriate headers
      res.set({
        'Content-Type': contentType,
        'Content-Length': fileInfo.length,
        'Content-Disposition': `attachment; filename="${document.filename}"`,
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      });

      console.log('Headers set, starting file stream...');

      // Create download stream with timeout
      const downloadStream = getFileStream(document.fileId);
      let streamStarted = false;
      let streamCompleted = false;

      // Set a timeout for the stream
      const streamTimeout = setTimeout(() => {
        if (!streamCompleted) {
          console.error('Stream timeout - destroying stream');
          downloadStream.destroy();
          if (!res.headersSent) {
            res.status(500).json({ message: 'Download timeout' });
          } else {
            // If headers are already sent, just end the response
            console.error('Headers already sent, cannot send timeout JSON. Ending response.');
            res.end();
          }
        }
      }, 30000); // 30 second timeout

      downloadStream.on('error', (error) => {
        console.error('Error streaming file:', error);
        clearTimeout(streamTimeout);
        streamCompleted = true;
        if (!res.headersSent) {
          res.status(500).json({ message: 'Error streaming file: ' + error.message });
        } else {
          // If headers are already sent, we can't send JSON, just end the response
          console.error('Headers already sent, cannot send error JSON. Ending response.');
          res.end();
        }
      });

      downloadStream.on('data', (chunk) => {
        if (!streamStarted) {
          console.log('First chunk received, stream started successfully');
          streamStarted = true;
        }
      });

      downloadStream.on('end', () => {
        console.log('File stream completed successfully');
        clearTimeout(streamTimeout);
        streamCompleted = true;
      });

      downloadStream.on('close', () => {
        console.log('Download stream closed');
        clearTimeout(streamTimeout);
        streamCompleted = true;
      });

      // Pipe the stream to response
      downloadStream.pipe(res);

    } catch (gridfsError) {
      console.error('GridFS error:', gridfsError);
      if (!res.headersSent) {
        res.status(500).json({ message: 'File not found in storage: ' + gridfsError.message });
      }
    }

  } catch (error) {
    console.error("Error downloading document:", error);
    res.status(500).json({ message: "Server error while downloading document" });
  }
};

// @desc    Preview a document file (inline display)
// @route   GET /api/documents/:id/preview
// @access  Private
export const previewDocument = async (req, res) => {
  try {
    console.log('Preview request for document ID:', req.params.id);
    console.log('User requesting preview:', req.user._id, 'Role:', req.user.role);

    const document = await Document.findById(req.params.id);

    if (!document) {
      console.log('Document not found:', req.params.id);
      return res.status(404).json({ message: "Document not found" });
    }

    console.log('Document found:', document._id, 'Owner:', document.owner, 'FileId:', document.fileId);
    console.log('Document details:', {
      documentName: document.documentName,
      filename: document.filename,
      fileType: document.fileType,
      fileSize: document.fileSize,
      status: document.status
    });

    // Check if user is authorized to preview this document
    if (
      document.owner.toString() !== req.user._id.toString() &&
      !["admin", "landOfficer"].includes(req.user.role)
    ) {
      console.log('Authorization failed for user:', req.user._id);
      return res
        .status(403)
        .json({ message: "Not authorized to preview this document" });
    }

    try {
      // Check if file exists first
      console.log('Checking if file exists in GridFS for fileId:', document.fileId);
      const exists = await fileExists(document.fileId);

      if (!exists) {
        console.log('File not found in GridFS:', document.fileId);
        return res.status(404).json({ message: 'File not found in storage' });
      }

      // Get file info from GridFS
      console.log('Getting file info from GridFS for fileId:', document.fileId);
      const fileInfo = await getFileInfo(document.fileId);
      console.log('File info retrieved for preview:', {
        id: fileInfo._id,
        filename: fileInfo.filename,
        length: fileInfo.length,
        contentType: fileInfo.contentType
      });

      // Determine the correct content type
      let contentType = document.fileType || fileInfo.contentType;
      if (!contentType) {
        // Fallback based on file extension
        const ext = document.filename.toLowerCase().split('.').pop();
        switch (ext) {
          case 'pdf':
            contentType = 'application/pdf';
            break;
          case 'jpg':
          case 'jpeg':
            contentType = 'image/jpeg';
            break;
          case 'png':
            contentType = 'image/png';
            break;
          case 'gif':
            contentType = 'image/gif';
            break;
          case 'doc':
            contentType = 'application/msword';
            break;
          case 'docx':
            contentType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
            break;
          default:
            contentType = 'application/octet-stream';
        }
      }

      console.log('Using content type for preview:', contentType);

      // Set appropriate headers for inline display
      res.set({
        'Content-Type': contentType,
        'Content-Length': fileInfo.length,
        'Content-Disposition': `inline; filename="${document.filename}"`,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
        'X-Content-Type-Options': 'nosniff'
      });

      console.log('Headers set for preview, starting file stream...');

      // Create preview stream with timeout
      const previewStream = getFileStream(document.fileId);
      let streamStarted = false;
      let streamCompleted = false;

      // Set a timeout for the stream
      const streamTimeout = setTimeout(() => {
        if (!streamCompleted) {
          console.error('Preview stream timeout - destroying stream');
          previewStream.destroy();
          if (!res.headersSent) {
            res.status(500).json({ message: 'Preview timeout' });
          } else {
            // If headers are already sent, just end the response
            console.error('Headers already sent, cannot send timeout JSON. Ending response.');
            res.end();
          }
        }
      }, 30000); // 30 second timeout

      previewStream.on('error', (error) => {
        console.error('Error streaming file for preview:', error);
        clearTimeout(streamTimeout);
        streamCompleted = true;
        if (!res.headersSent) {
          res.status(500).json({ message: 'Error streaming file: ' + error.message });
        } else {
          // If headers are already sent, we can't send JSON, just end the response
          console.error('Headers already sent, cannot send error JSON. Ending response.');
          res.end();
        }
      });

      previewStream.on('data', (chunk) => {
        if (!streamStarted) {
          console.log('First chunk received for preview, stream started successfully');
          streamStarted = true;
        }
      });

      previewStream.on('end', () => {
        console.log('File preview stream completed successfully');
        clearTimeout(streamTimeout);
        streamCompleted = true;
      });

      previewStream.on('close', () => {
        console.log('Preview stream closed');
        clearTimeout(streamTimeout);
        streamCompleted = true;
      });

      // Pipe the stream to response
      previewStream.pipe(res);

    } catch (gridfsError) {
      console.error('GridFS error during preview:', gridfsError);
      if (!res.headersSent) {
        res.status(500).json({ message: 'File not found in storage: ' + gridfsError.message });
      }
    }

  } catch (error) {
    console.error("Error previewing document:", error);
    res.status(500).json({ message: "Server error while previewing document" });
  }
};
