#!/usr/bin/env node

/**
 * Create Admin and Land Officer Users Script
 * 
 * This script creates admin and land officer users for the Land Registry System.
 */

import dotenv from 'dotenv';
import bcryptjs from 'bcryptjs';
import { connectServerlessDB } from '../config/db.js';
import User from '../models/User.js';

// Load environment variables
dotenv.config();

const createUsers = async () => {
  console.log('🚀 Creating Admin and Land Officer Users...\n');

  try {
    // Connect to database
    console.log('1. Connecting to database...');
    await connectServerlessDB();
    console.log('✅ Database connected successfully\n');

    // Users to create
    const usersToCreate = [
      {
        fullName: 'Cool Admin',
        email: 'cooladmin@gmail.com',
        password: 'Admin@123',
        phoneNumber: '+251911000001',
        nationalId: 'ETH000000001',
        role: 'admin'
      },
      {
        fullName: 'Mr Land Officer',
        email: 'MrLand@gmail.com',
        password: 'Land@123',
        phoneNumber: '+251911000002',
        nationalId: 'ETH000000002',
        role: 'landOfficer'
      }
    ];

    console.log('2. Creating users...\n');

    for (const userData of usersToCreate) {
      try {
        // Check if user already exists
        const existingUser = await User.findOne({ 
          $or: [
            { email: userData.email },
            { nationalId: userData.nationalId }
          ]
        });

        if (existingUser) {
          console.log(`⚠️  User ${userData.email} already exists, updating role...`);
          
          // Update existing user's role
          existingUser.role = userData.role;
          await existingUser.save();
          
          console.log(`✅ Updated ${userData.email} role to ${userData.role}`);
        } else {
          // Hash password
          const salt = await bcryptjs.genSalt(10);
          const hashedPassword = await bcryptjs.hash(userData.password, salt);

          // Create new user
          const newUser = new User({
            fullName: userData.fullName,
            email: userData.email,
            password: hashedPassword,
            phoneNumber: userData.phoneNumber,
            nationalId: userData.nationalId,
            role: userData.role
          });

          await newUser.save();
          console.log(`✅ Created ${userData.role}: ${userData.email}`);
        }
      } catch (error) {
        console.error(`❌ Error creating user ${userData.email}:`, error.message);
      }
    }

    console.log('\n🎉 User creation completed!');
    console.log('\n📋 Created Users:');
    console.log('👑 Admin User:');
    console.log('   Email: cooladmin@gmail.com');
    console.log('   Password: Admin@123');
    console.log('   Role: admin');
    console.log('\n🏛️  Land Officer User:');
    console.log('   Email: MrLand@gmail.com');
    console.log('   Password: Land@123');
    console.log('   Role: landOfficer');

    console.log('\n✅ You can now test admin and land officer login functionality!');

  } catch (error) {
    console.error('❌ Error creating users:', error.message);
    process.exit(1);
  }

  process.exit(0);
};

// Handle errors
process.on('unhandledRejection', (error) => {
  console.error('❌ Unhandled rejection:', error.message);
  process.exit(1);
});

// Run the script
createUsers().catch((error) => {
  console.error('❌ Script failed:', error.message);
  process.exit(1);
});
