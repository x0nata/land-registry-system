import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import compression from "compression";
import dotenv from "dotenv";
import connectDB, { gracefulShutdown } from "./config/db.js";
import { initGridFS } from "./config/gridfs.js";
import { notFound, errorHandler } from "./middleware/errorMiddleware.js";
import { dbOperationMiddleware } from "./middleware/dbMiddleware.js";
const PORT = process.env.PORT || 3001;

// Import routes
import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import propertyRoutes from "./routes/propertyRoutes.js";
import documentRoutes from "./routes/documentRoutes.js";
import paymentRoutes from "./routes/paymentRoutes.js";
import applicationLogRoutes from "./routes/applicationLogRoutes.js";
import settingsRoutes from "./routes/settingsRoutes.js";
import reportsRoutes from "./routes/reportsRoutes.js";
import disputeRoutes from "./routes/disputeRoutes.js";
import transferRoutes from "./routes/transferRoutes.js";
import dbHealthRoutes from "./routes/dbHealthRoutes.js";


// Load environment variables
dotenv.config();

// Create Express app
const app = express();

// Connect to database with error handling
connectDB().then(() => {
  // Initialize GridFS after successful database connection
  initGridFS();
}).catch(() => {
  if (process.env.NODE_ENV !== 'production') {
    console.error('Failed to connect to MongoDB. Server will continue without database connection.');
  }
});

// Enable compression for production
if (process.env.NODE_ENV === "production") {
  app.use(compression());
}

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors({
  origin: process.env.NODE_ENV === "production"
    ? [process.env.FRONTEND_URL, process.env.BACKEND_URL].filter(Boolean)
    : ["http://localhost:3000", "http://localhost:3001", "http://localhost:3002", "http://localhost:3003"],
  credentials: true
}));

// Add database operation middleware
app.use(dbOperationMiddleware);

// Routes
app.get("/", (_req, res) => {
  res.json({
    message: "Land Officer API - Please use appropriate endpoints",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    version: "1.0.0"
  });
});

// Debug endpoint for Vercel deployment
app.get("/debug", (_req, res) => {
  try {
    const debugInfo = {
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      platform: process.platform,
      nodeVersion: process.version,
      uptime: process.uptime(),
      memoryUsage: process.memoryUsage(),
      environmentVariables: {
        MONGO_URI: process.env.MONGO_URI ? "✅ Set" : "❌ Not Set",
        JWT_SECRET: process.env.JWT_SECRET ? "✅ Set" : "❌ Not Set",
        CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME ? "✅ Set" : "❌ Not Set",
        NODE_ENV: process.env.NODE_ENV || "Not Set",
        PORT: process.env.PORT || "Not Set"
      },
      database: {
        readyState: require('mongoose').connection.readyState,
        host: require('mongoose').connection.host || "Not Connected",
        name: require('mongoose').connection.name || "Not Connected"
      }
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

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes); // User routes might be used by Admin to manage Land Officers
app.use("/api/properties", propertyRoutes);
app.use("/api/documents", documentRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/logs", applicationLogRoutes);
app.use("/api/settings", settingsRoutes);
app.use("/api/reports", reportsRoutes);
app.use("/api/disputes", disputeRoutes);
app.use("/api/transfers", transferRoutes);
app.use("/api/db-health", dbHealthRoutes);




// Middleware
app.use(helmet());
app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));
app.use(notFound);
app.use(errorHandler);



// Start Server
const server = app.listen(PORT, () => {
  console.log(`Land Officer Server running on port ${PORT}`);
});

let shuttingDown = false;

// Graceful shutdown handling
const handleShutdown = async (signal) => {
  if (shuttingDown) return;
  shuttingDown = true;
  if (process.env.NODE_ENV !== 'production') {
    console.log(`\n🔄 Received ${signal}. Starting graceful shutdown...`);
  }

  // Close HTTP server
  server.close(async () => {
    if (process.env.NODE_ENV !== 'production') {
      console.log('🔒 HTTP server closed');
    }

    try {
      // Close database connections
      await gracefulShutdown();
      if (process.env.NODE_ENV !== 'production') {
        console.log('✅ Graceful shutdown completed');
      }
      process.exit(0);
    } catch (error) {
      console.error('❌ Error during shutdown:', error);
      process.exit(1);
    }
  });

  // Force shutdown after 30 seconds
  setTimeout(() => {
    console.error('💥 Forced shutdown after timeout');
    process.exit(1);
  }, 30000);
};

// Handle shutdown signals
process.on('SIGTERM', () => handleShutdown('SIGTERM'));
process.on('SIGINT', () => handleShutdown('SIGINT'));

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('💥 Uncaught Exception:', error);
  handleShutdown('uncaughtException');
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('💥 Unhandled Rejection at:', promise, 'reason:', reason);
  handleShutdown('unhandledRejection');
});
