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
/* // Removing registerUser function
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
*/

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
/* // Removing loginUser function
export const loginUser = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    // Find user by email
    const user = await User.findOne({ email });

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
*/

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

    // Find user by username and role
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
/* // Removing getUserProfile function
export const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(user);
  } catch (error) {
    console.error("Get profile error:", error);
    res.status(500).json({ message: "Server error" });
  }
};
*/

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
/* // Removing updateUserProfile function
export const updateUserProfile = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Update user fields
    user.fullName = req.body.fullName || user.fullName;
    user.email = req.body.email || user.email;
    user.phoneNumber = req.body.phoneNumber || user.phoneNumber;

    if (req.body.password) {
      user.password = req.body.password;
    }

    const updatedUser = await user.save();

    res.json({
      _id: updatedUser._id,
      fullName: updatedUser.fullName,
      email: updatedUser.email,
      phoneNumber: updatedUser.phoneNumber,
      role: updatedUser.role,
      token: generateToken(updatedUser._id), // Re-issue token if needed, or omit if role/id doesn't change
    });
  } catch (error) {
    console.error("Update profile error:", error);
    // Check for duplicate key error (e.g., if email is already taken)
    if (error.code === 11000) {
      return res.status(400).json({ message: "Email already in use." });
    }
    res.status(500).json({ message: "Server error" });
  }
};
*/
