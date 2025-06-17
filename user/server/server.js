import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import dotenv from "dotenv";
import connectDB, { gracefulShutdown } from "./config/db.js";
import { initGridFS } from "./config/gridfs.js";
import { notFound, errorHandler } from "./middleware/errorMiddleware.js";
import { dbOperationMiddleware } from "./middleware/dbMiddleware.js";
const PORT = process.env.PORT || 3003;

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
  console.error('Failed to connect to MongoDB. Server will continue without database connection.');
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors({
  origin: ["http://localhost:3000", "http://localhost:3001", "http://localhost:3002", "http://localhost:3003"],
  credentials: true,
  exposedHeaders: ['Content-Disposition', 'Content-Length', 'Content-Type']
}));

// Add database operation middleware
app.use(dbOperationMiddleware);

// Routes
app.get("/", (_req, res) => {
  res.json({ message: "Welcome to Property Registration System API" });
});

// API Routes
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


// Middleware
app.use(helmet());
app.use(morgan("dev"));
app.use(notFound);
app.use(errorHandler);

// Start Server
const server = app.listen(PORT, () => {
  console.log(`User Server running on port ${PORT}`);
});

// Graceful shutdown handling
const handleShutdown = async (signal) => {
  console.log(`\n🔄 Received ${signal}. Starting graceful shutdown...`);

  // Close HTTP server
  server.close(async () => {
    console.log('🔒 HTTP server closed');

    try {
      // Close database connections
      await gracefulShutdown();
      console.log('✅ Graceful shutdown completed');
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
