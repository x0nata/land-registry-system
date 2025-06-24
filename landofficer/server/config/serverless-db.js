import mongoose from "mongoose";

// Global connection cache for serverless functions
let cachedConnection = null;

// Serverless-optimized connection options
const getServerlessConnectionOptions = () => ({
  // Shorter timeouts for serverless
  serverSelectionTimeoutMS: 5000, // 5 seconds
  connectTimeoutMS: 10000, // 10 seconds
  socketTimeoutMS: 0, // Let Atlas handle socket timeouts
  
  // Minimal pool for serverless
  maxPoolSize: 1, // Single connection for serverless
  minPoolSize: 0, // Start with no connections
  maxIdleTimeMS: 30000, // 30 seconds - shorter for serverless
  
  // Standard reliability settings
  retryWrites: true,
  retryReads: true,
  
  // Atlas compatibility
  ssl: true,
  authSource: 'admin',
  
  // Disable monitoring for serverless
  monitorCommands: false,
  
  // Atlas-specific options
  appName: 'LandManagementSystem-Serverless',
  
  // Write concern
  w: 'majority',
  wtimeoutMS: 10000, // 10 seconds
  
  // Read preference
  readPreference: 'primary'
});

// Serverless database connection function
const connectServerlessDB = async () => {
  try {
    // Return cached connection if available
    if (cachedConnection && mongoose.connection.readyState === 1) {
      console.log('🔄 Using cached database connection');
      return cachedConnection;
    }

    // Check for connection string
    const connectionUri = process.env.MONGO_URI;
    if (!connectionUri) {
      throw new Error('MONGO_URI environment variable is not defined');
    }

    console.log('🔄 Creating new serverless database connection...');
    
    // Close any existing connection
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
    }

    // Create new connection with serverless options
    const options = getServerlessConnectionOptions();
    
    const conn = await mongoose.connect(connectionUri, options);
    
    cachedConnection = conn.connection;
    
    console.log('✅ Serverless MongoDB Connected Successfully!');
    console.log('📊 Host:', conn.connection.host);
    console.log('📊 Database:', conn.connection.name);
    
    return cachedConnection;

  } catch (error) {
    console.error('❌ Serverless MongoDB Connection Error:', error.message);
    cachedConnection = null;
    throw error;
  }
};

// Get connection status for serverless
const getServerlessConnectionStatus = () => {
  const readyState = mongoose.connection.readyState;
  const stateNames = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting'
  };

  return {
    state: stateNames[readyState] || 'unknown',
    readyState,
    host: mongoose.connection.host,
    name: mongoose.connection.name,
    cached: !!cachedConnection,
    timestamp: new Date().toISOString()
  };
};

// Test database connection for serverless
const testServerlessConnection = async () => {
  try {
    const connection = await connectServerlessDB();
    
    // Test with a simple ping
    await mongoose.connection.db.admin().ping();
    
    return {
      success: true,
      message: 'Database connection test successful',
      connection: getServerlessConnectionStatus()
    };
  } catch (error) {
    return {
      success: false,
      message: 'Database connection test failed',
      error: error.message,
      connection: getServerlessConnectionStatus()
    };
  }
};

export {
  connectServerlessDB,
  getServerlessConnectionStatus,
  testServerlessConnection
};
