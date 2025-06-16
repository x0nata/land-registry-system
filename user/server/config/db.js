import mongoose from "mongoose";
import colors from "colors";

const connectDB = async () => {
  try {
    // Set mongoose global options to handle buffering
    mongoose.set('bufferCommands', false);
    // Note: bufferMaxEntries is deprecated and removed in newer Mongoose versions

    // Check connection state before attempting to connect
    // readyState: 0 = disconnected, 1 = connected, 2 = connecting, 3 = disconnecting

    if (mongoose.connection.readyState === 1) {
      console.log("✅ MongoDB already connected:", mongoose.connection.host);
      console.log("📊 Database:", mongoose.connection.name);
      console.log("🔄 Skipping reconnection attempt");
      return mongoose.connection;
    }

    if (mongoose.connection.readyState === 2) {
      console.log("🔄 MongoDB connection already in progress...");
      return mongoose.connection;
    }

    console.log("Attempting to connect to MongoDB Atlas...");

    const connectionUri = process.env.MONGO_URI;

    if (connectionUri.includes('mongodb+srv://')) {
      console.log("Using SRV connection string...");
    } else {
      console.log("Using direct connection string...");
    }
    console.log("Connection URI:", connectionUri?.replace(/\/\/([^:]+):([^@]+)@/, '//***:***@'));

    // Enhanced MongoDB connection options for better reliability
    const options = {
      // Increased timeout settings for unstable connections
      serverSelectionTimeoutMS: 30000, // 30 seconds for server selection
      connectTimeoutMS: 30000, // 30 seconds for initial connection
      socketTimeoutMS: 60000, // 60 seconds for socket operations

      // Connection pool settings
      maxPoolSize: 10,
      minPoolSize: 1,

      // Retry and reliability settings
      retryWrites: true,
      heartbeatFrequencyMS: 10000,

      // Additional reliability options
      maxIdleTimeMS: 30000,
      waitQueueTimeoutMS: 30000,
    };

    console.log("Using connection options:", JSON.stringify(options, null, 2));

    // Connect with retry mechanism
    let conn;
    const maxRetries = 3;
    let retryCount = 0;

    while (retryCount < maxRetries) {
      try {
        console.log(`🔄 Connection attempt ${retryCount + 1}/${maxRetries}...`);
        conn = await mongoose.connect(connectionUri, options);
        break; // Success, exit retry loop
      } catch (error) {
        retryCount++;
        if (retryCount >= maxRetries) {
          throw error; // Re-throw if all retries failed
        }
        console.log(`❌ Attempt ${retryCount} failed, retrying in 5 seconds...`);
        await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds before retry
      }
    }

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`.cyan.underline);
    console.log(`📊 Database: ${conn.connection.name}`);
    console.log(`🚀 Connected successfully on first try!`);

    // Handle connection events (recommended by MongoDB docs)
    mongoose.connection.on('error', (err) => {
      console.error('❌ MongoDB connection error:', err.message);
    });

    mongoose.connection.on('disconnected', () => {
      console.log('⚠️  MongoDB disconnected');
    });

    mongoose.connection.on('reconnected', () => {
      console.log('🔄 MongoDB reconnected');
    });

    mongoose.connection.on('connecting', () => {
      console.log('🔄 MongoDB connecting...');
    });

  } catch (error) {
    console.error(`❌ MongoDB connection failed: ${error.message}`);

    // Enhanced error diagnostics for SRV connection issues
    if (error.message.includes('ETIMEOUT') || error.message.includes('queryTxt') || error.message.includes('ENOTFOUND')) {
      console.error('\n🔍 SRV DNS Resolution Issue Detected');
      console.error('Possible solutions:');
      console.error('1. Check your internet connection stability');
      console.error('2. Try using Google DNS (8.8.8.8, 8.8.4.4) or Cloudflare DNS (1.1.1.1)');
      console.error('3. Verify your IP is whitelisted in MongoDB Atlas Network Access');
      console.error('4. Check if your firewall/antivirus is blocking DNS queries');
      console.error('5. Try connecting from a different network (mobile hotspot)');
      console.error('6. Contact your ISP if they block SRV DNS lookups');
      console.error('\n💡 If issues persist, consider using a direct connection string instead of SRV');
    } else if (error.message.includes('ECONNREFUSED')) {
      console.error('\n🔍 Connection Refused Error');
      console.error('1. Check if MongoDB Atlas cluster is running and not paused');
      console.error('2. Verify your connection string is correct');
      console.error('3. Check Network Access settings in MongoDB Atlas');
    } else if (error.message.includes('authentication') || error.message.includes('Authentication')) {
      console.error('\n🔍 Authentication Error');
      console.error('1. Check username and password in connection string');
      console.error('2. Verify database user exists and has proper permissions');
      console.error('3. Check if special characters in password are URL encoded');
      console.error('4. Verify the database name in the connection string');
    }

    console.error('\n📋 Current Connection String Format:');
    console.error('Using:', process.env.MONGO_URI?.replace(/\/\/([^:]+):([^@]+)@/, '//***:***@'));

    // Don't exit immediately, let the application handle the error
    throw error;
  }
};

export default connectDB;