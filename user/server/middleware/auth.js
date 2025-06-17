import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import User from "../models/User.js";

// Middleware to authenticate user using JWT
export const authenticate = async (req, res, next) => {
  try {
    // Get token from header
    const token = req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
      return res
        .status(401)
        .json({ message: "Authentication required. No token provided." });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Check if database is connected before querying
    if (mongoose.connection.readyState !== 1) {
      console.log("Database not connected, skipping user lookup");
      // Create a minimal user object from token for basic functionality
      req.user = {
        _id: decoded.id,
        role: decoded.role || 'user',
        email: decoded.email || 'unknown@example.com',
        fullName: decoded.fullName || 'Unknown User'
      };
      return next();
    }

    // Find user by id
    const user = await User.findById(decoded.id).select("-password");

    if (!user) {
      return res
        .status(401)
        .json({ message: "Invalid token. User not found." });
    }

    // Add user to request object
    req.user = user;
    next();
  } catch (error) {
    console.error("Authentication error:", error.message);
    return res
      .status(401)
      .json({ message: "Invalid token. Authentication failed." });
  }
};

// Middleware to check if user is admin
export const isAdmin = (req, res, next) => {
  // No user attached → authentication missing / invalid
  if (!req.user) {
    return res
      .status(401)
      .json({ message: "Authentication required." });
  }

  // Authenticated but not an admin → forbidden
  if (req.user.role !== "admin") {
    return res
      .status(403)
      .json({ message: "Access denied. Admin privileges required." });
  }

  next();
 }

// Middleware to check if user is a regular user only
export const isUser = (req, res, next) => {
  if (req.user && req.user.role === "user") {
    next();
  } else {
    return res
      .status(403)
      .json({ message: "Access denied. User privileges required." });
  }
};

// Middleware to check if user is the owner of the resource
export const isOwner = async (req, res, next) => {
  try {
    // The resource ID should be passed in the request parameters
    const resourceId = req.params.id;
    const userId = req.user._id;

    // Check if the resource belongs to the user
    // This will need to be customized based on the resource type
    // For example, for a property:
    const resource = await req.model.findById(resourceId);

    if (!resource) {
      return res.status(404).json({ message: "Resource not found." });
    }

    // Check if the user is the owner
    if (resource.owner && resource.owner.toString() === userId.toString()) {
      return next();
    }

    return res
      .status(403)
      .json({
        message:
          "Access denied. You do not have permission to access this resource.",
      });
  } catch (error) {
    console.error("Authorization error:", error.message);
    return res
      .status(500)
      .json({ message: "Server error during authorization check." });
  }
};
