import express from "express";
import mongoose from "mongoose";
import fs from "fs";
import path from "path";
import {
  getConnectionStatus,
  forceReconnect,
  testConnection
} from "../config/db.js";
import {
  dbHealthCheckMiddleware
} from "../middleware/dbMiddleware.js";
import { authenticate, isAdmin } from "../middleware/auth.js";

const router = express.Router();
 
// Middleware to add request start time for response time calculation
router.use((req, res, next) => {
  req.startTime = Date.now();
  next();
});

 // @route   GET /api/db-health/status
// @desc    Get database connection status and metrics
// @access  Private (Admin)
router.get("/status", authenticate, isAdmin, async (req, res) => {
  try {
    const connectionStatus = getConnectionStatus();

    // Perform a quick health check
    const isHealthy = await testConnection();

    res.json({
      timestamp: new Date().toISOString(),
      connection: connectionStatus,
      healthCheck: {
        isHealthy,
        lastChecked: new Date().toISOString()
      },
      server: {
        nodeVersion: process.version,
        platform: process.platform,
        uptime: process.uptime(),
        memoryUsage: process.memoryUsage()
      },
      environment: "serverless"
    });
  } catch (error) {
    console.error("Error getting database status:", error);
    res.status(500).json({
      message: "Error retrieving database status",
      error: error.message
    });
  }
});

// @route   GET /api/db-health/ping
// @desc    Simple database ping for health monitoring
// @access  Private
router.get("/ping", authenticate, dbHealthCheckMiddleware, async (req, res) => {
  try {
    if (!req.dbHealthy) {
      return res.status(503).json({
        status: "unhealthy",
        message: req.dbError || "Database connection unavailable",
        timestamp: new Date().toISOString()
      });
    }

    // Perform actual ping
    await mongoose.connection.db.admin().ping();
    
    res.json({
      status: "healthy",
      message: "Database connection is working",
      timestamp: new Date().toISOString(),
      responseTime: Date.now() - req.startTime
    });
  } catch (error) {
    console.error("Database ping failed:", error);
    res.status(503).json({
      status: "unhealthy",
      message: "Database ping failed",
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// @route   POST /api/db-health/reconnect
// @desc    Force database reconnection
// @access  Private (Admin)
router.post("/reconnect", authenticate, isAdmin, async (req, res) => {
  try {
    console.log("Admin initiated database reconnection");
    
    const connection = await forceReconnect();
    
    if (connection) {
      res.json({
        message: "Database reconnection successful",
        status: "connected",
        host: connection.host,
        database: connection.name,
        timestamp: new Date().toISOString()
      });
    } else {
      res.status(500).json({
        message: "Database reconnection failed",
        status: "disconnected",
        timestamp: new Date().toISOString()
      });
    }
  } catch (error) {
    console.error("Force reconnect failed:", error);
    res.status(500).json({
      message: "Database reconnection failed",
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Note: Circuit breaker routes removed for serverless compatibility

// @route   GET /api/db-health/metrics
// @desc    Get detailed database performance metrics
// @access  Private (Admin)
router.get("/metrics", authenticate, isAdmin, async (req, res) => {
  try {
    const connectionStatus = getConnectionStatus();
    
    // Get MongoDB server status if connected
    let serverStatus = null;
    if (mongoose.connection.readyState === 1) {
      try {
        serverStatus = await mongoose.connection.db.admin().serverStatus();
      } catch (error) {
        console.warn("Could not retrieve server status:", error.message);
      }
    }

    // Calculate performance metrics
    const metrics = {
      connection: connectionStatus,
      server: serverStatus ? {
        version: serverStatus.version,
        uptime: serverStatus.uptime,
        connections: serverStatus.connections,
        network: serverStatus.network,
        opcounters: serverStatus.opcounters,
        mem: serverStatus.mem
      } : null,
      application: {
        nodeVersion: process.version,
        platform: process.platform,
        uptime: process.uptime(),
        memoryUsage: process.memoryUsage(),
        cpuUsage: process.cpuUsage()
      },
      environment: "serverless"
    };

    res.json({
      timestamp: new Date().toISOString(),
      metrics
    });
  } catch (error) {
    console.error("Error getting database metrics:", error);
    res.status(500).json({
      message: "Error retrieving database metrics",
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// @route   GET /api/db-health/collections
// @desc    Get database collections information
// @access  Private (Admin)
router.get("/collections", authenticate, isAdmin, async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({
        message: "Database not connected",
        timestamp: new Date().toISOString()
      });
    }

    const db = mongoose.connection.db;
    const collections = await db.listCollections().toArray();
    
    const collectionStats = [];
    for (const collection of collections) {
      try {
        const stats = await db.collection(collection.name).stats();
        collectionStats.push({
          name: collection.name,
          count: stats.count,
          size: stats.size,
          avgObjSize: stats.avgObjSize,
          storageSize: stats.storageSize,
          indexes: stats.nindexes
        });
      } catch (error) {
        collectionStats.push({
          name: collection.name,
          error: error.message
        });
      }
    }

    res.json({
      timestamp: new Date().toISOString(),
      database: mongoose.connection.name,
      collections: collectionStats
    });
  } catch (error) {
    console.error("Error getting collections info:", error);
    res.status(500).json({
      message: "Error retrieving collections information",
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

export default router;
