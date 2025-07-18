import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import compression from "compression";
import morgan from "morgan";
import dotenv from "dotenv";

// Import database connection
import connectDB from "../config/db.js";
import mongoose from "mongoose";

// Import middleware
import { errorHandler } from "../middleware/errorMiddleware.js";
import { dbHealthCheckMiddleware } from "../middleware/dbMiddleware.js";

// Import routes
import authRoutes from "../routes/authRoutes.js";
import propertyRoutes from "../routes/propertyRoutes.js";
import documentRoutes from "../routes/documentRoutes.js";
import paymentRoutes from "../routes/paymentRoutes.js";
import transferRoutes from "../routes/transferRoutes.js";
import disputeRoutes from "../routes/disputeRoutes.js";
import applicationLogRoutes from "../routes/applicationLogRoutes.js";
import reportsRoutes from "../routes/reportsRoutes.js";
import settingsRoutes from "../routes/settingsRoutes.js";
import userRoutes from "../routes/userRoutes.js";
import dbHealthRoutes from "../routes/dbHealthRoutes.js";

// Load environment variables
dotenv.config();

// Create Express app
const app = express();

// Trust proxy for Vercel
app.set('trust proxy', 1);

// AGGRESSIVE database connection handling for serverless
let dbConnected = false;
let connectionPromise = null;

const initializeDatabase = async () => {
  const startTime = Date.now();

  try {
    // Return existing connection promise if already connecting
    if (connectionPromise) {
      console.log('⏳ Database connection already in progress...');
      return await connectionPromise;
    }

    // Quick health check for existing connection
    if (dbConnected && mongoose.connection.readyState === 1) {
      try {
        await mongoose.connection.db.admin().ping();
        console.log('✅ Database already connected and healthy');
        return true;
      } catch (pingError) {
        console.log('⚠️ Existing connection unhealthy, reconnecting...');
        dbConnected = false;
      }
    }

    // Create new connection promise with timeout
    connectionPromise = Promise.race([
      (async () => {
        console.log('🚀 AGGRESSIVE: Initializing database connection...');
        await connectDB();

        // Verify connection is actually working
        await mongoose.connection.db.admin().ping();

        dbConnected = true;
        const duration = Date.now() - startTime;
        console.log(`✅ Database connected successfully in ${duration}ms`);
        return true;
      })(),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Database initialization timeout after 4 seconds')), 4000)
      )
    ]);

    const result = await connectionPromise;
    connectionPromise = null;
    return result;

  } catch (error) {
    console.error('❌ Database initialization failed:', error.message);
    dbConnected = false;
    connectionPromise = null;
    throw error;
  }
};

// AGGRESSIVE: Connect to database immediately when the module loads
(async () => {
  try {
    await initializeDatabase();
  } catch (err) {
    console.error('❌ Initial database connection failed:', err.message);
  }
})();

// AGGRESSIVE middleware to ensure database connection on each request
app.use(async (req, res, next) => {
  const requestStart = Date.now();

  try {
    // Quick connection state check
    if (!dbConnected || mongoose.connection.readyState !== 1) {
      console.log('🔄 Database not ready, forcing connection...');
      await initializeDatabase();
    }

    const duration = Date.now() - requestStart;
    if (duration > 100) {
      console.log(`⚠️ Database check took ${duration}ms`);
    }

    next();
  } catch (error) {
    console.error('❌ Database middleware error:', error.message);
    res.status(503).json({
      success: false,
      message: 'Database connection unavailable. Please try again.',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Service temporarily unavailable',
      timestamp: new Date().toISOString()
    });
  }
});

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: false
}));

// CORS configuration
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:3001',
      'http://localhost:3002',
      'https://land-registry-user.vercel.app',
      'https://land-registry-landofficer.vercel.app',
      process.env.FRONTEND_URL,
      process.env.LANDOFFICER_FRONTEND_URL
    ].filter(Boolean);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.warn(`CORS blocked origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-auth-token'],
  exposedHeaders: ['x-auth-token']
};

app.use(cors(corsOptions));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'production' ? 100 : 1000, // limit each IP to 100 requests per windowMs in production
  message: {
    error: 'Too many requests from this IP, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/', limiter);

// Compression middleware
app.use(compression());

// Logging middleware
if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Add caching headers for static data
app.use('/api', (req, res, next) => {
  // Cache static data endpoints for 5 minutes
  if (req.method === 'GET' && (
    req.path.includes('/reports/') ||
    req.path.includes('/settings/') ||
    req.path.includes('/users') && req.query.dashboard
  )) {
    res.set('Cache-Control', 'public, max-age=300'); // 5 minutes
  }

  // Cache dashboard data for 2 minutes
  if (req.method === 'GET' && req.query.dashboard) {
    res.set('Cache-Control', 'public, max-age=120'); // 2 minutes
  }

  next();
});

// Database health check middleware for all API routes
app.use('/api', dbHealthCheckMiddleware);

// Health check endpoint
app.get('/api/health', async (req, res) => {
  // Ensure database connection
  if (!dbConnected) {
    await initializeDatabase();
  }

  // Check actual database connection status
  const dbStatus = dbConnected && mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';

  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    version: '1.0.0',
    database: dbStatus,
    dbReadyState: mongoose.connection.readyState,
    dbHost: mongoose.connection.host || 'unknown',
    dbName: mongoose.connection.name || 'unknown'
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/properties', propertyRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/transfers', transferRoutes);
app.use('/api/disputes', disputeRoutes);
app.use('/api/logs', applicationLogRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/users', userRoutes);
app.use('/api/db-health', dbHealthRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Land Registry System API',
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString(),
    endpoints: {
      health: '/api/health',
      auth: '/api/auth',
      properties: '/api/properties',
      documents: '/api/documents',
      payments: '/api/payments',
      transfers: '/api/transfers',
      disputes: '/api/disputes',
      logs: '/api/logs',
      reports: '/api/reports',
      settings: '/api/settings',
      users: '/api/users',
      dbHealth: '/api/db-health'
    }
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    message: 'Route not found',
    path: req.originalUrl,
    method: req.method,
    timestamp: new Date().toISOString()
  });
});

// Error handling middleware (must be last)
app.use(errorHandler);

// Export the Express app for Vercel
export default app;
