import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import User from '../models/User.js';

// Load environment variables
dotenv.config();

const createAdminUser = async () => {
  try {
    console.log('Attempting to connect to MongoDB...');
    console.log('Connection string:', process.env.MONGO_URI ? 'Found' : 'Missing');

    // Use the same connection options as the main application
    const options = {
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      family: 4,
      maxPoolSize: 10,
      minPoolSize: 1,
      retryWrites: true,
      heartbeatFrequencyMS: 10000,
    };

    await mongoose.connect(process.env.MONGO_URI, options);
    console.log('✅ Connected to MongoDB successfully!');

    // Check if admin user already exists
    const existingAdmin = await User.findOne({ role: 'admin' });

    if (existingAdmin) {
      console.log('Admin user already exists:', existingAdmin.email);
      process.exit(0);
    }

    // Create admin user
    const adminData = {
      fullName: 'System Administrator',
      email: 'admin@system.com',
      password: 'Admin123!@#', // This will be hashed by the pre-save middleware
      phoneNumber: '+251 91 000 0000',
      nationalId: 'ETH000000000',
      role: 'admin'
    };

    const adminUser = await User.create(adminData);

    console.log('✅ Admin user created successfully:');
    console.log('📧 Email:', adminUser.email);
    console.log('🔑 Password: Admin123!@# (Please change this after first login)');
    console.log('👤 Role:', adminUser.role);
    console.log('🆔 ID:', adminUser._id);

    // Close the connection
    await mongoose.connection.close();
    console.log('📤 MongoDB connection closed');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating admin user:', error);

    // Close connection on error too
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
    }

    process.exit(1);
  }
};

// Run the script
createAdminUser();
