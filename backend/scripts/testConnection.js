#!/usr/bin/env node

/**
 * Test MongoDB Connection Script
 * 
 * This script tests the MongoDB connection configuration
 * to ensure it works properly in serverless environments.
 */

import dotenv from 'dotenv';
import { connectServerlessDB, getConnectionStatus, isServerless } from '../config/db.js';

// Load environment variables
dotenv.config();

const testConnection = async () => {
  console.log('🧪 Testing MongoDB Connection Configuration...\n');

  // Check environment variables
  console.log('1. Environment Variable Check:');
  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) {
    console.log('   ❌ MONGODB_URI not found');
    console.log('   💡 Set MONGODB_URI environment variable to test connection');
    console.log('   📝 Example: MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/dbname?retryWrites=true&w=majority');
    return;
  }
  
  // Mask sensitive information
  const maskedUri = mongoUri.replace(/\/\/([^:]+):([^@]+)@/, '//***:***@');
  console.log(`   ✅ MONGODB_URI found: ${maskedUri}`);

  // Check connection string format
  console.log('\n2. Connection String Format Check:');
  if (mongoUri.startsWith('mongodb+srv://')) {
    console.log('   ✅ Using MongoDB Atlas SRV format (recommended for serverless)');
  } else if (mongoUri.startsWith('mongodb://')) {
    console.log('   ⚠️  Using standard MongoDB format (may work but SRV is preferred)');
  } else {
    console.log('   ❌ Invalid MongoDB connection string format');
    return;
  }

  // Check for required parameters
  console.log('\n3. Connection Parameters Check:');
  const url = new URL(mongoUri);
  const params = url.searchParams;
  
  if (params.get('retryWrites') === 'true') {
    console.log('   ✅ retryWrites=true (good for serverless)');
  } else {
    console.log('   ⚠️  retryWrites not set (recommended for serverless)');
  }
  
  if (params.get('w') === 'majority') {
    console.log('   ✅ w=majority (good for data consistency)');
  } else {
    console.log('   ⚠️  w=majority not set (recommended for data consistency)');
  }

  // Check serverless detection
  console.log('\n4. Environment Detection:');
  console.log(`   Environment: ${isServerless() ? 'Serverless' : 'Standard'}`);
  console.log(`   VERCEL: ${process.env.VERCEL || 'not set'}`);
  console.log(`   NODE_ENV: ${process.env.NODE_ENV || 'not set'}`);

  // Test actual connection (only if we have a valid URI)
  console.log('\n5. Connection Test:');
  try {
    console.log('   🔄 Attempting to connect...');
    const connection = await connectServerlessDB();
    
    if (connection) {
      console.log('   ✅ Connection successful!');
      
      const status = getConnectionStatus();
      console.log(`   📊 Status: ${status.state}`);
      console.log(`   📊 Host: ${status.host || 'unknown'}`);
      console.log(`   📊 Database: ${status.name || 'unknown'}`);
      console.log(`   📊 Serverless: ${status.serverless}`);
      
      // Test a simple operation
      try {
        const mongoose = await import('mongoose');
        await mongoose.default.connection.db.admin().ping();
        console.log('   ✅ Database ping successful!');
      } catch (pingError) {
        console.log(`   ⚠️  Database ping failed: ${pingError.message}`);
      }
      
    } else {
      console.log('   ❌ Connection failed (returned null)');
    }
    
  } catch (error) {
    console.log(`   ❌ Connection failed: ${error.message}`);
    
    // Provide helpful error messages
    if (error.message.includes('authentication failed')) {
      console.log('   💡 Check your username and password in the connection string');
    } else if (error.message.includes('network')) {
      console.log('   💡 Check your network connection and MongoDB Atlas network access settings');
    } else if (error.message.includes('timeout')) {
      console.log('   💡 Connection timeout - check if MongoDB Atlas allows connections from your IP');
    }
  }

  console.log('\n🎯 Test Complete!');
  console.log('\n📋 Recommendations for Vercel Deployment:');
  console.log('   1. Use MongoDB Atlas with SRV connection string');
  console.log('   2. Set Network Access to 0.0.0.0/0 (allow all IPs) in MongoDB Atlas');
  console.log('   3. Ensure retryWrites=true and w=majority in connection string');
  console.log('   4. Set MONGODB_URI in Vercel environment variables');
  console.log('   5. Test the /api/health endpoint after deployment');
  
  process.exit(0);
};

// Handle errors
process.on('unhandledRejection', (error) => {
  console.error('❌ Unhandled rejection:', error.message);
  process.exit(1);
});

// Run the test
testConnection().catch((error) => {
  console.error('❌ Test failed:', error.message);
  process.exit(1);
});
