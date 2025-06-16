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
    console.error('GridFS not initialized. Database connection status:', mongoose.connection.readyState);
    throw new Error('GridFS not initialized. Call initGridFS() first.');
  }
  console.log('GridFS instance retrieved successfully');
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

  // Validate ObjectId
  if (!mongoose.Types.ObjectId.isValid(fileId)) {
    throw new Error('Invalid file ID format');
  }

  console.log('Creating download stream for file:', fileId);

  try {
    const downloadStream = gfs.openDownloadStream(new mongoose.Types.ObjectId(fileId));

    // Add error handling to the stream
    downloadStream.on('error', (error) => {
      console.error('GridFS download stream error:', error);
    });

    return downloadStream;
  } catch (error) {
    console.error('Error creating download stream:', error);
    throw error;
  }
};

// Get file info from GridFS
const getFileInfo = async (fileId) => {
  const gfs = getGridFS();

  // Validate ObjectId
  if (!mongoose.Types.ObjectId.isValid(fileId)) {
    throw new Error('Invalid file ID format');
  }

  try {
    console.log('Searching for file in GridFS:', fileId);

    // Use async/await with proper error handling
    const files = await gfs.find({ _id: new mongoose.Types.ObjectId(fileId) }).toArray();

    console.log('GridFS search completed, files found:', files.length);

    if (!files || files.length === 0) {
      throw new Error('File not found in GridFS');
    }

    console.log('File info found:', {
      id: files[0]._id,
      filename: files[0].filename,
      length: files[0].length,
      contentType: files[0].contentType
    });

    return files[0];
  } catch (error) {
    console.error('Error getting file info from GridFS:', error);
    throw error;
  }
};

export {
  initGridFS,
  getGridFS,
  uploadToGridFS,
  deleteFromGridFS,
  getFileStream,
  getFileInfo
};
