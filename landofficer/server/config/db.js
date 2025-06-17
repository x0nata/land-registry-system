import mongoose from "mongoose";

// Connection state tracking - simplified without coordination
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
  serverId: `landofficer-server-${Date.now()}`, // Unique identifier for this server
  lastSuccessfulConnection: null,
  connectionStabilityScore: 100 // Track connection stability (0-100)
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

// Simplified Atlas connection options for stable individual connections
const getConnectionOptions = () => ({
  // Conservative timeout settings for stability
  serverSelectionTimeoutMS: 10000, // 10 seconds
  connectTimeoutMS: 20000, // 20 seconds - generous for initial connection
  socketTimeoutMS: 0, // Let Atlas handle socket timeouts

  // Conservative pool settings for individual server stability
  maxPoolSize: 3, // Small pool to avoid conflicts
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

  // Atlas-specific options
  appName: 'LandManagementSystem-LandOfficer', // Identify the application

  // Compression disabled for shared clusters
  compressors: []
});

// Exponential backoff calculation
const calculateBackoffDelay = (attempt) => {
  const baseDelay = 1000; // 1 second
  const maxDelay = 30000; // 30 seconds
  const delay = Math.min(baseDelay * Math.pow(2, attempt), maxDelay);
  return delay + Math.random() * 1000; // Add jitter
};

// Connection health check
const performHealthCheck = async () => {
  try {
if (mongoose.connection.readyState === 1) {
   // Perform a simple ping operation
  try {
    await mongoose.connection.db.admin().ping();
  } catch (error) {
    // Fall back to a simpler health check if admin ping fails
    if (error.code === 13 || error.message.includes('unauthorized')) {
      // Try a simple collection list as a health check
      await mongoose.connection.db.listCollections().toArray();
    } else {
      throw error;
    }
  }
   console.log('🏥 Database health check: OK');
   return true;
 }
    return false;
  } catch (error) {
    console.error('🏥 Database health check failed:', error.message);
    connectionMetrics.totalErrors++;
    return false;
  }
};

// Start periodic health checks
const startHealthChecks = () => {
  if (connectionState.healthCheckInterval) {
    clearInterval(connectionState.healthCheckInterval);
  }

  connectionState.healthCheckInterval = setInterval(async () => {
    const isHealthy = await performHealthCheck();
    if (!isHealthy && mongoose.connection.readyState === 1) {
      console.warn('⚠️ Atlas health check failed but connection appears active. Monitoring...');
      connectionState.connectionStabilityScore = Math.max(0, connectionState.connectionStabilityScore - 2);
    } else if (isHealthy) {
      connectionState.connectionStabilityScore = Math.min(100, connectionState.connectionStabilityScore + 1);
    }
  }, 60000); // Check every 60 seconds for Atlas (less frequent to reduce load)
};

// Stop health checks
const stopHealthChecks = () => {
  if (connectionState.healthCheckInterval) {
    clearInterval(connectionState.healthCheckInterval);
    connectionState.healthCheckInterval = null;
  }
};

// Setup comprehensive connection event handlers
const setupConnectionEventHandlers = () => {
   // Remove existing listeners to prevent duplicates
  // Remove only our specific listeners
  const events = ['connected', 'error', 'disconnected', 'reconnected', 'close', 'fullsetup', 'all'];
  events.forEach(event => mongoose.connection.removeAllListeners(event));

  // Connection opened successfully
  mongoose.connection.on('connected', () => {
    const connectionTime = Date.now() - connectionState.lastConnectionAttempt;
    connectionMetrics.totalConnections++;
    connectionMetrics.lastConnectionTime = connectionTime;
    connectionMetrics.uptime = Date.now();

    // Update connection time statistics
    connectionMetrics.totalConnectionTime += connectionTime;
    connectionMetrics.connectionCount++;

    console.log(`✅ MongoDB Connected Successfully!`);
    console.log(`📊 Host: ${mongoose.connection.host}`);
    console.log(`📊 Database: ${mongoose.connection.name}`);
    console.log(`⏱️ Connection Time: ${connectionTime}ms`);
    console.log(`📈 Total Connections: ${connectionMetrics.totalConnections}`);

    connectionState.isConnecting = false;
    connectionState.connectionAttempts = 0;
    connectionState.lastError = null;
    connectionState.consecutiveDisconnects = 0; // Reset disconnect counter on successful connection
    connectionState.reconnectionCooldown = false; // Clear cooldown on successful connection
    connectionState.lastSuccessfulConnection = Date.now();
    connectionState.connectionStabilityScore = Math.min(100, connectionState.connectionStabilityScore + 5); // Improve stability score

    console.log(`🎯 Atlas Connection Stability Score: ${connectionState.connectionStabilityScore}/100`);

    // Start health monitoring with Atlas-appropriate frequency
    startHealthChecks();
  });

  // Connection error
  mongoose.connection.on('error', (error) => {
    connectionMetrics.totalErrors++;
    connectionState.lastError = error;

    console.error(`❌ MongoDB Connection Error:`, error.message);
    console.error(`📊 Total Errors: ${connectionMetrics.totalErrors}`);

    // Log specific error types for debugging
    if (error.name === 'MongoNetworkError') {
      console.error('🌐 Network connectivity issue detected');
    } else if (error.name === 'MongoServerSelectionError') {
      console.error('🎯 Server selection failed - check cluster status');
    } else if (error.name === 'MongoTimeoutError') {
      console.error('⏰ Operation timeout - consider increasing timeout values');
    }
  });

  // Connection disconnected
  mongoose.connection.on('disconnected', () => {
    connectionMetrics.totalDisconnections++;
    connectionState.lastDisconnectTime = Date.now();
    connectionState.consecutiveDisconnects++;

    console.warn(`⚠️ MongoDB Disconnected`);
    console.warn(`📊 Total Disconnections: ${connectionMetrics.totalDisconnections}`);
    console.warn(`📊 Consecutive Disconnects: ${connectionState.consecutiveDisconnects}`);

    stopHealthChecks();

    // Prevent reconnection loops

    // Don't reconnect if:
    // 1. Intentionally disconnecting
    // 2. Too many consecutive disconnects (possible loop)
    // 3. In reconnection cooldown
    if (mongoose.connection.readyState === 3) { // Intentionally disconnecting
      console.log('🔒 Intentional disconnect, not reconnecting');
      return;
    }

    // Atlas-specific reconnection limits (more conservative for shared clusters)
    if (connectionState.consecutiveDisconnects > 3) {
      console.warn('⚠️ Too many consecutive disconnects for Atlas shared cluster, entering extended cooldown');
      connectionState.reconnectionCooldown = true;
      connectionState.connectionStabilityScore = Math.max(0, connectionState.connectionStabilityScore - 20);

      // Longer cooldown for Atlas shared clusters (10 minutes)
      setTimeout(() => {
        console.log('🔄 Atlas reconnection cooldown ended, resetting disconnect counter');
        connectionState.consecutiveDisconnects = 0;
        connectionState.reconnectionCooldown = false;
        connectionState.connectionStabilityScore = Math.min(100, connectionState.connectionStabilityScore + 10);
      }, 600000); // 10 minutes for Atlas
      return;
    }

    if (connectionState.reconnectionCooldown) {
      console.log('❄️ In reconnection cooldown, skipping reconnection attempt');
      return;
    }

    // Only attempt reconnection if conditions are met
    console.log('🔄 Attempting automatic reconnection...');
    scheduleReconnection();
  });

  // Connection reconnected
  mongoose.connection.on('reconnected', () => {
    console.log('🔄 MongoDB Reconnected Successfully!');
    connectionMetrics.totalConnections++;
    startHealthChecks();
  });

  // Connection close
  mongoose.connection.on('close', () => {
    console.log('🔒 MongoDB Connection Closed');
    stopHealthChecks();
  });

  // Full setup
  mongoose.connection.on('fullsetup', () => {
    console.log('🎯 MongoDB Full Setup Complete (All replica set members connected)');
  });

  // All connections established
  mongoose.connection.on('all', () => {
    console.log('🌐 All MongoDB Connections Established');
  });
};

// Schedule automatic reconnection with exponential backoff
const scheduleReconnection = () => {
  if (connectionState.reconnectTimeout) {
    clearTimeout(connectionState.reconnectTimeout);
  }

  const delay = calculateBackoffDelay(connectionState.connectionAttempts);
  console.log(`⏰ Scheduling reconnection in ${delay}ms (attempt ${connectionState.connectionAttempts + 1})`);

  connectionState.reconnectTimeout = setTimeout(async () => {
    if (mongoose.connection.readyState === 0) { // Disconnected
      console.log('🔄 Executing scheduled reconnection...');
      await connectWithRetry();
    }
  }, delay);
};

// Simplified connection function with retry logic
const connectWithRetry = async () => {
  if (connectionState.isConnecting) {
    console.log('🔄 Connection already in progress, skipping...');
    return mongoose.connection;
  }

  connectionState.isConnecting = true;
  connectionState.lastConnectionAttempt = Date.now();
  connectionState.connectionAttempts++;

  try {
    const connectionUri = process.env.MONGO_URI;
    if (!connectionUri) {
      throw new Error('MONGO_URI environment variable is not defined');
    }

    console.log(`🔄 Connection attempt ${connectionState.connectionAttempts} (Land Officer Server)`);
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

    // Update metrics
    connectionMetrics.totalConnections++;
    connectionMetrics.lastConnectionTime = connectionTime;
    connectionMetrics.uptime = Date.now();
    connectionState.lastSuccessfulConnection = Date.now();
    connectionState.isConnecting = false;

    console.log(`✅ MongoDB Connected Successfully!`);
    console.log(`📊 Host: ${conn.connection.host}`);
    console.log(`📊 Database: ${conn.connection.name}`);
    console.log(`⏱️ Connection Time: ${connectionTime}ms`);
    console.log(`📈 Total Connections: ${connectionMetrics.totalConnections}`);
    console.log(`🎯 Atlas Connection Stability Score: ${connectionState.connectionStabilityScore}/100`);
    console.log(`🎉 MongoDB Connection Successful!`);

    return conn.connection;

  } catch (error) {
    connectionState.isConnecting = false;
    connectionState.lastError = error;
    connectionMetrics.totalErrors++;

    console.error(`❌ MongoDB Connection Error: ${error.message}`);
    console.error(`📊 Total Errors: ${connectionMetrics.totalErrors}`);

    // Determine if we should retry
    const maxRetries = 5;
    const shouldRetry = connectionState.connectionAttempts < maxRetries;

    if (shouldRetry) {
      console.log(`🔄 Will retry connection (${connectionState.connectionAttempts}/${maxRetries})`);
      scheduleReconnection();
      return null; // Return null but don't throw to allow server to continue
    } else {
      console.error(`💥 Max connection attempts (${maxRetries}) reached. Giving up.`);
      console.error('🔧 Please check your MongoDB connection string and network connectivity.');
      throw error;
    }
  }
};

// Main connection function
const connectDB = async () => {
  try {
    // Check current connection state
    const currentState = mongoose.connection.readyState;

    if (currentState === 1) {
      console.log("✅ MongoDB already connected:", mongoose.connection.host);
      console.log("📊 Database:", mongoose.connection.name);
      console.log("🔄 Skipping reconnection attempt");
      return mongoose.connection;
    }

    if (currentState === 2) {
      console.log("🔄 MongoDB connection already in progress...");
      // Wait for the connection to complete
      return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Connection timeout while waiting for in-progress connection'));
        }, 60000); // 60 second timeout

        mongoose.connection.once('connected', () => {
          clearTimeout(timeout);
          resolve(mongoose.connection);
        });

        mongoose.connection.once('error', (error) => {
          clearTimeout(timeout);
          reject(error);
        });
      });
    }

    // Setup event handlers before attempting connection
    setupConnectionEventHandlers();

    // Attempt connection
    const connection = await connectWithRetry();

    if (connection) {
      console.log('🎯 Database connection established successfully');
      return connection;
    } else {
      console.warn('⚠️ Database connection failed but server will continue');
      return null;
    }

  } catch (error) {
    console.error(`💥 MongoDB connection failed: ${error.message}`);
    console.error('🔧 Server will continue without database connection');

    // Don't throw error to allow server to start without DB
    return null;
  }
};

// Get connection status and metrics
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
    metrics: { ...connectionMetrics },
    lastError: connectionState.lastError?.message,
    connectionAttempts: connectionState.connectionAttempts,
    uptime: connectionMetrics.uptime ? Date.now() - connectionMetrics.uptime : 0
  };
};

// Force reconnection
const forceReconnect = async () => {
  console.log('🔄 Forcing database reconnection...');

  try {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
    }

    connectionState.connectionAttempts = 0;
    return await connectWithRetry();
  } catch (error) {
    console.error('❌ Force reconnect failed:', error.message);
    throw error;
  }
};

// Graceful shutdown
const gracefulShutdown = async () => {
  console.log('🔒 Initiating graceful database shutdown...');

  stopHealthChecks();

  if (connectionState.reconnectTimeout) {
    clearTimeout(connectionState.reconnectTimeout);
  }

  if (mongoose.connection.readyState !== 0) {
    await mongoose.connection.close();
    console.log('🔒 Database connection closed gracefully');
  }
};

export default connectDB;
export {
  getConnectionStatus,
  forceReconnect,
  gracefulShutdown,
  performHealthCheck
};