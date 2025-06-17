#!/usr/bin/env node

/**
 * Atlas Reconnection Analysis Test
 * 
 * Specifically tests for reconnection issues and Atlas connection limits
 * that might be causing the land officer server to keep reconnecting
 */

import mongoose from "mongoose";
import dotenv from "dotenv";

// Load environment variables
dotenv.config({ path: './.env' });

// Create separate mongoose instances for each server
const userConnection = mongoose.createConnection();
const landOfficerConnection = mongoose.createConnection();

// Test configuration focused on reconnection analysis
const TEST_CONFIG = {
  testDuration: 120000, // 2 minutes for initial analysis
  statusInterval: 5000, // 5 seconds for detailed monitoring
  healthCheckInterval: 15000, // 15 seconds health check
  maxAllowedReconnections: 3, // Maximum reconnections before flagging as issue
  connectionStressTest: true, // Enable connection stress testing
  monitorAtlasLimits: true // Monitor Atlas connection limits
};

// Enhanced tracking for reconnection analysis
let reconnectionAnalysis = {
  userServer: {
    connections: 0,
    disconnections: 0,
    reconnections: 0,
    errors: 0,
    healthChecks: 0,
    healthCheckFailures: 0,
    connectionTimes: [],
    disconnectionReasons: [],
    lastConnectionTime: null,
    lastDisconnectionTime: null,
    connectionStability: 100,
    atlasErrors: []
  },
  landOfficerServer: {
    connections: 0,
    disconnections: 0,
    reconnections: 0,
    errors: 0,
    healthChecks: 0,
    healthCheckFailures: 0,
    connectionTimes: [],
    disconnectionReasons: [],
    lastConnectionTime: null,
    lastDisconnectionTime: null,
    connectionStability: 100,
    atlasErrors: []
  },
  startTime: null,
  atlasConnectionPool: {
    totalConnections: 0,
    activeConnections: 0,
    maxObservedConnections: 0,
    connectionConflicts: 0
  }
};

// Atlas-optimized options for user server (conservative)
const getUserServerOptions = () => ({
  serverSelectionTimeoutMS: 5000,
  connectTimeoutMS: 10000,
  socketTimeoutMS: 0,
  maxPoolSize: 3, // Reduced to test connection limits
  minPoolSize: 1,
  maxIdleTimeMS: 30000,
  waitQueueTimeoutMS: 5000,
  retryWrites: true,
  retryReads: true,
  heartbeatFrequencyMS: 10000,
  autoIndex: false,
  w: 'majority',
  wtimeoutMS: 10000,
  readPreference: 'primaryPreferred',
  ssl: true,
  authSource: 'admin',
  monitorCommands: false,
  appName: 'LandManagementSystem-User-Test',
  compressors: []
});

// Atlas-optimized options for land officer server (even more conservative)
const getLandOfficerServerOptions = () => ({
  serverSelectionTimeoutMS: 5000,
  connectTimeoutMS: 10000,
  socketTimeoutMS: 0,
  maxPoolSize: 2, // Very conservative to avoid conflicts
  minPoolSize: 1,
  maxIdleTimeMS: 30000,
  waitQueueTimeoutMS: 5000,
  retryWrites: true,
  retryReads: true,
  heartbeatFrequencyMS: 10000,
  autoIndex: false,
  w: 'majority',
  wtimeoutMS: 10000,
  readPreference: 'primaryPreferred',
  ssl: true,
  authSource: 'admin',
  monitorCommands: false,
  appName: 'LandManagementSystem-LandOfficer-Test',
  compressors: []
});

// Utility function to log with detailed timestamp
const log = (message, type = 'INFO', serverType = null) => {
  const timestamp = new Date().toISOString();
  const emoji = {
    'INFO': 'ℹ️',
    'SUCCESS': '✅',
    'ERROR': '❌',
    'WARNING': '⚠️',
    'TEST': '🧪',
    'USER': '👤',
    'OFFICER': '👮',
    'ATLAS': '🌐',
    'RECONNECT': '🔄'
  }[type] || 'ℹ️';
  
  const serverPrefix = serverType ? `[${serverType}] ` : '';
  console.log(`${timestamp} ${emoji} ${serverPrefix}${message}`);
};

// Enhanced connection monitoring with reconnection analysis
const setupReconnectionMonitoring = (connection, serverName, results) => {
  const serverType = serverName === 'User Server' ? 'USER' : 'OFFICER';
  
  connection.on('connecting', () => {
    log(`Attempting connection...`, 'INFO', serverType);
    results.lastConnectionTime = Date.now();
  });

  connection.on('connected', () => {
    const connectionTime = Date.now() - (results.lastConnectionTime || Date.now());
    results.connections++;
    results.connectionTimes.push(connectionTime);
    reconnectionAnalysis.atlasConnectionPool.totalConnections++;
    reconnectionAnalysis.atlasConnectionPool.activeConnections++;
    reconnectionAnalysis.atlasConnectionPool.maxObservedConnections = Math.max(
      reconnectionAnalysis.atlasConnectionPool.maxObservedConnections,
      reconnectionAnalysis.atlasConnectionPool.activeConnections
    );
    
    log(`Connected successfully in ${connectionTime}ms (total: ${results.connections})`, 'SUCCESS', serverType);
    log(`Atlas Pool: ${reconnectionAnalysis.atlasConnectionPool.activeConnections} active connections`, 'ATLAS');
  });

  connection.on('disconnected', () => {
    results.disconnections++;
    results.lastDisconnectionTime = Date.now();
    reconnectionAnalysis.atlasConnectionPool.activeConnections = Math.max(0, 
      reconnectionAnalysis.atlasConnectionPool.activeConnections - 1);
    
    // Calculate connection stability
    if (results.connections > 0) {
      results.connectionStability = Math.max(0, 
        results.connectionStability - (10 / results.connections));
    }
    
    log(`Disconnected (total: ${results.disconnections}, stability: ${results.connectionStability.toFixed(1)}%)`, 'WARNING', serverType);
    log(`Atlas Pool: ${reconnectionAnalysis.atlasConnectionPool.activeConnections} active connections`, 'ATLAS');
  });

  connection.on('reconnected', () => {
    results.reconnections++;
    reconnectionAnalysis.atlasConnectionPool.activeConnections++;
    
    log(`Reconnected successfully (total reconnections: ${results.reconnections})`, 'RECONNECT', serverType);
    
    // Check for excessive reconnections
    if (results.reconnections > TEST_CONFIG.maxAllowedReconnections) {
      log(`⚠️ EXCESSIVE RECONNECTIONS DETECTED! (${results.reconnections} > ${TEST_CONFIG.maxAllowedReconnections})`, 'ERROR', serverType);
      reconnectionAnalysis.atlasConnectionPool.connectionConflicts++;
    }
  });

  connection.on('error', (error) => {
    results.errors++;
    results.connectionStability = Math.max(0, results.connectionStability - 5);
    
    // Categorize Atlas-specific errors
    const errorType = categorizeAtlasError(error);
    results.atlasErrors.push({
      type: errorType,
      message: error.message,
      timestamp: Date.now()
    });
    
    log(`Error (${errorType}): ${error.message}`, 'ERROR', serverType);
    
    // Check for connection limit errors
    if (error.message.includes('connection') && error.message.includes('limit')) {
      log(`🚨 ATLAS CONNECTION LIMIT ERROR DETECTED!`, 'ERROR', serverType);
      reconnectionAnalysis.atlasConnectionPool.connectionConflicts++;
    }
  });

  connection.on('close', () => {
    reconnectionAnalysis.atlasConnectionPool.activeConnections = Math.max(0, 
      reconnectionAnalysis.atlasConnectionPool.activeConnections - 1);
    log(`Connection closed`, 'INFO', serverType);
  });
};

// Categorize Atlas-specific errors
const categorizeAtlasError = (error) => {
  const message = error.message.toLowerCase();
  
  if (message.includes('timeout')) return 'TIMEOUT';
  if (message.includes('network')) return 'NETWORK';
  if (message.includes('authentication')) return 'AUTH';
  if (message.includes('connection') && message.includes('limit')) return 'CONNECTION_LIMIT';
  if (message.includes('server selection')) return 'SERVER_SELECTION';
  if (message.includes('pool')) return 'POOL_ERROR';
  
  return 'OTHER';
};

// Enhanced health check with Atlas-specific monitoring
const performEnhancedHealthCheck = async (connection, serverName, results) => {
  const serverType = serverName === 'User Server' ? 'USER' : 'OFFICER';

  try {
    results.healthChecks++;

    if (connection.readyState !== 1) {
      results.healthCheckFailures++;
      log(`Health check failed - connection not ready (state: ${connection.readyState})`, 'WARNING', serverType);
      return false;
    }

    // Perform ping with timeout
    const pingStart = Date.now();
    await Promise.race([
      connection.db.admin().ping(),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Ping timeout')), 5000))
    ]);
    const pingTime = Date.now() - pingStart;

    // Check for slow responses (potential Atlas issues)
    if (pingTime > 2000) {
      log(`Health check slow response: ${pingTime}ms`, 'WARNING', serverType);
    }

    return true;
  } catch (error) {
    results.healthCheckFailures++;
    log(`Health check failed: ${error.message}`, 'WARNING', serverType);
    return false;
  }
};

// Main reconnection analysis test
const runReconnectionAnalysis = async () => {
  log('Starting Atlas Reconnection Analysis Test', 'TEST');
  log('='.repeat(70), 'INFO');

  try {
    const connectionUri = process.env.MONGO_URI;
    if (!connectionUri) {
      throw new Error('MONGO_URI environment variable is not defined');
    }

    log('Atlas Connection URI: ' + connectionUri?.replace(/\/\/([^:]+):([^@]+)@/, '//***:***@'), 'INFO');
    log(`Test Duration: ${TEST_CONFIG.testDuration / 60000} minutes`, 'INFO');
    log(`Max Allowed Reconnections: ${TEST_CONFIG.maxAllowedReconnections}`, 'INFO');

    // Setup enhanced monitoring
    setupReconnectionMonitoring(userConnection, 'User Server', reconnectionAnalysis.userServer);
    setupReconnectionMonitoring(landOfficerConnection, 'Land Officer Server', reconnectionAnalysis.landOfficerServer);

    reconnectionAnalysis.startTime = Date.now();

    // Connect user server first
    log('Phase 1: Connecting User Server...', 'USER');
    await userConnection.openUri(connectionUri, getUserServerOptions());
    log('User Server connected successfully', 'SUCCESS');

    // Wait and monitor for initial stability
    await new Promise(resolve => setTimeout(resolve, 10000));

    // Connect land officer server
    log('Phase 2: Connecting Land Officer Server...', 'OFFICER');
    await landOfficerConnection.openUri(connectionUri, getLandOfficerServerOptions());
    log('Land Officer Server connected successfully', 'SUCCESS');

    log('Phase 3: Starting monitoring and analysis...', 'TEST');

    // Start detailed monitoring
    const statusInterval = setInterval(() => {
      printDetailedStatus();
    }, TEST_CONFIG.statusInterval);

    const healthCheckInterval = setInterval(async () => {
      await performEnhancedHealthCheck(userConnection, 'User Server', reconnectionAnalysis.userServer);
      await performEnhancedHealthCheck(landOfficerConnection, 'Land Officer Server', reconnectionAnalysis.landOfficerServer);
    }, TEST_CONFIG.healthCheckInterval);

    // Wait for test duration
    await new Promise(resolve => setTimeout(resolve, TEST_CONFIG.testDuration));

    clearInterval(statusInterval);
    clearInterval(healthCheckInterval);

    // Generate comprehensive analysis report
    await generateAnalysisReport();

    // Close connections
    log('Closing connections...', 'INFO');
    await userConnection.close();
    await landOfficerConnection.close();
    log('All connections closed successfully', 'SUCCESS');

  } catch (error) {
    log(`Reconnection analysis failed: ${error.message}`, 'ERROR');
    process.exit(1);
  }
};

// Print detailed status during monitoring
const printDetailedStatus = () => {
  const elapsed = Date.now() - reconnectionAnalysis.startTime;
  const elapsedMinutes = Math.floor(elapsed / 60000);
  const elapsedSeconds = Math.floor((elapsed % 60000) / 1000);

  console.log('\n' + '='.repeat(60));
  log(`Reconnection Analysis Status (${elapsedMinutes}:${elapsedSeconds.toString().padStart(2, '0')})`, 'TEST');

  // User server status
  const userState = userConnection.readyState === 1 ? '🟢 Connected' : '🔴 Disconnected';
  log(`User Server: ${userState}`, 'USER');
  log(`  Reconnections: ${reconnectionAnalysis.userServer.reconnections}/${TEST_CONFIG.maxAllowedReconnections}`, 'USER');
  log(`  Stability: ${reconnectionAnalysis.userServer.connectionStability.toFixed(1)}%`, 'USER');

  // Land officer server status
  const officerState = landOfficerConnection.readyState === 1 ? '🟢 Connected' : '🔴 Disconnected';
  log(`Land Officer: ${officerState}`, 'OFFICER');
  log(`  Reconnections: ${reconnectionAnalysis.landOfficerServer.reconnections}/${TEST_CONFIG.maxAllowedReconnections}`, 'OFFICER');
  log(`  Stability: ${reconnectionAnalysis.landOfficerServer.connectionStability.toFixed(1)}%`, 'OFFICER');

  // Atlas pool status
  log(`Atlas Pool: ${reconnectionAnalysis.atlasConnectionPool.activeConnections} active, ${reconnectionAnalysis.atlasConnectionPool.maxObservedConnections} max observed`, 'ATLAS');
  log(`Connection Conflicts: ${reconnectionAnalysis.atlasConnectionPool.connectionConflicts}`, 'ATLAS');

  // Alert for issues
  if (reconnectionAnalysis.userServer.reconnections > TEST_CONFIG.maxAllowedReconnections) {
    log('🚨 USER SERVER: EXCESSIVE RECONNECTIONS!', 'ERROR');
  }
  if (reconnectionAnalysis.landOfficerServer.reconnections > TEST_CONFIG.maxAllowedReconnections) {
    log('🚨 LAND OFFICER SERVER: EXCESSIVE RECONNECTIONS!', 'ERROR');
  }

  console.log('='.repeat(60));
};

// Generate comprehensive analysis report
const generateAnalysisReport = async () => {
  log('='.repeat(70), 'INFO');
  log('ATLAS RECONNECTION ANALYSIS REPORT', 'TEST');
  log('='.repeat(70), 'INFO');

  const totalTime = Date.now() - reconnectionAnalysis.startTime;
  const totalMinutes = Math.floor(totalTime / 60000);

  log(`Test Duration: ${totalMinutes} minutes`, 'INFO');

  // User server analysis
  log('\n📊 USER SERVER ANALYSIS:', 'USER');
  analyzeServerResults(reconnectionAnalysis.userServer, 'USER');

  // Land officer server analysis
  log('\n📊 LAND OFFICER SERVER ANALYSIS:', 'OFFICER');
  analyzeServerResults(reconnectionAnalysis.landOfficerServer, 'OFFICER');

  // Atlas connection pool analysis
  log('\n🌐 ATLAS CONNECTION POOL ANALYSIS:', 'ATLAS');
  log(`Total Connections Created: ${reconnectionAnalysis.atlasConnectionPool.totalConnections}`, 'ATLAS');
  log(`Maximum Concurrent Connections: ${reconnectionAnalysis.atlasConnectionPool.maxObservedConnections}`, 'ATLAS');
  log(`Connection Conflicts Detected: ${reconnectionAnalysis.atlasConnectionPool.connectionConflicts}`, 'ATLAS');

  // Overall assessment
  log('\n🎯 OVERALL ASSESSMENT:', 'TEST');
  const totalReconnections = reconnectionAnalysis.userServer.reconnections + reconnectionAnalysis.landOfficerServer.reconnections;
  const totalErrors = reconnectionAnalysis.userServer.errors + reconnectionAnalysis.landOfficerServer.errors;

  if (totalReconnections === 0 && totalErrors === 0) {
    log('✅ EXCELLENT: No reconnection issues detected', 'SUCCESS');
  } else if (totalReconnections <= TEST_CONFIG.maxAllowedReconnections * 2 && totalErrors <= 2) {
    log('⚠️ ACCEPTABLE: Minor reconnection issues, within tolerance', 'WARNING');
  } else {
    log('❌ PROBLEMATIC: Significant reconnection issues detected', 'ERROR');
    log('🔧 RECOMMENDATION: Review Atlas configuration and connection limits', 'ERROR');
  }

  // Specific recommendations
  log('\n💡 RECOMMENDATIONS:', 'INFO');
  if (reconnectionAnalysis.landOfficerServer.reconnections > reconnectionAnalysis.userServer.reconnections) {
    log('• Land Officer server shows more reconnections - consider reducing its pool size', 'INFO');
  }
  if (reconnectionAnalysis.atlasConnectionPool.maxObservedConnections > 8) {
    log('• High concurrent connections detected - consider implementing connection coordination', 'INFO');
  }
  if (reconnectionAnalysis.atlasConnectionPool.connectionConflicts > 0) {
    log('• Connection conflicts detected - enable Atlas connection coordinator', 'INFO');
  }

  log('='.repeat(70), 'INFO');
};

// Analyze individual server results
const analyzeServerResults = (results, serverType) => {
  log(`Connections: ${results.connections}`, serverType);
  log(`Disconnections: ${results.disconnections}`, serverType);
  log(`Reconnections: ${results.reconnections}`, serverType);
  log(`Errors: ${results.errors}`, serverType);
  log(`Connection Stability: ${results.connectionStability.toFixed(1)}%`, serverType);
  log(`Health Check Success Rate: ${calculateSuccessRate(results)}%`, serverType);

  if (results.connectionTimes.length > 0) {
    const avgConnectionTime = results.connectionTimes.reduce((a, b) => a + b, 0) / results.connectionTimes.length;
    log(`Average Connection Time: ${avgConnectionTime.toFixed(0)}ms`, serverType);
  }

  // Error analysis
  if (results.atlasErrors.length > 0) {
    const errorTypes = {};
    results.atlasErrors.forEach(error => {
      errorTypes[error.type] = (errorTypes[error.type] || 0) + 1;
    });
    log(`Error Types: ${Object.entries(errorTypes).map(([type, count]) => `${type}(${count})`).join(', ')}`, serverType);
  }
};

// Calculate health check success rate
const calculateSuccessRate = (results) => {
  if (results.healthChecks === 0) return 100;
  return ((results.healthChecks - results.healthCheckFailures) / results.healthChecks * 100).toFixed(1);
};

// Handle graceful shutdown
process.on('SIGINT', async () => {
  log('Received SIGINT, stopping analysis...', 'WARNING');
  await generateAnalysisReport();
  try {
    await userConnection.close();
    await landOfficerConnection.close();
    log('All connections closed gracefully', 'SUCCESS');
  } catch (error) {
    log(`Error closing connections: ${error.message}`, 'ERROR');
  }
  process.exit(0);
});

// Start the reconnection analysis
runReconnectionAnalysis().catch(error => {
  log(`Reconnection analysis error: ${error.message}`, 'ERROR');
  process.exit(1);
});
