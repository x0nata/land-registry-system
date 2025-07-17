import mongoose from "mongoose";
import { GridFSBucket } from "mongodb";

let gfs;
let gridfsBucket;

// Initialize GridFS
const initGridFS = () => {
  try {
    if (mongoose.connection.readyState === 1) {
      // Create GridFS bucket
      gridfsBucket = new GridFSBucket(mongoose.connection.db, {
        bucketName: 'uploads'
      });
      
      gfs = gridfsBucket;
      
      console.log('✅ GridFS initialized successfully');
      return true;
    } else {
      console.warn('⚠️ Cannot initialize GridFS - database not connected');
      return false;
    }
  } catch (error) {
    console.error('❌ GridFS initialization failed:', error.message);
    return false;
  }
};

// Get GridFS instance
const getGridFS = () => {
  if (!gfs) {
    console.warn('⚠️ GridFS not initialized, attempting to initialize...');
    initGridFS();
  }
  return gfs;
};

// Get GridFS bucket
const getGridFSBucket = () => {
  if (!gridfsBucket) {
    console.warn('⚠️ GridFS bucket not initialized, attempting to initialize...');
    initGridFS();
  }
  return gridfsBucket;
};

// Check if GridFS is ready
const isGridFSReady = () => {
  return !!(gfs && gridfsBucket && mongoose.connection.readyState === 1);
};

// Delete file from GridFS
const deleteFromGridFS = async (fileId) => {
  try {
    const bucket = getGridFSBucket();
    if (!bucket) {
      throw new Error('GridFS bucket not available');
    }
    
    await bucket.delete(new mongoose.Types.ObjectId(fileId));
    console.log(`✅ File ${fileId} deleted from GridFS`);
    return true;
  } catch (error) {
    console.error(`❌ Failed to delete file ${fileId} from GridFS:`, error.message);
    throw error;
  }
};

// Get file stream from GridFS
const getFileStream = (fileId) => {
  try {
    const bucket = getGridFSBucket();
    if (!bucket) {
      throw new Error('GridFS bucket not available');
    }

    // Validate fileId
    if (!fileId) {
      throw new Error('File ID is required');
    }

    // Convert to ObjectId if it's a string
    let objectId;
    try {
      objectId = new mongoose.Types.ObjectId(fileId);
    } catch (idError) {
      throw new Error(`Invalid file ID format: ${fileId}`);
    }

    console.log(`📁 Opening download stream for file: ${fileId}`);
    return bucket.openDownloadStream(objectId);
  } catch (error) {
    console.error(`❌ Failed to get file stream for ${fileId}:`, error.message);
    throw error;
  }
};

// Get file info from GridFS
const getFileInfo = async (fileId) => {
  try {
    const bucket = getGridFSBucket();
    if (!bucket) {
      throw new Error('GridFS bucket not available');
    }

    // Validate fileId
    if (!fileId) {
      throw new Error('File ID is required');
    }

    // Convert to ObjectId if it's a string
    let objectId;
    try {
      objectId = new mongoose.Types.ObjectId(fileId);
    } catch (idError) {
      throw new Error(`Invalid file ID format: ${fileId}`);
    }

    console.log(`📋 Getting file info for: ${fileId}`);
    const files = await bucket.find({ _id: objectId }).toArray();
    const fileInfo = files.length > 0 ? files[0] : null;

    if (!fileInfo) {
      throw new Error(`File not found in GridFS: ${fileId}`);
    }

    console.log(`📋 File info retrieved:`, {
      filename: fileInfo.filename,
      length: fileInfo.length,
      contentType: fileInfo.contentType || fileInfo.metadata?.mimetype
    });

    return fileInfo;
  } catch (error) {
    console.error(`❌ Failed to get file info for ${fileId}:`, error.message);
    throw error;
  }
};

// List files in GridFS
const listFiles = async (filter = {}) => {
  try {
    const bucket = getGridFSBucket();
    if (!bucket) {
      throw new Error('GridFS bucket not available');
    }
    
    return await bucket.find(filter).toArray();
  } catch (error) {
    console.error('❌ Failed to list GridFS files:', error.message);
    throw error;
  }
};

// Upload file to GridFS from file path
const uploadToGridFS = async (filePath, originalName, metadata = {}) => {
  return new Promise((resolve, reject) => {
    try {
      const bucket = getGridFSBucket();
      if (!bucket) {
        throw new Error('GridFS bucket not available');
      }

      // Generate unique filename
      const filename = `${Date.now()}-${Math.round(Math.random() * 1E9)}-${originalName}`;

      // Create upload stream
      const uploadStream = bucket.openUploadStream(filename, {
        metadata: {
          ...metadata,
          originalName: originalName,
          uploadedAt: new Date()
        }
      });

      // Handle upload completion
      uploadStream.on('finish', () => {
        resolve({
          fileId: uploadStream.id,
          filename: filename,
          originalName: originalName,
          size: uploadStream.length
        });
      });

      // Handle upload errors
      uploadStream.on('error', (error) => {
        reject(error);
      });

      // Read file and pipe to GridFS
      const fs = require('fs');
      const readStream = fs.createReadStream(filePath);
      readStream.pipe(uploadStream);

    } catch (error) {
      console.error(`❌ Failed to upload file ${originalName} to GridFS:`, error.message);
      reject(error);
    }
  });
};

// Upload file to GridFS from buffer (for direct uploads)
const uploadBufferToGridFS = async (buffer, originalName, metadata = {}) => {
  return new Promise((resolve, reject) => {
    try {
      const bucket = getGridFSBucket();
      if (!bucket) {
        throw new Error('GridFS bucket not available');
      }

      // Generate unique filename
      const filename = `${Date.now()}-${Math.round(Math.random() * 1E9)}-${originalName}`;

      // Create upload stream
      const uploadStream = bucket.openUploadStream(filename, {
        metadata: {
          ...metadata,
          originalName: originalName,
          uploadedAt: new Date()
        }
      });

      // Handle upload completion
      uploadStream.on('finish', () => {
        resolve({
          fileId: uploadStream.id,
          filename: filename,
          originalName: originalName,
          size: uploadStream.length
        });
      });

      // Handle upload errors
      uploadStream.on('error', (error) => {
        reject(error);
      });

      // Write buffer to GridFS
      uploadStream.end(buffer);

    } catch (error) {
      console.error(`❌ Failed to upload buffer ${originalName} to GridFS:`, error.message);
      reject(error);
    }
  });
};

export {
  initGridFS,
  getGridFS,
  getGridFSBucket,
  isGridFSReady,
  deleteFromGridFS,
  getFileStream,
  getFileInfo,
  listFiles,
  uploadToGridFS,
  uploadBufferToGridFS
};
