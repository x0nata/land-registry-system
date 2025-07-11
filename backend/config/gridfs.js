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
    
    return bucket.openDownloadStream(new mongoose.Types.ObjectId(fileId));
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
    
    const files = await bucket.find({ _id: new mongoose.Types.ObjectId(fileId) }).toArray();
    return files.length > 0 ? files[0] : null;
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

// Upload file to GridFS
const uploadToGridFS = (filename, options = {}) => {
  try {
    const bucket = getGridFSBucket();
    if (!bucket) {
      throw new Error('GridFS bucket not available');
    }
    
    return bucket.openUploadStream(filename, options);
  } catch (error) {
    console.error(`❌ Failed to create upload stream for ${filename}:`, error.message);
    throw error;
  }
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
  uploadToGridFS
};
