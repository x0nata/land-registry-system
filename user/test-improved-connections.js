#!/usr/bin/env node

/**
 * Test Improved Atlas Connections
 * 
 * Tests the improved configuration with coordination system enabled
 * to verify that reconnection issues are resolved
 */

import mongoose from "mongoose";
import dotenv from "dotenv";

// Load environment variables
dotenv.config({ path: './.env' });

// Create separate mongoose instances for each server
const userConnection = mongoose.createConnection();
const landOfficerConnection = mongoose.createConnection();

// Test configuration
const TEST_CONFIG = {
  testDuration: 180000, // 3 minutes
  statusInterval: 10000, // 10 seconds
  healthCheckInterval: 20000, // 20 seconds
  maxAllowedReconnections: 1 // Should be very low with improvements
};

// Tracking results
let testResults = {
  userServer: {
    connections: 0,
    disconnections: 0,
    reconnections: 0,
    errors: 0,
    healthChecks: 0,
    healthCheckFailures: 0,
    connectionTimes: []
  },
  landOfficerServer: {
    connections: 0,
    disconnections: 0,
    reconnections: 0,
    errors: 0,
    healthChecks: 0,
    healthCheckFailures: 0,
    connectionTimes: []
  },
  startTime: null
};

// User server options (same as before)
const getUserServerOptions = () => ({
  serverSelectionTimeoutMS: 5000,
  connectTimeoutMS: 10000,
  socketTimeoutMS: 0,
  maxPoolSize: 5,
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
  appName: 'LandManagementSystem-User-Improved',
  compressors: []
});

// Land officer server options (improved)
const getLandOfficerServerOptions = () => ({
  serverSelectionTimeoutMS: 8000, // Increased
  connectTimeoutMS: 15000, // Increased
  socketTimeoutMS: 0,
  maxPoolSize: 2, // Reduced significantly
  minPoolSize: 1,
  maxIdleTimeMS: 45000, // Increased
  waitQueueTimeoutMS: 8000, // Increased
  retryWrites: true,
  retryReads: true,
  heartbeatFrequencyMS: 15000, // Increased
  autoIndex: false,
  w: 'majority',
  wtimeoutMS: 10000,
  readPreference: 'primaryPreferred',
  ssl: true,
  authSource: 'admin',
  monitorCommands: false,
  appName: 'LandManagementSystem-LandOfficer-Improved',
  compressors: []
});

// Utility function to log with timestamp
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
    'IMPROVED': '🚀'
  }[type] || 'ℹ️';
  
  const serverPrefix = serverType ? `[${serverType}] ` : '';
  console.log(`${timestamp} ${emoji} ${serverPrefix}${message}`);
};

// Setup monitoring
const setupMonitoring = (connection, serverName, results) => {
  const serverType = serverName === 'User Server' ? 'USER' : 'OFFICER';
  
  connection.on('connecting', () => {
    results.lastConnectionTime = Date.now();
  });

  connection.on('connected', () => {
    const connectionTime = Date.now() - (results.lastConnectionTime || Date.now());
    results.connections++;
    results.connectionTimes.push(connectionTime);
    log(`Connected in ${connectionTime}ms (total: ${results.connections})`, 'SUCCESS', serverType);
  });

  connection.on('disconnected', () => {
    results.disconnections++;
    log(`Disconnected (total: ${results.disconnections})`, 'WARNING', serverType);
  });

  connection.on('reconnected', () => {
    results.reconnections++;
    log(`Reconnected (total reconnections: ${results.reconnections})`, 'IMPROVED', serverType);
  });

  connection.on('error', (error) => {
    results.errors++;
    log(`Error: ${error.message}`, 'ERROR', serverType);
  });
};

// Health check
const performHealthCheck = async (connection, serverName, results) => {
  const serverType = serverName === 'User Server' ? 'USER' : 'OFFICER';
  
  try {
    results.healthChecks++;
    
    if (connection.readyState !== 1) {
      results.healthCheckFailures++;
      return false;
    }
    
    await connection.db.admin().ping();
    return true;
  } catch (error) {
    results.healthCheckFailures++;
    log(`Health check failed: ${error.message}`, 'WARNING', serverType);
    return false;
  }
};

// Main test function
const testImprovedConnections = async () => {
  log('Starting Improved Atlas Connection Test', 'IMPROVED');
  log('='.repeat(60), 'INFO');
  
  try {
    const connectionUri = process.env.MONGO_URI;
    if (!connectionUri) {
      throw new Error('MONGO_URI environment variable is not defined');
    }

    log('Testing improved configuration with coordination system', 'IMPROVED');
    log(`Test Duration: ${TEST_CONFIG.testDuration / 60000} minutes`, 'INFO');

    // Setup monitoring
    setupMonitoring(userConnection, 'User Server', testResults.userServer);
    setupMonitoring(landOfficerConnection, 'Land Officer Server', testResults.landOfficerServer);

    testResults.startTime = Date.now();

    // Connect user server first
    log('Connecting User Server...', 'USER');
    await userConnection.openUri(connectionUri, getUserServerOptions());

    // Wait for coordination
    await new Promise(resolve => setTimeout(resolve, 5000));

    // Connect land officer server
    log('Connecting Land Officer Server with improved settings...', 'OFFICER');
    await landOfficerConnection.openUri(connectionUri, getLandOfficerServerOptions());

    log('Both servers connected with coordination!', 'IMPROVED');

    // Start monitoring
    const statusInterval = setInterval(() => {
      printStatus();
    }, TEST_CONFIG.statusInterval);

    const healthCheckInterval = setInterval(async () => {
      await performHealthCheck(userConnection, 'User Server', testResults.userServer);
      await performHealthCheck(landOfficerConnection, 'Land Officer Server', testResults.landOfficerServer);
    }, TEST_CONFIG.healthCheckInterval);

    // Wait for test duration
    await new Promise(resolve => setTimeout(resolve, TEST_CONFIG.testDuration));

    clearInterval(statusInterval);
    clearInterval(healthCheckInterval);

    // Final results
    await printFinalResults();

    // Close connections
    log('Closing connections...', 'INFO');
    await userConnection.close();
    await landOfficerConnection.close();
    log('All connections closed successfully', 'SUCCESS');

  } catch (error) {
    log(`Test failed: ${error.message}`, 'ERROR');
    process.exit(1);
  }
};

// Print status
const printStatus = () => {
  const elapsed = Date.now() - testResults.startTime;
  const elapsedMinutes = Math.floor(elapsed / 60000);
  const elapsedSeconds = Math.floor((elapsed % 60000) / 1000);
  
  console.log('\n' + '='.repeat(50));
  log(`Improved Connection Test (${elapsedMinutes}:${elapsedSeconds.toString().padStart(2, '0')})`, 'IMPROVED');
  
  const userState = userConnection.readyState === 1 ? '🟢 Connected' : '🔴 Disconnected';
  const officerState = landOfficerConnection.readyState === 1 ? '🟢 Connected' : '🔴 Disconnected';
  
  log(`User Server: ${userState} (reconnections: ${testResults.userServer.reconnections})`, 'USER');
  log(`Land Officer: ${officerState} (reconnections: ${testResults.landOfficerServer.reconnections})`, 'OFFICER');
  
  console.log('='.repeat(50));
};

// Print final results
const printFinalResults = async () => {
  log('='.repeat(60), 'INFO');
  log('IMPROVED CONNECTION TEST RESULTS', 'IMPROVED');
  log('='.repeat(60), 'INFO');
  
  const totalReconnections = testResults.userServer.reconnections + testResults.landOfficerServer.reconnections;
  const totalErrors = testResults.userServer.errors + testResults.landOfficerServer.errors;
  
  log(`User Server Reconnections: ${testResults.userServer.reconnections}`, 'USER');
  log(`Land Officer Reconnections: ${testResults.landOfficerServer.reconnections}`, 'OFFICER');
  log(`Total Reconnections: ${totalReconnections}`, 'INFO');
  log(`Total Errors: ${totalErrors}`, 'INFO');
  
  // Calculate success rates
  const userSuccessRate = testResults.userServer.healthChecks > 0 ? 
    ((testResults.userServer.healthChecks - testResults.userServer.healthCheckFailures) / testResults.userServer.healthChecks * 100).toFixed(1) : 100;
  const officerSuccessRate = testResults.landOfficerServer.healthChecks > 0 ? 
    ((testResults.landOfficerServer.healthChecks - testResults.landOfficerServer.healthCheckFailures) / testResults.landOfficerServer.healthChecks * 100).toFixed(1) : 100;
  
  log(`User Health Check Success: ${userSuccessRate}%`, 'USER');
  log(`Land Officer Health Check Success: ${officerSuccessRate}%`, 'OFFICER');
  
  // Overall assessment
  if (totalReconnections <= TEST_CONFIG.maxAllowedReconnections && totalErrors === 0) {
    log('🎉 EXCELLENT: Reconnection issues resolved!', 'IMPROVED');
    log('✅ Both servers maintain stable connections', 'SUCCESS');
  } else if (totalReconnections <= 2) {
    log('✅ GOOD: Significant improvement in stability', 'SUCCESS');
  } else {
    log('⚠️ NEEDS WORK: Still experiencing reconnection issues', 'WARNING');
  }
  
  log('='.repeat(60), 'INFO');
};

// Handle graceful shutdown
process.on('SIGINT', async () => {
  log('Received SIGINT, stopping test...', 'WARNING');
  await printFinalResults();
  try {
    await userConnection.close();
    await landOfficerConnection.close();
    log('All connections closed gracefully', 'SUCCESS');
  } catch (error) {
    log(`Error closing connections: ${error.message}`, 'ERROR');
  }
  process.exit(0);
});

// Start the test
testImprovedConnections().catch(error => {
  log(`Test error: ${error.message}`, 'ERROR');
  process.exit(1);
});
