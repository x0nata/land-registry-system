import express from "express";
import { check } from "express-validator";
import {
  registerUser,
  loginUser,
  loginLandOfficer,
  loginAdmin,
  getUserProfile,
  updateUserProfile,
  bootstrapRoles,
} from "../controllers/authController.js";
import { authenticate } from "../middleware/auth.js";

const router = express.Router();

// @route   POST /api/auth/register
// @desc    Register a new user
// @access  Public
router.post(
  "/register",
  [
    check("fullName", "Full name is required").not().isEmpty(),
    check("email", "Please include a valid email").isEmail(),
    check("password", "Password must be at least 8 characters")
      .isLength({ min: 8 })
      .matches(/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[!@#$%^&*])/)
      .withMessage(
        "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character"
      ),
    check("phoneNumber", "Phone number is required").not().isEmpty(),
    check(
      "nationalId",
      "National ID must be 12 characters starting with ETH"
    ).matches(/^ETH[0-9A-Za-z]{9}$/),
  ],
  registerUser
);

// @route   POST /api/auth/login
// @desc    Authenticate user & get token
// @access  Public
router.post(
  "/login",
  [
    check("email", "Please include a valid email").isEmail(),
    check("password", "Password is required").exists(),
  ],
  loginUser
);

// @route   POST /api/auth/login/land-officer
// @desc    Authenticate land officer & get token
// @access  Public
router.post(
  "/login/land-officer",
  [
    check("email", "Please include a valid email").isEmail(),
    check("password", "Password is required").exists(),
  ],
  loginLandOfficer
);

// @route   POST /api/auth/login/admin
// @desc    Authenticate admin & get token
// @access  Public
router.post(
  "/login/admin",
  [
    check("username", "Username is required").not().isEmpty(),
    check("password", "Password is required").exists(),
  ],
  loginAdmin
);

// @route   GET /api/auth/profile
// @desc    Get user profile
// @access  Private
router.get("/profile", authenticate, getUserProfile);

// @route   PUT /api/auth/profile
// @desc    Update user profile
// @access  Private
router.put(
  "/profile",
  [
    authenticate,
    check("fullName", "Full name is required").optional().not().isEmpty(),
    check("email", "Please include a valid email").optional().isEmail(),
    check("password", "Password must be at least 8 characters")
      .optional()
      .isLength({ min: 8 })
      .matches(/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[!@#$%^&*])/)
      .withMessage(
        "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character"
      ),
    check("phoneNumber", "Phone number is required").optional().not().isEmpty(),
  ],
  updateUserProfile
);

// @route   POST /api/auth/bootstrap-roles
// @desc    Bootstrap admin and land officer roles (temporary)
// @access  Public
router.post("/bootstrap-roles", bootstrapRoles);

export default router;
