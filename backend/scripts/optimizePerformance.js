import mongoose from 'mongoose';
import connectDB from '../config/db.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const optimizePerformance = async () => {
  try {
    console.log('🔄 Connecting to database...');
    await connectDB();
    
    console.log('🚀 Starting performance optimization...');
    
    // 1. Create performance indexes
    console.log('📊 Creating performance indexes...');
    
    // Property collection indexes
    const propertyCollection = mongoose.connection.db.collection('properties');
    
    // Compound indexes for common query patterns
    await propertyCollection.createIndex({ status: 1, registrationDate: -1 }, { background: true });
    await propertyCollection.createIndex({ owner: 1, status: 1 }, { background: true });
    await propertyCollection.createIndex({ 'location.subCity': 1, 'location.kebele': 1 }, { background: true });
    await propertyCollection.createIndex({ propertyType: 1, status: 1 }, { background: true });
    await propertyCollection.createIndex({ isTransferred: 1, hasActiveDispute: 1 }, { background: true });
    await propertyCollection.createIndex({ createdAt: -1 }, { background: true });
    
    // Text index for search functionality
    await propertyCollection.createIndex({ 
      plotNumber: 'text', 
      'location.subCity': 'text', 
      'location.kebele': 'text' 
    }, { background: true });
    
    console.log('✅ Property indexes created');
    
    // Application logs indexes for recent activities
    const logCollection = mongoose.connection.db.collection('applicationlogs');
    
    await logCollection.createIndex({ timestamp: -1 }, { background: true });
    await logCollection.createIndex({ property: 1, timestamp: -1 }, { background: true });
    await logCollection.createIndex({ user: 1, timestamp: -1 }, { background: true });
    await logCollection.createIndex({ performedBy: 1, timestamp: -1 }, { background: true });
    await logCollection.createIndex({ action: 1, timestamp: -1 }, { background: true });
    
    console.log('✅ Application log indexes created');
    
    // Document collection indexes
    const documentCollection = mongoose.connection.db.collection('documents');
    
    await documentCollection.createIndex({ property: 1, status: 1 }, { background: true });
    await documentCollection.createIndex({ owner: 1, documentType: 1 }, { background: true });
    await documentCollection.createIndex({ status: 1, uploadDate: -1 }, { background: true });
    
    console.log('✅ Document indexes created');
    
    // User collection indexes
    const userCollection = mongoose.connection.db.collection('users');
    
    await userCollection.createIndex({ role: 1, createdAt: -1 }, { background: true });
    await userCollection.createIndex({ email: 1 }, { background: true, unique: true });
    await userCollection.createIndex({ nationalId: 1 }, { background: true, sparse: true });
    
    console.log('✅ User indexes created');
    
    // Payment collection indexes
    const paymentCollection = mongoose.connection.db.collection('payments');
    
    await paymentCollection.createIndex({ property: 1, status: 1 }, { background: true });
    await paymentCollection.createIndex({ user: 1, paymentDate: -1 }, { background: true });
    await paymentCollection.createIndex({ status: 1, paymentDate: -1 }, { background: true });
    
    console.log('✅ Payment indexes created');
    
    // 2. Analyze collection statistics
    console.log('\n📈 Analyzing collection statistics...');
    
    const collections = ['properties', 'users', 'applicationlogs', 'documents', 'payments'];
    
    for (const collectionName of collections) {
      const collection = mongoose.connection.db.collection(collectionName);
      const stats = await collection.stats();
      console.log(`${collectionName}: ${stats.count} documents, ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
    }
    
    // 3. Check for slow queries (if explain is available)
    console.log('\n🔍 Performance recommendations:');
    console.log('- Use lean() queries when not modifying documents');
    console.log('- Implement pagination for large result sets');
    console.log('- Use select() to limit returned fields');
    console.log('- Add maxTimeMS() to prevent long-running queries');
    console.log('- Use compound indexes for multi-field queries');
    console.log('- Consider caching frequently accessed data');
    
    // 4. List all indexes for verification
    console.log('\n📋 Index Summary:');
    
    for (const collectionName of collections) {
      const collection = mongoose.connection.db.collection(collectionName);
      const indexes = await collection.listIndexes().toArray();
      console.log(`\n${collectionName}:`);
      indexes.forEach(index => {
        console.log(`  - ${index.name}: ${JSON.stringify(index.key)}`);
      });
    }
    
    console.log('\n🎉 Performance optimization completed successfully!');
    
  } catch (error) {
    console.error('❌ Error during performance optimization:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Database connection closed');
    process.exit(0);
  }
};

// Run the script
optimizePerformance();
