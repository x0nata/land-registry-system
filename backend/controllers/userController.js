import mongoose from "mongoose";
import User from "../models/User.js";
import { validationResult } from "express-validator";

// @desc    Get all users
// @route   GET /api/users
// @access  Admin
export const getAllUsers = async (req, res) => {
  try {
    const { role, search, page = 1, limit = 10 } = req.query;

    // Build query
    const query = {};

    // Filter by role if provided
    if (role) {
      query.role = role;
    }

    // Search by name, email, or nationalId
    if (search) {
      query.$or = [
        { fullName: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { nationalId: { $regex: search, $options: "i" } },
      ];
    }

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Execute query
    const users = await User.find(query)
      .select("-password")
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    // Get total count for pagination
    const total = await User.countDocuments(query);

    res.json({
      users,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ message: "Server error while fetching users" });
  }
};

// @desc    Get user by ID
// @route   GET /api/users/:id
// @access  Admin
export const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(user);
  } catch (error) {
    console.error("Error fetching user:", error);
    res.status(500).json({ message: "Server error while fetching user" });
  }
};

// @desc    Create a new user
// @route   POST /api/users
// @access  Admin
export const createUser = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { fullName, email, password, phoneNumber, nationalId, role } =
      req.body;

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

    // Create new user
    const user = await User.create({
      fullName,
      email,
      password,
      phoneNumber,
      nationalId,
      role: role || "user",
    });

    if (user) {
      res.status(201).json({
        _id: user._id,
        fullName: user.fullName,
        email: user.email,
        phoneNumber: user.phoneNumber,
        nationalId: user.nationalId,
        role: user.role,
      });
    } else {
      res.status(400).json({ message: "Invalid user data" });
    }
  } catch (error) {
    console.error("Error creating user:", error);
    res.status(500).json({ message: "Server error while creating user" });
  }
};

// @desc    Update a user
// @route   PUT /api/users/:id
// @access  Admin
export const updateUser = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Update user fields
    user.fullName = req.body.fullName || user.fullName;
    user.email = req.body.email || user.email;
    user.phoneNumber = req.body.phoneNumber || user.phoneNumber;
    user.nationalId = req.body.nationalId || user.nationalId;
    user.role = req.body.role || user.role;

    // Update password if provided
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
    });
  } catch (error) {
    console.error("Error updating user:", error);
    res.status(500).json({ message: "Server error while updating user" });
  }
};

// @desc    Delete a user
// @route   DELETE /api/users/:id
// @access  Admin
export const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    await user.deleteOne();

    res.json({ message: "User removed" });
  } catch (error) {
    console.error("Error deleting user:", error);
    res.status(500).json({ message: "Server error while deleting user" });
  }
};

// @desc    Change user role
// @route   PUT /api/users/:id/role
// @access  Admin
export const changeUserRole = async (req, res) => {
  try {
    const { role } = req.body;

    // Validate role
    if (!["admin", "landOfficer", "user"].includes(role)) {
      return res.status(400).json({ message: "Invalid role" });
    }

    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Store previous role for logging
    const previousRole = user.role;

    // Prevent admin from changing their own role to avoid lockout
    if (user._id.toString() === req.user._id.toString() && role !== "admin") {
      return res.status(400).json({
        message: "You cannot change your own admin role to prevent system lockout"
      });
    }

    // Update user role
    user.role = role;
    await user.save();

    // Log the role change
    console.log(`Role changed by admin ${req.user.email} (${req.user._id}): User ${user.email} (${user._id}) role changed from '${previousRole}' to '${role}'`);

    res.json({
      _id: user._id,
      fullName: user.fullName,
      email: user.email,
      role: user.role,
      message: `User role successfully changed from '${previousRole}' to '${role}'`
    });
  } catch (error) {
    console.error("Error changing user role:", error);
    res.status(500).json({ message: "Server error while changing user role" });
  }
};

// @desc    Get all land officers
// @route   GET /api/users/land-officers
// @access  Admin
export const getLandOfficers = async (req, res) => {
  try {
    const landOfficers = await User.find({ role: "landOfficer" }).select(
      "-password"
    );

    res.json(landOfficers);
  } catch (error) {
    console.error("Error fetching land officers:", error);
    res
      .status(500)
      .json({ message: "Server error while fetching land officers" });
  }
};

// @desc    Get user statistics
// @route   GET /api/users/stats
// @access  Admin
export const getUserStats = async (req, res) => {
  try {
    // Check database connection first
    if (mongoose.connection.readyState !== 1) {
      console.log("Database not connected, returning default user stats");
      return res.status(200).json({
        totalUsers: 0,
        totalAdmins: 0,
        totalLandOfficers: 0,
        totalRegularUsers: 0,
        newUsers: 0,
        message: "Database connection unavailable, showing default values"
      });
    }

    // Use Promise.all with timeout for parallel execution
    const [
      totalUsers,
      totalAdmins,
      totalLandOfficers,
      totalRegularUsers,
      newUsers
    ] = await Promise.all([
      User.countDocuments().maxTimeMS(5000),
      User.countDocuments({ role: "admin" }).maxTimeMS(5000),
      User.countDocuments({ role: "landOfficer" }).maxTimeMS(5000),
      User.countDocuments({ role: "user" }).maxTimeMS(5000),
      User.countDocuments({
        createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
      }).maxTimeMS(5000)
    ]);

    res.json({
      totalUsers,
      totalAdmins,
      totalLandOfficers,
      totalRegularUsers,
      newUsers,
    });
  } catch (error) {
    console.error("Error fetching user statistics:", error);
    console.error("Error details:", error.message);

    // Return default stats instead of error to prevent UI crashes
    res.status(200).json({
      totalUsers: 0,
      totalAdmins: 0,
      totalLandOfficers: 0,
      totalRegularUsers: 0,
      newUsers: 0,
      message: "Unable to fetch user statistics due to database connectivity issues"
    });
  }
};
