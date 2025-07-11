import express from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import dotenv from "dotenv";
import { connectServerlessDB, getServerlessConnectionStatus, testServerlessConnection } from "../server/config/serverless-db.js";
import { notFound, errorHandler } from "../server/middleware/errorMiddleware.js";

// Import routes
import authRoutes from "../server/routes/authRoutes.js";
import userRoutes from "../server/routes/userRoutes.js";
import propertyRoutes from "../server/routes/propertyRoutes.js";
import documentRoutes from "../server/routes/documentRoutes.js";
import paymentRoutes from "../server/routes/paymentRoutes.js";
import applicationLogRoutes from "../server/routes/applicationLogRoutes.js";
import settingsRoutes from "../server/routes/settingsRoutes.js";
import reportsRoutes from "../server/routes/reportsRoutes.js";
import disputeRoutes from "../server/routes/disputeRoutes.js";
import transferRoutes from "../server/routes/transferRoutes.js";
import dbHealthRoutes from "../server/routes/dbHealthRoutes.js";

// Load environment variables
dotenv.config();

// Create Express app
const app = express();

// Middleware
app.use(helmet());
app.use(compression());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS configuration - allow empty arrays for production if frontend URLs not set yet
const corsOrigins = process.env.NODE_ENV === "production"
  ? [process.env.FRONTEND_URL, process.env.LANDOFFICER_FRONTEND_URL, process.env.BACKEND_URL].filter(Boolean)
  : ["http://localhost:3000", "http://localhost:3001", "http://localhost:3002", "http://localhost:3003"];

app.use(cors({
  origin: corsOrigins.length > 0 ? corsOrigins : true, // Allow all origins if no URLs configured yet
  credentials: true
}));

// Database connection middleware for serverless
app.use(async (req, res, next) => {
  try {
    // Ensure database connection for each request in serverless environment
    await connectServerlessDB();
    next();
  } catch (error) {
    console.error('Database connection failed:', error);
    res.status(503).json({
      error: "Database connection failed",
      message: "Unable to connect to database",
      timestamp: new Date().toISOString()
    });
  }
});

// Root endpoint
app.get("/", (_req, res) => {
  res.json({
    message: "Land Registry System API - Unified Serverless",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    version: "1.0.0-serverless",
    status: "operational"
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
    LANDOFFICER_FRONTEND_URL: process.env.LANDOFFICER_FRONTEND_URL ? "✅ Set" : "❌ Not Set",
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

// API Routes - Main application endpoints
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/properties", propertyRoutes);
app.use("/api/documents", documentRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/logs", applicationLogRoutes);
app.use("/api/settings", settingsRoutes);
app.use("/api/reports", reportsRoutes);
app.use("/api/disputes", disputeRoutes);
app.use("/api/transfers", transferRoutes);
app.use("/api/db-health", dbHealthRoutes);

// Error handling middleware
app.use(notFound);
app.use(errorHandler);

export default app;
