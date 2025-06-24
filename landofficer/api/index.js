import express from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import dotenv from "dotenv";
import { connectServerlessDB, getServerlessConnectionStatus, testServerlessConnection } from "../server/config/serverless-db.js";

// Load environment variables
dotenv.config();

// Create Express app
const app = express();

// Middleware
app.use(helmet());
app.use(compression());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors({
  origin: process.env.NODE_ENV === "production"
    ? [process.env.FRONTEND_URL, process.env.BACKEND_URL].filter(Boolean)
    : ["http://localhost:3000", "http://localhost:3001", "http://localhost:3002", "http://localhost:3003"],
  credentials: true
}));

// Root endpoint
app.get("/", (_req, res) => {
  res.json({ 
    message: "Land Officer API - Serverless",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    version: "1.0.0-serverless"
  });
});

// Debug endpoint for serverless deployment
app.get("/debug", async (_req, res) => {
  try {
    const debugInfo = {
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      platform: process.platform,
      nodeVersion: process.version,
      memoryUsage: process.memoryUsage(),
      environmentVariables: {
        MONGO_URI: process.env.MONGO_URI ? "✅ Set" : "❌ Not Set",
        JWT_SECRET: process.env.JWT_SECRET ? "✅ Set" : "❌ Not Set",
        CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME ? "✅ Set" : "❌ Not Set",
        NODE_ENV: process.env.NODE_ENV || "Not Set",
        FRONTEND_URL: process.env.FRONTEND_URL ? "✅ Set" : "❌ Not Set",
        BACKEND_URL: process.env.BACKEND_URL ? "✅ Set" : "❌ Not Set"
      },
      database: getServerlessConnectionStatus()
    };
    
    res.json(debugInfo);
  } catch (error) {
    res.status(500).json({
      error: "Debug endpoint failed",
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Database health check endpoint
app.get("/api/db-health/public", async (_req, res) => {
  try {
    const testResult = await testServerlessConnection();
    
    if (testResult.success) {
      res.json({
        status: "healthy",
        message: testResult.message,
        database: testResult.connection,
        timestamp: new Date().toISOString()
      });
    } else {
      res.status(503).json({
        status: "unhealthy",
        message: testResult.message,
        error: testResult.error,
        database: testResult.connection,
        timestamp: new Date().toISOString()
      });
    }
  } catch (error) {
    res.status(503).json({
      status: "error",
      message: "Database health check failed",
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Database connection test endpoint
app.get("/api/test-connection", async (_req, res) => {
  try {
    console.log('🔄 Testing database connection...');
    
    const connection = await connectServerlessDB();
    
    // Test with a simple operation
    await connection.db.admin().ping();
    
    res.json({
      success: true,
      message: "Database connection successful",
      connection: {
        host: connection.host,
        name: connection.name,
        readyState: connection.readyState
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Database connection test failed:', error);
    
    res.status(500).json({
      success: false,
      message: "Database connection failed",
      error: error.message,
      environmentCheck: {
        MONGO_URI: process.env.MONGO_URI ? "Set" : "Not Set"
      },
      timestamp: new Date().toISOString()
    });
  }
});

// Environment variables check endpoint
app.get("/api/env-check", (_req, res) => {
  const envVars = {
    MONGO_URI: process.env.MONGO_URI ? "✅ Set" : "❌ Not Set",
    JWT_SECRET: process.env.JWT_SECRET ? "✅ Set" : "❌ Not Set",
    CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME ? "✅ Set" : "❌ Not Set",
    CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY ? "✅ Set" : "❌ Not Set",
    CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET ? "✅ Set" : "❌ Not Set",
    NODE_ENV: process.env.NODE_ENV || "❌ Not Set",
    FRONTEND_URL: process.env.FRONTEND_URL ? "✅ Set" : "❌ Not Set",
    BACKEND_URL: process.env.BACKEND_URL ? "✅ Set" : "❌ Not Set"
  };

  const missingVars = Object.entries(envVars)
    .filter(([_, value]) => value.includes("❌"))
    .map(([key, _]) => key);

  res.json({
    environmentVariables: envVars,
    missingVariables: missingVars,
    allSet: missingVars.length === 0,
    timestamp: new Date().toISOString()
  });
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('API Error:', error);
  res.status(500).json({
    error: "Internal Server Error",
    message: process.env.NODE_ENV === 'production' ? 'Something went wrong' : error.message,
    timestamp: new Date().toISOString()
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: "Not Found",
    message: `Route ${req.method} ${req.path} not found`,
    timestamp: new Date().toISOString()
  });
});

export default app;
