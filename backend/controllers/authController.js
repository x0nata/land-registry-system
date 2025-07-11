import User from "../models/User.js";
import jwt from "jsonwebtoken";
import { validationResult } from "express-validator";

// Generate JWT token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: "30d",
  });
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

    const { fullName, email, password, phoneNumber, nationalId } = req.body;

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

    // Create new user - only allow 'user' role for public registration
    // Admin role assignment should only be done through admin panel
    const user = await User.create({
      fullName,
      email,
      password,
      phoneNumber,
      nationalId,
      role: "user", // Always default to user for public registration
    });

    if (user) {
      res.status(201).json({
        _id: user._id,
        fullName: user.fullName,
        email: user.email,
        phoneNumber: user.phoneNumber,
        nationalId: user.nationalId,
        role: user.role,
        token: generateToken(user._id),
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

    // Find user by email and ensure they are a regular user
    const user = await User.findOne({ 
      email,
      role: "user" // Only allow regular users to login through this endpoint
    });

    if (!user) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    // Check if password matches
    const isMatch = await user.comparePassword(password);

    if (!isMatch) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    // Return user data with token
    res.json({
      _id: user._id,
      fullName: user.fullName,
      email: user.email,
      phoneNumber: user.phoneNumber,
      nationalId: user.nationalId,
      role: user.role,
      token: generateToken(user._id),
    });
  } catch (error) {
    console.error("Login error:", error);
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
      token: generateToken(user._id),
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
      token: generateToken(user._id),
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
