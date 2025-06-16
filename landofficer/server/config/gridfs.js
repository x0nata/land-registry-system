import mongoose from "mongoose";
import { GridFSBucket } from "mongodb";
import fs from "fs";

let gfs;

// Initialize GridFS
const initGridFS = () => {
  const conn = mongoose.connection;

  if (conn.readyState === 1) {
    // Connection is ready
    gfs = new GridFSBucket(conn.db, {
      bucketName: 'documents'
    });
    console.log('GridFS initialized successfully');
  } else {
    // Wait for connection
    conn.once('open', () => {
      gfs = new GridFSBucket(conn.db, {
        bucketName: 'documents'
      });
      console.log('GridFS initialized successfully');
    });
  }
};

// Get GridFS instance
const getGridFS = () => {
  if (!gfs) {
    throw new Error('GridFS not initialized. Call initGridFS() first.');
  }
  return gfs;
};

// Upload file to GridFS
const uploadToGridFS = (filePath, filename, metadata = {}) => {
  return new Promise((resolve, reject) => {
    const gfs = getGridFS();

    const uploadStream = gfs.openUploadStream(filename, {
      metadata: metadata
    });

    const readStream = fs.createReadStream(filePath);

    readStream.pipe(uploadStream);

    uploadStream.on('error', (error) => {
      reject(error);
    });

    uploadStream.on('finish', () => {
      resolve({
        fileId: uploadStream.id,
        filename: filename,
        metadata: metadata
      });
    });
  });
};

// Delete file from GridFS
const deleteFromGridFS = (fileId) => {
  return new Promise((resolve, reject) => {
    const gfs = getGridFS();

    gfs.delete(new mongoose.Types.ObjectId(fileId), (error) => {
      if (error) {
        reject(error);
      } else {
        resolve();
      }
    });
  });
};

// Get file stream from GridFS
const getFileStream = (fileId) => {
  const gfs = getGridFS();
  return gfs.openDownloadStream(new mongoose.Types.ObjectId(fileId));
};

// Get file info from GridFS
const getFileInfo = async (fileId) => {
  const gfs = getGridFS();

  try {
    const files = await gfs.find({ _id: new mongoose.Types.ObjectId(fileId) }).toArray();

    if (!files || files.length === 0) {
      throw new Error('File not found in GridFS');
    }

    return files[0];
  } catch (error) {
    console.error('Error getting file info from GridFS:', error);
    throw error;
  }
};

// Check if file exists in GridFS
const fileExists = async (fileId) => {
  try {
    const gfs = getGridFS();
    const files = await gfs.find({ _id: new mongoose.Types.ObjectId(fileId) }).toArray();
    return files && files.length > 0;
  } catch (error) {
    console.error('Error checking file existence:', error);
    return false;
  }
};

export {
  initGridFS,
  getGridFS,
  uploadToGridFS,
  deleteFromGridFS,
  getFileStream,
  getFileInfo,
  fileExists
};
