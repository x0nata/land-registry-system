import express from "express";
import { check } from "express-validator";
import {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  changeUserRole,
  getLandOfficers,
  getUserStats,
} from "../controllers/userController.js";
import { authenticate, isAdmin } from "../middleware/auth.js";

const router = express.Router();

// @route   GET /api/users
// @desc    Get all users
// @access  Admin
router.get("/", authenticate, isAdmin, getAllUsers);

// @route   GET /api/users/land-officers
// @desc    Get all land officers
// @access  Admin
router.get("/land-officers", authenticate, isAdmin, getLandOfficers);

// @route   GET /api/users/stats
// @desc    Get user statistics
// @access  Admin
router.get("/stats", authenticate, isAdmin, getUserStats);

// @route   GET /api/users/:id
// @desc    Get user by ID
// @access  Admin
router.get("/:id", authenticate, isAdmin, getUserById);

// @route   POST /api/users
// @desc    Create a new user
// @access  Admin
router.post(
  "/",
  [
    authenticate,
    isAdmin,
    check("fullName", "Full name is required").not().isEmpty(),
    check("email", "Please include a valid email").isEmail(),
    check("password", "Password must be at least 8 characters").isLength({
      min: 8,
    }),
    check("phoneNumber", "Phone number is required").not().isEmpty(),
    check(
      "nationalId",
      "National ID must be 12 characters starting with ETH"
    ).matches(/^ETH[0-9A-Za-z]{9}$/),
    check("role", "Role is required").isIn(["admin", "landOfficer", "user"]),
  ],
  createUser
);

// @route   PUT /api/users/:id
// @desc    Update a user
// @access  Admin
router.put(
  "/:id",
  [
    authenticate,
    isAdmin,
    check("fullName", "Full name is required").optional().not().isEmpty(),
    check("email", "Please include a valid email").optional().isEmail(),
    check("password", "Password must be at least 8 characters")
      .optional()
      .isLength({ min: 8 }),
    check("phoneNumber", "Phone number is required").optional().not().isEmpty(),
    check("nationalId", "National ID must be 12 characters starting with ETH")
      .optional()
      .matches(/^ETH[0-9A-Za-z]{9}$/),
    check("role", "Role is required")
      .optional()
      .isIn(["admin", "landOfficer", "user"]),
  ],
  updateUser
);

// @route   DELETE /api/users/:id
// @desc    Delete a user
// @access  Admin
router.delete("/:id", authenticate, isAdmin, deleteUser);

// @route   PUT /api/users/:id/role
// @desc    Change user role
// @access  Admin
router.put(
  "/:id/role",
  [
    authenticate,
    isAdmin,
    check("role", "Role is required").isIn(["admin", "landOfficer", "user"]),
  ],
  changeUserRole
);

export default router;
