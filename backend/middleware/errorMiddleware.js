// 404 Not Found middleware
const notFound = (req, res, next) => {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  res.status(404);
  next(error);
};

// Global error handler middleware
const errorHandler = (err, req, res, next) => {
  let statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  let message = err.message;

  // Handle specific error types
  if (err.name === "CastError" && err.kind === "ObjectId") {
    statusCode = 404;
    message = "Resource not found";
  }

  // Handle MongoDB validation errors
  if (err.name === "ValidationError") {
    statusCode = 400;
    message = Object.values(err.errors).map(val => val.message).join(', ');
  }

  // Handle MongoDB duplicate key errors
  if (err.code === 11000) {
    statusCode = 400;
    const field = Object.keys(err.keyValue)[0];
    message = `Duplicate value for field: ${field}`;
  }

  // Handle JWT errors
  if (err.name === "JsonWebTokenError") {
    statusCode = 401;
    message = "Invalid token";
  }

  if (err.name === "TokenExpiredError") {
    statusCode = 401;
    message = "Token expired";
  }

  // Handle Circuit Breaker errors
  if (err.name === "CircuitBreakerOpenError") {
    statusCode = 503;
    message = "Service temporarily unavailable - database operations disabled";
  }

  // Handle Multer errors
  if (err.name === "MulterError") {
    statusCode = 400;
    switch (err.code) {
      case 'LIMIT_FILE_SIZE':
        message = "File too large";
        break;
      case 'LIMIT_FILE_COUNT':
        message = "Too many files";
        break;
      case 'LIMIT_UNEXPECTED_FILE':
        message = "Unexpected file field";
        break;
      default:
        message = `Upload error: ${err.message}`;
    }
  }

  // Log error details in development
  if (process.env.NODE_ENV !== 'production') {
    console.error('Error Details:', {
      message: err.message,
      stack: err.stack,
      statusCode,
      url: req.originalUrl,
      method: req.method,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      timestamp: new Date().toISOString()
    });
  }

  // Send error response
  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV !== "production" && { 
      stack: err.stack,
      error: err.name,
      details: err.details || null
    }),
    timestamp: new Date().toISOString()
  });
};

// Async error handler wrapper
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// Rate limiting error handler
const rateLimitHandler = (req, res) => {
  res.status(429).json({
    success: false,
    message: "Too many requests, please try again later",
    timestamp: new Date().toISOString()
  });
};

// CORS error handler
const corsErrorHandler = (err, req, res, next) => {
  if (err.message && err.message.includes('CORS')) {
    return res.status(403).json({
      success: false,
      message: "CORS policy violation - origin not allowed",
      timestamp: new Date().toISOString()
    });
  }
  next(err);
};

// Database connection error handler
const dbErrorHandler = (err, req, res, next) => {
  if (err.name === 'MongoNetworkError' || 
      err.name === 'MongoTimeoutError' || 
      err.name === 'MongoServerSelectionError') {
    return res.status(503).json({
      success: false,
      message: "Database connection error - please try again later",
      timestamp: new Date().toISOString()
    });
  }
  next(err);
};

// Validation error formatter
const formatValidationErrors = (errors) => {
  if (Array.isArray(errors)) {
    return errors.map(error => ({
      field: error.param || error.path,
      message: error.msg || error.message,
      value: error.value
    }));
  }
  return errors;
};

// Express validator error handler
const validationErrorHandler = (req, res, next) => {
  const { validationResult } = require('express-validator');
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: formatValidationErrors(errors.array()),
      timestamp: new Date().toISOString()
    });
  }
  
  next();
};

// Production error logger (for external services like Sentry)
const logError = (err, req, res, next) => {
  // In production, you might want to send errors to external logging service
  if (process.env.NODE_ENV === 'production') {
    // Example: Send to Sentry, LogRocket, etc.
    console.error('Production Error:', {
      message: err.message,
      stack: err.stack,
      url: req.originalUrl,
      method: req.method,
      ip: req.ip,
      timestamp: new Date().toISOString()
    });
  }
  
  next(err);
};

export { 
  notFound, 
  errorHandler, 
  asyncHandler, 
  rateLimitHandler,
  corsErrorHandler,
  dbErrorHandler,
  validationErrorHandler,
  formatValidationErrors,
  logError
};
