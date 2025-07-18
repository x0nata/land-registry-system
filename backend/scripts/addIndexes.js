import mongoose from 'mongoose';
import connectDB from '../config/db.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const addPerformanceIndexes = async () => {
  try {
    console.log('🔄 Connecting to database...');
    await connectDB();
    
    console.log('📊 Adding performance indexes...');
    
    // Property collection indexes
    const propertyCollection = mongoose.connection.db.collection('properties');
    
    // Compound indexes for common query patterns
    await propertyCollection.createIndex({ status: 1, registrationDate: -1 });
    await propertyCollection.createIndex({ owner: 1, status: 1 });
    await propertyCollection.createIndex({ 'location.subCity': 1, 'location.kebele': 1 });
    await propertyCollection.createIndex({ propertyType: 1, status: 1 });
    await propertyCollection.createIndex({ isTransferred: 1, hasActiveDispute: 1 });
    
    // Text index for search functionality
    await propertyCollection.createIndex({ 
      plotNumber: 'text', 
      'location.subCity': 'text', 
      'location.kebele': 'text' 
    });
    
    console.log('✅ Property indexes created');
    
    // Payment collection indexes
    const paymentCollection = mongoose.connection.db.collection('payments');
    
    await paymentCollection.createIndex({ property: 1, status: 1 });
    await paymentCollection.createIndex({ user: 1, paymentDate: -1 });
    await paymentCollection.createIndex({ status: 1, paymentDate: -1 });
    await paymentCollection.createIndex({ paymentMethod: 1, status: 1 });
    
    console.log('✅ Payment indexes created');
    
    // Document collection indexes
    const documentCollection = mongoose.connection.db.collection('documents');
    
    await documentCollection.createIndex({ property: 1, status: 1 });
    await documentCollection.createIndex({ owner: 1, documentType: 1 });
    await documentCollection.createIndex({ status: 1, uploadDate: -1 });
    
    console.log('✅ Document indexes created');
    
    // User collection indexes
    const userCollection = mongoose.connection.db.collection('users');
    
    await userCollection.createIndex({ role: 1, createdAt: -1 });
    await userCollection.createIndex({ 
      fullName: 'text', 
      email: 'text', 
      nationalId: 'text' 
    });
    
    console.log('✅ User indexes created');
    
    // Application logs indexes
    const logCollection = mongoose.connection.db.collection('applicationlogs');
    
    await logCollection.createIndex({ property: 1, createdAt: -1 });
    await logCollection.createIndex({ user: 1, action: 1, createdAt: -1 });
    await logCollection.createIndex({ performedBy: 1, createdAt: -1 });
    
    console.log('✅ Application log indexes created');
    
    console.log('🎉 All performance indexes created successfully!');
    
    // List all indexes for verification
    console.log('\n📋 Index Summary:');
    const collections = ['properties', 'payments', 'documents', 'users', 'applicationlogs'];
    
    for (const collectionName of collections) {
      const collection = mongoose.connection.db.collection(collectionName);
      const indexes = await collection.listIndexes().toArray();
      console.log(`\n${collectionName}:`);
      indexes.forEach(index => {
        console.log(`  - ${index.name}: ${JSON.stringify(index.key)}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error creating indexes:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Database connection closed');
    process.exit(0);
  }
};

// Run the script
addPerformanceIndexes();
