#!/usr/bin/env node

/**
 * Production Deployment Setup Script
 * 
 * This script should be run after deploying to Vercel to:
 * 1. Create database indexes
 * 2. Seed admin user
 * 3. Verify system configuration
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Import models
import Property from './server/models/Property.js';
import Document from './server/models/Document.js';
import ApplicationLog from './server/models/ApplicationLog.js';
import User from './server/models/User.js';

// Database connection
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
    });
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    return true;
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    return false;
  }
};

// Create database indexes
const createIndexes = async () => {
  try {
    console.log('📊 Creating database indexes...');

    // Property indexes
    await Property.collection.createIndex({ status: 1 });
    await Property.collection.createIndex({ status: 1, registrationDate: 1 });
    await Property.collection.createIndex({ createdAt: 1 });
    await Property.collection.createIndex({ propertyType: 1 });
    await Property.collection.createIndex({ owner: 1 });

    // Document indexes
    await Document.collection.createIndex({ status: 1 });
    await Document.collection.createIndex({ status: 1, uploadDate: 1 });
    await Document.collection.createIndex({ property: 1 });
    await Document.collection.createIndex({ owner: 1 });

    // ApplicationLog indexes
    await ApplicationLog.collection.createIndex({ timestamp: -1 });
    await ApplicationLog.collection.createIndex({ user: 1, timestamp: -1 });
    await ApplicationLog.collection.createIndex({ property: 1 });

    // User indexes
    await User.collection.createIndex({ role: 1 });
    await User.collection.createIndex({ email: 1 }, { unique: true });
    await User.collection.createIndex({ createdAt: 1 });

    // Compound indexes
    await Property.collection.createIndex({ status: 1, propertyType: 1 });
    await Document.collection.createIndex({ status: 1, documentType: 1 });

    console.log('✅ Database indexes created successfully');
  } catch (error) {
    console.error('❌ Error creating indexes:', error.message);
    throw error;
  }
};

// Seed admin user
const seedAdmin = async () => {
  try {
    console.log('👤 Setting up admin user...');

    const adminEmail = process.env.ADMIN_EMAIL || 'admin@propertyregistration.com';
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin123456';

    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: adminEmail });
    if (existingAdmin) {
      console.log('✅ Admin user already exists');
      return;
    }

    // Create admin user
    const adminUser = new User({
      fullName: 'System Administrator',
      email: adminEmail,
      password: adminPassword,
      phoneNumber: '+251-11-123-4567',
      nationalId: 'ADMIN001',
      role: 'admin',
    });

    await adminUser.save();
    console.log('✅ Admin user created successfully');
  } catch (error) {
    console.error('❌ Error creating admin user:', error.message);
    throw error;
  }
};

// Verify system configuration
const verifyConfiguration = () => {
  console.log('🔧 Verifying system configuration...');

  const requiredEnvVars = [
    'MONGO_URI',
    'JWT_SECRET',
    'CLOUDINARY_CLOUD_NAME',
    'CLOUDINARY_API_KEY',
    'CLOUDINARY_API_SECRET'
  ];

  const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

  if (missingVars.length > 0) {
    console.warn('⚠️ Missing environment variables:', missingVars.join(', '));
    console.warn('⚠️ Some features may not work properly');
  } else {
    console.log('✅ All required environment variables are set');
  }

  // Check optional configurations
  const optionalVars = ['CHAPA_SECRET_KEY', 'CHAPA_PUBLIC_KEY'];
  const missingOptional = optionalVars.filter(varName => !process.env[varName]);

  if (missingOptional.length > 0) {
    console.log('ℹ️ Optional configurations not set:', missingOptional.join(', '));
    console.log('ℹ️ Payment features will be disabled');
  }
};

// Main setup function
const runSetup = async () => {
  console.log('🚀 Starting production deployment setup...\n');

  try {
    // Verify configuration
    verifyConfiguration();
    console.log('');

    // Connect to database
    const connected = await connectDB();
    if (!connected) {
      throw new Error('Failed to connect to database');
    }
    console.log('');

    // Create indexes
    await createIndexes();
    console.log('');

    // Seed admin user
    await seedAdmin();
    console.log('');

    console.log('🎉 Production setup completed successfully!');
    console.log('');
    console.log('📋 Next steps:');
    console.log('1. Verify your application is accessible');
    console.log('2. Test admin login with the configured credentials');
    console.log('3. Configure payment gateway if needed');
    console.log('4. Set up monitoring and logging');

  } catch (error) {
    console.error('💥 Setup failed:', error.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
    process.exit(0);
  }
};

// Run setup if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runSetup();
}

export { runSetup, createIndexes, seedAdmin, verifyConfiguration };
