import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Get current directory for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from parent directory
dotenv.config({ path: path.join(__dirname, '../../.env') });

// Import models
import Property from '../models/Property.js';
import Document from '../models/Document.js';
import ApplicationLog from '../models/ApplicationLog.js';
import User from '../models/User.js';

const addIndexes = async () => {
  try {
    console.log('🔄 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    console.log('🔄 Adding performance indexes...');

    // Property indexes for dashboard queries
    await Property.collection.createIndex({ status: 1 });
    await Property.collection.createIndex({ status: 1, registrationDate: 1 });
    await Property.collection.createIndex({ createdAt: 1 });
    await Property.collection.createIndex({ propertyType: 1 });
    await Property.collection.createIndex({ owner: 1 });
    console.log('✅ Property indexes created');

    // Document indexes for dashboard queries
    await Document.collection.createIndex({ status: 1 });
    await Document.collection.createIndex({ status: 1, uploadDate: 1 });
    await Document.collection.createIndex({ property: 1 });
    await Document.collection.createIndex({ owner: 1 });
    console.log('✅ Document indexes created');

    // ApplicationLog indexes for recent activity
    await ApplicationLog.collection.createIndex({ timestamp: -1 });
    await ApplicationLog.collection.createIndex({ user: 1, timestamp: -1 });
    await ApplicationLog.collection.createIndex({ performedBy: 1, timestamp: -1 });
    await ApplicationLog.collection.createIndex({ property: 1, timestamp: -1 });
    console.log('✅ ApplicationLog indexes created');

    // User indexes
    await User.collection.createIndex({ role: 1 });
    await User.collection.createIndex({ email: 1 }, { unique: true });
    await User.collection.createIndex({ createdAt: 1 });
    console.log('✅ User indexes created');

    // Compound indexes for complex queries
    await Property.collection.createIndex({ status: 1, propertyType: 1 });
    await Document.collection.createIndex({ status: 1, documentType: 1 });
    console.log('✅ Compound indexes created');

    console.log('🎉 All indexes created successfully!');
    
    // List all indexes for verification
    console.log('\n📋 Current indexes:');
    const propertyIndexes = await Property.collection.listIndexes().toArray();
    console.log('Property indexes:', propertyIndexes.map(idx => idx.name));
    
    const documentIndexes = await Document.collection.listIndexes().toArray();
    console.log('Document indexes:', documentIndexes.map(idx => idx.name));
    
    const logIndexes = await ApplicationLog.collection.listIndexes().toArray();
    console.log('ApplicationLog indexes:', logIndexes.map(idx => idx.name));
    
    const userIndexes = await User.collection.listIndexes().toArray();
    console.log('User indexes:', userIndexes.map(idx => idx.name));

  } catch (error) {
    console.error('❌ Error adding indexes:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
    process.exit(0);
  }
};

// Run the script
addIndexes();
