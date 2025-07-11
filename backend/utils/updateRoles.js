#!/usr/bin/env node

/**
 * Update User Roles Script
 * 
 * This script updates the roles of specific users to admin and landOfficer
 * by calling the deployed backend API.
 */

import axios from 'axios';

const updateRoles = async () => {
  console.log('🚀 Updating User Roles...\n');

  try {
    const API_BASE = 'https://land-registry-backend-plum.vercel.app/api';
    
    // User IDs from the registration responses
    const adminUserId = '6871564f1e89b68464008154';
    const landOfficerUserId = '6871565b1e89b68464008163';

    console.log('1. Attempting to update admin user role...');
    
    // Try to call the bootstrap endpoint (if it exists after deployment)
    try {
      const bootstrapResponse = await axios.post(`${API_BASE}/auth/bootstrap-roles`, {
        secret: 'bootstrap-land-registry-2025'
      });
      
      console.log('✅ Bootstrap endpoint worked:', bootstrapResponse.data);
      console.log('\n🎉 Roles updated successfully!');
      return;
    } catch (bootstrapError) {
      console.log('⚠️  Bootstrap endpoint not available (expected if not deployed yet)');
    }

    // Alternative approach: Direct database update via MongoDB connection
    console.log('\n2. Alternative approach: Using MongoDB connection...');
    
    // Import database connection
    const { connectServerlessDB } = await import('../config/db.js');
    const User = await import('../models/User.js');
    
    try {
      await connectServerlessDB();
      console.log('✅ Connected to database');
      
      // Update admin user
      const adminUpdate = await User.default.findByIdAndUpdate(
        adminUserId,
        { role: 'admin' },
        { new: true }
      );
      
      // Update land officer user
      const landOfficerUpdate = await User.default.findByIdAndUpdate(
        landOfficerUserId,
        { role: 'landOfficer' },
        { new: true }
      );
      
      console.log('✅ Admin user updated:', adminUpdate ? 'Success' : 'Failed');
      console.log('✅ Land Officer user updated:', landOfficerUpdate ? 'Success' : 'Failed');
      
    } catch (dbError) {
      console.log('❌ Database connection failed:', dbError.message);
      
      // Final approach: Manual instructions
      console.log('\n3. Manual approach required:');
      console.log('Since we cannot connect to the database directly, you need to:');
      console.log('\n📋 Manual Steps:');
      console.log('1. Access your MongoDB Atlas dashboard');
      console.log('2. Navigate to your land registry database');
      console.log('3. Find the "users" collection');
      console.log('4. Update the following users:');
      console.log(`   - User ID: ${adminUserId}`);
      console.log('     Email: cooladmin@gmail.com');
      console.log('     Set role: "admin"');
      console.log(`   - User ID: ${landOfficerUserId}`);
      console.log('     Email: mrland@gmail.com');
      console.log('     Set role: "landOfficer"');
    }

  } catch (error) {
    console.error('❌ Error updating roles:', error.message);
  }

  console.log('\n📋 Test Credentials:');
  console.log('👑 Admin User:');
  console.log('   Email: cooladmin@gmail.com');
  console.log('   Password: Admin@123');
  console.log('\n🏛️  Land Officer User:');
  console.log('   Email: MrLand@gmail.com');
  console.log('   Password: Land@123');
};

// Run the script
updateRoles().catch((error) => {
  console.error('❌ Script failed:', error.message);
  process.exit(1);
});
