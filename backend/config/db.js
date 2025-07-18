import mongoose from "mongoose";
import { initGridFS } from "./gridfs.js";

// Global connection cache for serverless functions
let cachedConnection = null;

// Connection state tracking
let connectionState = {
  isConnecting: false,
  lastConnectionAttempt: null,
  connectionAttempts: 0,
  lastError: null,
  healthCheckInterval: null,
  reconnectTimeout: null,
  lastDisconnectTime: null,
  consecutiveDisconnects: 0,
  reconnectionCooldown: false,
  serverId: `unified-server-${Date.now()}`,
  lastSuccessfulConnection: null,
  connectionStabilityScore: 100
};

// Connection metrics
let connectionMetrics = {
  totalConnections: 0,
  totalDisconnections: 0,
  totalErrors: 0,
  totalConnectionTime: 0,
  connectionCount: 0,
  lastConnectionTime: null,
  uptime: null
};

// Serverless-optimized connection options
const getServerlessConnectionOptions = () => ({
  // Aggressive timeouts for serverless - fail fast
  serverSelectionTimeoutMS: 2000, // 2 seconds - very fast for serverless
  connectTimeoutMS: 3000, // 3 seconds - quick connection
  socketTimeoutMS: 5000, // 5 seconds socket timeout

  // Minimal pool for serverless with immediate connection
  maxPoolSize: 1, // Single connection for serverless
  minPoolSize: 1, // Start with 1 connection immediately
  maxIdleTimeMS: 30000, // 30 seconds - shorter for serverless
  waitQueueTimeoutMS: 2000, // 2 seconds wait queue timeout

  // Enhanced reliability settings
  retryWrites: true,
  retryReads: false, // Disable retry reads for faster failure

  // Atlas compatibility
  ssl: true,
  authSource: 'admin',

  // Disable monitoring for serverless performance
  monitorCommands: false,

  // Atlas-specific options
  appName: 'LandManagementSystem-Unified',

  // Disable compression for faster connection
  compressors: [],

  // Force immediate connection
  bufferCommands: false,
  bufferMaxEntries: 0,
  
  // Write concern
  w: 'majority',
  wtimeoutMS: 10000, // 10 seconds
  
  // Read preference
  readPreference: 'primary'
});

// Standard connection options for development
const getStandardConnectionOptions = () => ({
  // Conservative timeout settings for stability
  serverSelectionTimeoutMS: 10000, // 10 seconds
  connectTimeoutMS: 20000, // 20 seconds - generous for initial connection
  socketTimeoutMS: 0, // Let Atlas handle socket timeouts

  // Conservative pool settings for individual server stability
  maxPoolSize: 4, // Small pool to avoid conflicts
  minPoolSize: 1, // Start minimal
  maxIdleTimeMS: 60000, // 60 seconds - longer idle time
  waitQueueTimeoutMS: 10000, // 10 seconds

  // Standard reliability settings
  retryWrites: true,
  retryReads: true,
  heartbeatFrequencyMS: 30000, // 30 seconds - less frequent heartbeats

  // Atlas compatibility options
  autoIndex: false,

  // Write concern
  w: 'majority',
  wtimeoutMS: 15000, // 15 seconds

  // Read preference
  readPreference: 'primary', // Always use primary for consistency

  // Atlas connection options
  ssl: true,
  authSource: 'admin',

  // Reduce monitoring overhead
  monitorCommands: false,

  // Application identification
  appName: 'LandManagementSystem-Unified',

  // Compression disabled for shared clusters
  compressors: []
});

// Determine if running in serverless environment
const isServerless = () => {
  return process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME || process.env.NETLIFY;
};

// Get appropriate connection options based on environment
const getConnectionOptions = () => {
  return isServerless() ? getServerlessConnectionOptions() : getStandardConnectionOptions();
};

// Exponential backoff calculation
const calculateBackoffDelay = (attempt) => {
  const baseDelay = 1000; // 1 second
  const maxDelay = 30000; // 30 seconds
  const delay = Math.min(baseDelay * Math.pow(2, attempt), maxDelay);
  return delay + Math.random() * 1000; // Add jitter
};

// Serverless database connection function with buffering control
const connectServerlessDB = async () => {
  try {
    // Return cached connection if available and healthy
    if (cachedConnection && mongoose.connection.readyState === 1) {
      console.log('🔄 Using cached database connection');
      return cachedConnection;
    }

    // Check for connection string
    const connectionUri = process.env.MONGODB_URI;
    if (!connectionUri) {
      throw new Error('MONGODB_URI environment variable is not defined');
    }

    console.log('🔄 Creating new serverless database connection...');

    // Disable buffering globally to prevent timeout issues
    mongoose.set('bufferCommands', false);
    mongoose.set('bufferMaxEntries', 0);

    // Close any existing connection
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
    }

    // Create new connection with serverless options
    const options = getServerlessConnectionOptions();

    console.log('⚙️ Connecting with options:', {
      serverSelectionTimeoutMS: options.serverSelectionTimeoutMS,
      connectTimeoutMS: options.connectTimeoutMS,
      maxPoolSize: options.maxPoolSize
    });

    const conn = await mongoose.connect(connectionUri, options);

    cachedConnection = conn.connection;

    // Re-enable buffering after successful connection
    mongoose.set('bufferCommands', true);
    mongoose.set('bufferMaxEntries', -1);

    // Initialize GridFS after successful connection
    try {
      initGridFS();
      console.log('✅ GridFS initialized for serverless');
    } catch (gridfsError) {
      console.warn('⚠️ GridFS initialization failed:', gridfsError.message);
    }

    console.log('✅ Serverless MongoDB Connected Successfully!');
    console.log('📊 Host:', conn.connection.host);
    console.log('📊 Database:', conn.connection.name);
    console.log('📊 ReadyState:', mongoose.connection.readyState);

    return cachedConnection;

  } catch (error) {
    console.error('❌ Serverless MongoDB Connection Error:', error.message);
    // Re-enable buffering on error
    mongoose.set('bufferCommands', true);
    mongoose.set('bufferMaxEntries', -1);
    cachedConnection = null;
    throw error;
  }
};

// Standard connection function with retry logic
const connectWithRetry = async () => {
  if (connectionState.isConnecting) {
    console.log('🔄 Connection already in progress, skipping...');
    return mongoose.connection;
  }

  connectionState.isConnecting = true;
  connectionState.lastConnectionAttempt = Date.now();
  connectionState.connectionAttempts++;

  try {
    const connectionUri = process.env.MONGODB_URI;
    if (!connectionUri) {
      console.error('❌ MONGODB_URI environment variable is not defined');
      throw new Error('MONGODB_URI environment variable is not defined');
    }

    console.log(`🔄 Connection attempt ${connectionState.connectionAttempts}`);
    console.log("📍 Connection URI:", connectionUri?.replace(/\/\/([^:]+):([^@]+)@/, '//***:***@'));

    const options = getConnectionOptions();
    console.log("⚙️ Connection options:", JSON.stringify({
      serverSelectionTimeoutMS: options.serverSelectionTimeoutMS,
      connectTimeoutMS: options.connectTimeoutMS,
      socketTimeoutMS: options.socketTimeoutMS,
      maxPoolSize: options.maxPoolSize,
      minPoolSize: options.minPoolSize,
      heartbeatFrequencyMS: options.heartbeatFrequencyMS
    }, null, 2));

    // Set mongoose global options
    mongoose.set('bufferCommands', false);
    mongoose.set('strictQuery', false);

    const startTime = Date.now();
    const conn = await mongoose.connect(connectionUri, options);
    const connectionTime = Date.now() - startTime;

    // Initialize GridFS after successful connection
    try {
      initGridFS();
      console.log('✅ GridFS initialized for standard connection');
    } catch (gridfsError) {
      console.warn('⚠️ GridFS initialization failed:', gridfsError.message);
    }

    // Update metrics
    connectionMetrics.lastConnectionTime = connectionTime;
    connectionMetrics.uptime = Date.now();
    connectionState.lastSuccessfulConnection = Date.now();
    connectionState.isConnecting = false;

    console.log('✅ MongoDB Connected Successfully!');
    console.log('📊 Host:', conn.connection.host);
    console.log('📊 Database:', conn.connection.name);
    console.log(`⏱️ Connection time: ${connectionTime}ms`);

    return conn.connection;

  } catch (error) {
    connectionState.isConnecting = false;
    connectionState.lastError = error;
    connectionMetrics.totalErrors++;

    console.error(`❌ MongoDB Connection Error (Attempt ${connectionState.connectionAttempts}):`, error.message);

    // Implement exponential backoff for retries
    if (connectionState.connectionAttempts < 5) {
      const delay = calculateBackoffDelay(connectionState.connectionAttempts);
      console.log(`🔄 Retrying connection in ${delay}ms...`);
      
      await new Promise(resolve => setTimeout(resolve, delay));
      return await connectWithRetry();
    } else {
      console.error('💥 Max connection attempts reached. Giving up.');
      throw error;
    }
  }
};

// Main connection function that chooses between serverless and standard
const connectDB = async () => {
  try {
    if (isServerless()) {
      console.log('🚀 Detected serverless environment, using serverless connection...');
      return await connectServerlessDB();
    } else {
      console.log('🖥️ Detected standard environment, using standard connection...');
      return await connectWithRetry();
    }
  } catch (error) {
    console.error(`💥 MongoDB connection failed: ${error.message}`);
    if (process.env.NODE_ENV !== 'production') {
      console.error('🔧 Server will continue without database connection');
    }
    return null;
  }
};

// Get connection status
const getConnectionStatus = () => {
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
    serverless: isServerless(),
    timestamp: new Date().toISOString()
  };
};

// Test database connection
const testConnection = async () => {
  try {
    const connection = isServerless() ? await connectServerlessDB() : await connectWithRetry();

    // Test with a simple ping
    await mongoose.connection.db.admin().ping();

    return {
      success: true,
      message: 'Database connection test successful',
      connection: getConnectionStatus()
    };
  } catch (error) {
    return {
      success: false,
      message: 'Database connection test failed',
      error: error.message,
      connection: getConnectionStatus()
    };
  }
};

// Setup connection event handlers
const setupConnectionEventHandlers = () => {
  // Connection successful
  mongoose.connection.on('connected', () => {
    connectionMetrics.totalConnections++;
    connectionState.lastSuccessfulConnection = Date.now();
    connectionState.consecutiveDisconnects = 0;
    connectionState.connectionStabilityScore = Math.min(100, connectionState.connectionStabilityScore + 10);

    // Initialize GridFS on connection
    try {
      initGridFS();
      console.log('✅ GridFS initialized on connection event');
    } catch (gridfsError) {
      console.warn('⚠️ GridFS initialization failed on connection event:', gridfsError.message);
    }

    if (process.env.NODE_ENV !== 'production') {
      console.log('✅ MongoDB Connected');
      console.log(`📊 Total Connections: ${connectionMetrics.totalConnections}`);
    }
  });

  // Connection error
  mongoose.connection.on('error', (error) => {
    connectionMetrics.totalErrors++;
    connectionState.lastError = error;

    console.error(`❌ MongoDB Connection Error:`, error.message);

    if (process.env.NODE_ENV !== 'production') {
      console.error(`📊 Total Errors: ${connectionMetrics.totalErrors}`);
    }
  });

  // Connection disconnected
  mongoose.connection.on('disconnected', () => {
    connectionMetrics.totalDisconnections++;
    connectionState.lastDisconnectTime = Date.now();
    connectionState.consecutiveDisconnects++;
    connectionState.connectionStabilityScore = Math.max(0, connectionState.connectionStabilityScore - 20);

    if (process.env.NODE_ENV !== 'production') {
      console.log('🔌 MongoDB Disconnected');
      console.log(`📊 Total Disconnections: ${connectionMetrics.totalDisconnections}`);
    }
  });

  // Connection reconnected
  mongoose.connection.on('reconnected', () => {
    connectionState.consecutiveDisconnects = 0;
    connectionState.connectionStabilityScore = Math.min(100, connectionState.connectionStabilityScore + 5);

    if (process.env.NODE_ENV !== 'production') {
      console.log('🔄 MongoDB Reconnected');
    }
  });
};

// Graceful shutdown
const gracefulShutdown = async () => {
  console.log('🔒 Initiating graceful database shutdown...');

  if (connectionState.reconnectTimeout) {
    clearTimeout(connectionState.reconnectTimeout);
  }

  if (connectionState.healthCheckInterval) {
    clearInterval(connectionState.healthCheckInterval);
  }

  if (mongoose.connection.readyState !== 0) {
    await mongoose.connection.close();
    console.log('🔒 Database connection closed gracefully');
  }

  cachedConnection = null;
};

// Force reconnection
const forceReconnect = async () => {
  console.log('🔄 Forcing database reconnection...');

  try {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
    }

    connectionState.connectionAttempts = 0;
    cachedConnection = null;
    return await connectDB();
  } catch (error) {
    console.error('❌ Force reconnect failed:', error.message);
    throw error;
  }
};

// Get connection metrics
const getConnectionMetrics = () => ({
  ...connectionMetrics,
  connectionState: { ...connectionState },
  currentStatus: getConnectionStatus()
});

export default connectDB;
export {
  connectServerlessDB,
  getConnectionStatus,
  testConnection,
  setupConnectionEventHandlers,
  gracefulShutdown,
  forceReconnect,
  getConnectionMetrics,
  isServerless
};
