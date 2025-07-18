import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const testDatabaseConnection = async () => {
  console.log('🧪 Testing Database Connection...\n');

  try {
    // Check environment variable
    const connectionUri = process.env.MONGODB_URI;
    if (!connectionUri) {
      console.error('❌ MONGODB_URI environment variable is not defined');
      process.exit(1);
    }

    console.log('✅ MONGODB_URI is defined');
    console.log('📍 URI format:', connectionUri.includes('mongodb') ? 'Valid' : 'Invalid');
    console.log('📍 URI preview:', connectionUri.replace(/\/\/([^:]+):([^@]+)@/, '//***:***@'));

    // Test connection with aggressive settings
    console.log('\n🚀 Attempting connection...');
    
    const options = {
      serverSelectionTimeoutMS: 2000,
      connectTimeoutMS: 3000,
      socketTimeoutMS: 5000,
      maxPoolSize: 1,
      minPoolSize: 1,
      ssl: true,
      authSource: 'admin',
      bufferCommands: false,
      bufferMaxEntries: 0
    };

    const startTime = Date.now();
    await mongoose.connect(connectionUri, options);
    const connectTime = Date.now() - startTime;

    console.log(`✅ Connected in ${connectTime}ms`);
    console.log('📊 Connection details:');
    console.log(`   - Host: ${mongoose.connection.host}`);
    console.log(`   - Database: ${mongoose.connection.name}`);
    console.log(`   - Ready State: ${mongoose.connection.readyState}`);

    // Test database operations
    console.log('\n🧪 Testing database operations...');
    
    // Test ping
    const pingStart = Date.now();
    await mongoose.connection.db.admin().ping();
    const pingTime = Date.now() - pingStart;
    console.log(`✅ Ping successful in ${pingTime}ms`);

    // Test collection access
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log(`✅ Found ${collections.length} collections`);

    // Test a simple query if users collection exists
    const userCollection = collections.find(c => c.name === 'users');
    if (userCollection) {
      const userCount = await mongoose.connection.db.collection('users').countDocuments();
      console.log(`✅ Users collection has ${userCount} documents`);
    }

    console.log('\n🎉 Database connection test SUCCESSFUL!');
    console.log('✅ The database is working correctly');

  } catch (error) {
    console.error('\n❌ Database connection test FAILED!');
    console.error('Error:', error.message);
    
    if (error.message.includes('timeout')) {
      console.error('\n💡 Timeout suggestions:');
      console.error('   - Check MongoDB Atlas network access (allow 0.0.0.0/0)');
      console.error('   - Verify connection string format');
      console.error('   - Check if cluster is paused');
    }
    
    if (error.message.includes('authentication')) {
      console.error('\n💡 Authentication suggestions:');
      console.error('   - Verify username and password in connection string');
      console.error('   - Check database user permissions');
    }

    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from database');
  }
};

// Run the test
testDatabaseConnection();
