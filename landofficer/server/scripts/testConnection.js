import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const testConnection = async () => {
  console.log('Testing MongoDB connection...');
  console.log('Environment check:');
  console.log('- NODE_ENV:', process.env.NODE_ENV);
  console.log('- MONGO_URI exists:', !!process.env.MONGO_URI);
  console.log('- MONGO_URI length:', process.env.MONGO_URI?.length || 0);

  if (!process.env.MONGO_URI) {
    console.error('❌ MONGO_URI environment variable is not set');
    process.exit(1);
  }

  // Test different connection approaches
  const connectionOptions = [
    {
      name: 'Standard Connection',
      options: {
        useNewUrlParser: true,
        useUnifiedTopology: true
      }
    },
    {
      name: 'Extended Timeout Connection',
      options: {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        connectTimeoutMS: 60000,
        socketTimeoutMS: 60000,
        serverSelectionTimeoutMS: 60000,
        bufferCommands: false
        // Note: bufferMaxEntries is deprecated and removed in newer Mongoose versions
      }
    },
    {
      name: 'Minimal Connection',
      options: {
        connectTimeoutMS: 10000,
        serverSelectionTimeoutMS: 10000
      }
    }
  ];

  for (const config of connectionOptions) {
    try {
      console.log(`\n🔄 Trying ${config.name}...`);

      // Close any existing connection
      if (mongoose.connection.readyState !== 0) {
        await mongoose.disconnect();
      }

      const startTime = Date.now();
      await mongoose.connect(process.env.MONGO_URI, config.options);
      const endTime = Date.now();

      console.log(`✅ ${config.name} successful! (${endTime - startTime}ms)`);
      console.log('Connection state:', mongoose.connection.readyState);
      console.log('Database name:', mongoose.connection.db?.databaseName);

      // Test a simple operation
      const collections = await mongoose.connection.db.listCollections().toArray();
      console.log('Available collections:', collections.map(c => c.name));

      await mongoose.disconnect();
      console.log('✅ Connection test completed successfully!');
      process.exit(0);

    } catch (error) {
      console.log(`❌ ${config.name} failed:`, error.message);

      if (error.code === 'ETIMEOUT') {
        console.log('   → This is a network/DNS timeout issue');
      } else if (error.code === 'ENOTFOUND') {
        console.log('   → DNS resolution failed');
      } else if (error.code === 'ECONNREFUSED') {
        console.log('   → Connection refused by server');
      }
    }
  }

  console.log('\n❌ All connection attempts failed');
  console.log('\n🔧 Troubleshooting suggestions:');
  console.log('1. Check your internet connection');
  console.log('2. Verify MongoDB Atlas cluster is running');
  console.log('3. Check if your IP is whitelisted in MongoDB Atlas');
  console.log('4. Try using a different network (mobile hotspot)');
  console.log('5. Check if your firewall is blocking the connection');
  console.log('6. Verify the connection string is correct');

  process.exit(1);
};

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Promise Rejection:', err.message);
  process.exit(1);
});

// Run the test
testConnection();
