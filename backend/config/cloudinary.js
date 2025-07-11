import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true
});

// Validate Cloudinary configuration
const validateCloudinaryConfig = () => {
  const requiredVars = ['CLOUDINARY_CLOUD_NAME', 'CLOUDINARY_API_KEY', 'CLOUDINARY_API_SECRET'];
  const missingVars = requiredVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    console.warn(`⚠️ Missing Cloudinary environment variables: ${missingVars.join(', ')}`);
    return false;
  }
  
  console.log('✅ Cloudinary configuration validated');
  return true;
};

// Upload options for different file types
const getUploadOptions = (folder = 'documents', resourceType = 'auto') => ({
  folder: `land-registry/${folder}`,
  resource_type: resourceType,
  allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'pdf', 'doc', 'docx', 'txt'],
  max_file_size: 10000000, // 10MB
  use_filename: true,
  unique_filename: true,
  overwrite: false,
  quality: 'auto',
  fetch_format: 'auto'
});

// Upload file to Cloudinary
const uploadToCloudinary = async (filePath, options = {}) => {
  try {
    if (!validateCloudinaryConfig()) {
      throw new Error('Cloudinary configuration is invalid');
    }

    const defaultOptions = getUploadOptions();
    const uploadOptions = { ...defaultOptions, ...options };

    const result = await cloudinary.uploader.upload(filePath, uploadOptions);
    
    console.log(`✅ File uploaded to Cloudinary: ${result.public_id}`);
    
    return {
      success: true,
      public_id: result.public_id,
      secure_url: result.secure_url,
      url: result.url,
      format: result.format,
      resource_type: result.resource_type,
      bytes: result.bytes,
      width: result.width,
      height: result.height,
      created_at: result.created_at
    };
  } catch (error) {
    console.error('❌ Cloudinary upload failed:', error.message);
    throw new Error(`Cloudinary upload failed: ${error.message}`);
  }
};

// Upload buffer to Cloudinary
const uploadBufferToCloudinary = async (buffer, filename, options = {}) => {
  try {
    if (!validateCloudinaryConfig()) {
      throw new Error('Cloudinary configuration is invalid');
    }

    const defaultOptions = getUploadOptions();
    const uploadOptions = { 
      ...defaultOptions, 
      ...options,
      public_id: filename ? `${Date.now()}-${filename}` : undefined
    };

    return new Promise((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        uploadOptions,
        (error, result) => {
          if (error) {
            console.error('❌ Cloudinary buffer upload failed:', error.message);
            reject(new Error(`Cloudinary upload failed: ${error.message}`));
          } else {
            console.log(`✅ Buffer uploaded to Cloudinary: ${result.public_id}`);
            resolve({
              success: true,
              public_id: result.public_id,
              secure_url: result.secure_url,
              url: result.url,
              format: result.format,
              resource_type: result.resource_type,
              bytes: result.bytes,
              width: result.width,
              height: result.height,
              created_at: result.created_at
            });
          }
        }
      ).end(buffer);
    });
  } catch (error) {
    console.error('❌ Cloudinary buffer upload failed:', error.message);
    throw error;
  }
};

// Delete file from Cloudinary
const deleteFromCloudinary = async (publicId, resourceType = 'image') => {
  try {
    if (!validateCloudinaryConfig()) {
      throw new Error('Cloudinary configuration is invalid');
    }

    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type: resourceType
    });
    
    if (result.result === 'ok') {
      console.log(`✅ File deleted from Cloudinary: ${publicId}`);
      return { success: true, result: result.result };
    } else {
      console.warn(`⚠️ Cloudinary deletion result: ${result.result} for ${publicId}`);
      return { success: false, result: result.result };
    }
  } catch (error) {
    console.error('❌ Cloudinary deletion failed:', error.message);
    throw new Error(`Cloudinary deletion failed: ${error.message}`);
  }
};

// Get file info from Cloudinary
const getCloudinaryFileInfo = async (publicId, resourceType = 'image') => {
  try {
    if (!validateCloudinaryConfig()) {
      throw new Error('Cloudinary configuration is invalid');
    }

    const result = await cloudinary.api.resource(publicId, {
      resource_type: resourceType
    });
    
    return {
      success: true,
      public_id: result.public_id,
      secure_url: result.secure_url,
      url: result.url,
      format: result.format,
      resource_type: result.resource_type,
      bytes: result.bytes,
      width: result.width,
      height: result.height,
      created_at: result.created_at
    };
  } catch (error) {
    console.error('❌ Failed to get Cloudinary file info:', error.message);
    throw new Error(`Failed to get file info: ${error.message}`);
  }
};

// Generate signed URL for secure access
const generateSignedUrl = (publicId, options = {}) => {
  try {
    if (!validateCloudinaryConfig()) {
      throw new Error('Cloudinary configuration is invalid');
    }

    const defaultOptions = {
      resource_type: 'auto',
      type: 'upload',
      expires_at: Math.floor(Date.now() / 1000) + 3600 // 1 hour from now
    };

    const signedOptions = { ...defaultOptions, ...options };
    
    return cloudinary.utils.private_download_url(publicId, signedOptions.resource_type, signedOptions);
  } catch (error) {
    console.error('❌ Failed to generate signed URL:', error.message);
    throw new Error(`Failed to generate signed URL: ${error.message}`);
  }
};

// Check if Cloudinary is configured
const isCloudinaryConfigured = () => {
  return validateCloudinaryConfig();
};

export {
  cloudinary,
  uploadToCloudinary,
  uploadBufferToCloudinary,
  deleteFromCloudinary,
  getCloudinaryFileInfo,
  generateSignedUrl,
  isCloudinaryConfigured,
  validateCloudinaryConfig,
  getUploadOptions
};
