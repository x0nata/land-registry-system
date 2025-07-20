import User from "../models/User.js";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import { validationResult } from "express-validator";

// Generate JWT token
const generateToken = (user) => {
  return jwt.sign(
    {
      id: user._id,
      role: user.role,
      email: user.email,
      fullName: user.fullName
    },
    process.env.JWT_SECRET,
    {
      expiresIn: "30d",
    }
  );
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
export const registerUser = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { fullName, email, password, phoneNumber, nationalId, role } = req.body;

    // Check if user already exists
    const userExists = await User.findOne({
      $or: [{ email }, { nationalId }],
    });

    if (userExists) {
      if (userExists.email === email) {
        return res
          .status(400)
          .json({ message: "User with this email already exists" });
      }
      if (userExists.nationalId === nationalId) {
        return res
          .status(400)
          .json({ message: "User with this National ID already exists" });
      }
    }

    // Validate role if provided
    const validRoles = ["user", "landOfficer", "admin"];
    const userRole = role && validRoles.includes(role) ? role : "user";

    // Create new user
    const user = await User.create({
      fullName,
      email,
      password,
      phoneNumber,
      nationalId,
      role: userRole,
    });

    if (user) {
      res.status(201).json({
        _id: user._id,
        fullName: user.fullName,
        email: user.email,
        phoneNumber: user.phoneNumber,
        nationalId: user.nationalId,
        role: user.role,
        token: generateToken(user),
      });
    } else {
      res.status(400).json({ message: "Invalid user data" });
    }
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ message: "Server error during registration" });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
export const loginUser = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    console.log('🔐 Login attempt for:', email);

    // Ensure database connection before query
    if (mongoose.connection.readyState !== 1) {
      console.log('⚠️ Database not connected, readyState:', mongoose.connection.readyState);
      return res.status(503).json({
        message: "Database connection issue. Please try again.",
        error: "Service temporarily unavailable"
      });
    }

    // Find user by email with timeout protection and connection check
    if (mongoose.connection.readyState !== 1) {
      console.log('⚠️ Database not connected, readyState:', mongoose.connection.readyState);
      return res.status(503).json({
        message: "Database connection issue. Please try again.",
        error: "Service temporarily unavailable"
      });
    }

    // Optimize user lookup with lean() for better performance
    const user = await User.findOne({ email }).select('+password').maxTimeMS(5000).lean();

    if (!user) {
      console.log('❌ User not found:', email);
      return res.status(401).json({ message: "Invalid email or password" });
    }

    console.log('✅ User found:', user.email, 'Role:', user.role);

    // Check if password matches using bcrypt directly for lean() objects
    const bcrypt = await import('bcryptjs');
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      console.log('❌ Invalid password for:', email);
      return res.status(401).json({ message: "Invalid email or password" });
    }

    console.log('✅ Login successful for:', email);

    // Return user data with token
    res.json({
      _id: user._id,
      fullName: user.fullName,
      email: user.email,
      phoneNumber: user.phoneNumber,
      nationalId: user.nationalId,
      role: user.role,
      token: generateToken(user),
    });
  } catch (error) {
    console.error("Login error:", error);

    // Handle specific MongoDB errors
    if (error.name === 'MongooseError' || error.message.includes('buffering timed out')) {
      return res.status(503).json({
        message: "Database connection issue. Please try again.",
        error: "Database temporarily unavailable"
      });
    }

    if (error.name === 'MongoTimeoutError' || error.message.includes('timeout')) {
      return res.status(503).json({
        message: "Request timeout. Please try again.",
        error: "Operation timed out"
      });
    }

    res.status(500).json({ message: "Server error during login" });
  }
};

// @desc    Login land officer
// @route   POST /api/auth/login/land-officer
// @access  Public
export const loginLandOfficer = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    // Find user by email and role
    const user = await User.findOne({
      email,
      role: { $in: ["landOfficer", "admin"] },
    });

    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Check if password matches
    const isMatch = await user.comparePassword(password);

    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Return user data with token
    res.json({
      _id: user._id,
      fullName: user.fullName,
      email: user.email,
      phoneNumber: user.phoneNumber,
      role: user.role,
      token: generateToken(user),
    });
  } catch (error) {
    console.error("Land officer login error:", error);
    res.status(500).json({ message: "Server error during login" });
  }
};

// @desc    Login admin
// @route   POST /api/auth/login/admin
// @access  Public
export const loginAdmin = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { username, password } = req.body;

    // Find user by username (email) and role
    const user = await User.findOne({
      email: username,
      role: "admin",
    });

    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Check if password matches
    const isMatch = await user.comparePassword(password);

    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Return user data with token
    res.json({
      _id: user._id,
      fullName: user.fullName,
      email: user.email,
      phoneNumber: user.phoneNumber,
      role: user.role,
      token: generateToken(user),
    });
  } catch (error) {
    console.error("Admin login error:", error);
    res.status(500).json({ message: "Server error during login" });
  }
};

// @desc    Get current user profile
// @route   GET /api/auth/profile
// @access  Private
export const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("-password");

    if (user) {
      res.json(user);
    } else {
      res.status(404).json({ message: "User not found" });
    }
  } catch (error) {
    console.error("Profile error:", error);
    res.status(500).json({ message: "Server error while fetching profile" });
  }
};

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
export const updateUserProfile = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const user = await User.findById(req.user._id);

    if (user) {
      user.fullName = req.body.fullName || user.fullName;
      user.email = req.body.email || user.email;
      user.phoneNumber = req.body.phoneNumber || user.phoneNumber;

      // Only update password if provided
      if (req.body.password) {
        user.password = req.body.password;
      }

      const updatedUser = await user.save();

      res.json({
        _id: updatedUser._id,
        fullName: updatedUser.fullName,
        email: updatedUser.email,
        phoneNumber: updatedUser.phoneNumber,
        nationalId: updatedUser.nationalId,
        role: updatedUser.role,
        token: generateToken(updatedUser._id),
      });
    } else {
      res.status(404).json({ message: "User not found" });
    }
  } catch (error) {
    console.error("Profile update error:", error);
    res.status(500).json({ message: "Server error while updating profile" });
  }
};

// @desc    Bootstrap admin and land officer users (temporary endpoint)
// @route   POST /api/auth/bootstrap-roles
// @access  Public (should be removed after initial setup)
export const bootstrapRoles = async (req, res) => {
  try {
    const { secret } = req.body;

    // Simple secret check for security
    if (secret !== "bootstrap-land-registry-2025") {
      return res.status(401).json({ message: "Invalid bootstrap secret" });
    }

    // Update specific users to admin and landOfficer roles
    const adminUpdate = await User.findOneAndUpdate(
      { email: "cooladmin@gmail.com" },
      { role: "admin" },
      { new: true }
    );

    const landOfficerUpdate = await User.findOneAndUpdate(
      { email: "mrland@gmail.com" },
      { role: "landOfficer" },
      { new: true }
    );

    const results = {
      admin: adminUpdate ? "Updated" : "Not found",
      landOfficer: landOfficerUpdate ? "Updated" : "Not found"
    };

    res.json({
      message: "Bootstrap completed",
      results
    });
  } catch (error) {
    console.error("Bootstrap error:", error);
    res.status(500).json({ message: "Server error during bootstrap" });
  }
};
