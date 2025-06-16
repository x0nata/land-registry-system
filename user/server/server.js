import express from "express";
import cors from "cors";
import colors from "colors";
import bodyParser from "body-parser";
import helmet from "helmet";
import morgan from "morgan";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import connectDB from "./config/db.js";
import { initGridFS } from "./config/gridfs.js";
import { notFound, errorHandler } from "./middleware/errorMiddleware.js";
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


// Load environment variables
dotenv.config();

// Create Express app
const app = express();

// Connect to database with error handling
connectDB().then(() => {
  // Initialize GridFS after successful database connection
  initGridFS();
}).catch((error) => {
  console.error('Failed to connect to MongoDB. Server will continue without database connection.');
  console.error('Error:', error.message);
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors({
  origin: ["http://localhost:3000", "http://localhost:3001", "http://localhost:3002", "http://localhost:3003"],
  credentials: true,
  exposedHeaders: ['Content-Disposition', 'Content-Length', 'Content-Type']
}));

// Routes
app.get("/", (req, res) => {
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


// Middleware
app.use(helmet());
app.use(morgan("dev"));
app.use(notFound);
app.use(errorHandler);

// Start Server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
