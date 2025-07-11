import multer from "multer";
import { GridFSBucket } from "mongodb";
import mongoose from "mongoose";
import { getGridFSBucket } from "./gridfs.js";

// File filter function
const fileFilter = (req, file, cb) => {
  // Allowed file types
  const allowedTypes = [
    'image/jpeg',
    'image/jpg', 
    'image/png',
    'image/gif',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain'
  ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`File type ${file.mimetype} is not allowed. Allowed types: ${allowedTypes.join(', ')}`), false);
  }
};

// GridFS storage engine
const gridfsStorage = {
  _handleFile: (req, file, cb) => {
    try {
      const bucket = getGridFSBucket();
      if (!bucket) {
        return cb(new Error('GridFS bucket not available'));
      }

      // Generate unique filename
      const filename = `${Date.now()}-${Math.round(Math.random() * 1E9)}-${file.originalname}`;
      
      // Create upload stream
      const uploadStream = bucket.openUploadStream(filename, {
        metadata: {
          originalName: file.originalname,
          mimetype: file.mimetype,
          uploadedBy: req.user?.id || 'anonymous',
          uploadedAt: new Date()
        }
      });

      // Handle upload completion
      uploadStream.on('finish', () => {
        cb(null, {
          filename: filename,
          originalname: file.originalname,
          mimetype: file.mimetype,
          size: uploadStream.length,
          id: uploadStream.id,
          gridfsId: uploadStream.id
        });
      });

      // Handle upload errors
      uploadStream.on('error', (error) => {
        cb(error);
      });

      // Pipe file data to GridFS
      file.stream.pipe(uploadStream);

    } catch (error) {
      cb(error);
    }
  },
  
  _removeFile: (req, file, cb) => {
    try {
      const bucket = getGridFSBucket();
      if (!bucket && file.id) {
        bucket.delete(file.id, cb);
      } else {
        cb();
      }
    } catch (error) {
      cb(error);
    }
  }
};

// Memory storage for development/testing
const memoryStorage = multer.memoryStorage();

// Disk storage for local development
const diskStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + '-' + file.originalname);
  }
});

// Determine storage based on environment
const getStorage = () => {
  if (process.env.NODE_ENV === 'production' || process.env.VERCEL) {
    return gridfsStorage;
  } else if (process.env.USE_MEMORY_STORAGE === 'true') {
    return memoryStorage;
  } else {
    return diskStorage;
  }
};

// File size limits (in bytes)
const limits = {
  fileSize: 10 * 1024 * 1024, // 10MB
  files: 5, // Maximum 5 files per request
  fields: 10 // Maximum 10 non-file fields
};

// Create multer instance
const upload = multer({
  storage: getStorage(),
  fileFilter: fileFilter,
  limits: limits
});

// Single file upload
const uploadSingle = (fieldName) => upload.single(fieldName);

// Multiple files upload
const uploadMultiple = (fieldName, maxCount = 5) => upload.array(fieldName, maxCount);

// Mixed fields upload
const uploadFields = (fields) => upload.fields(fields);

// Error handler for multer errors
const handleMulterError = (error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    switch (error.code) {
      case 'LIMIT_FILE_SIZE':
        return res.status(400).json({
          success: false,
          message: `File too large. Maximum size is ${limits.fileSize / (1024 * 1024)}MB`
        });
      case 'LIMIT_FILE_COUNT':
        return res.status(400).json({
          success: false,
          message: `Too many files. Maximum is ${limits.files} files`
        });
      case 'LIMIT_UNEXPECTED_FILE':
        return res.status(400).json({
          success: false,
          message: 'Unexpected file field'
        });
      default:
        return res.status(400).json({
          success: false,
          message: `Upload error: ${error.message}`
        });
    }
  } else if (error) {
    return res.status(400).json({
      success: false,
      message: error.message
    });
  }
  next();
};

export {
  upload,
  uploadSingle,
  uploadMultiple,
  uploadFields,
  handleMulterError,
  fileFilter,
  limits
};
