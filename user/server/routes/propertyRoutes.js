import express from "express";
import { check } from "express-validator";
import {
  registerProperty,
  getUserProperties,
  getPropertyById,
  updateProperty,
  deleteProperty,
} from "../controllers/propertyController.js";
import { authenticate, isUser } from "../middleware/auth.js";

const router = express.Router();

// @route   POST /api/properties
// @desc    Register a new property
// @access  Private (User)
router.post(
  "/",
  [
    authenticate,
    check("location.kebele", "Kebele is required").not().isEmpty(),
    check("location.subCity", "Sub-city is required").not().isEmpty(),
    check("plotNumber", "Plot number is required").not().isEmpty(),
    check("area", "Area must be a positive number").isFloat({ min: 0 }),
    check("propertyType", "Property type is required").isIn([
      "residential",
      "commercial",
      "industrial",
      "agricultural",
    ]),
  ],
  registerProperty
);

// @route   GET /api/properties/user
// @desc    Get all properties for the current user
// @access  Private (User)
router.get("/user", authenticate, getUserProperties);



// @route   GET /api/properties/:id
// @desc    Get a property by ID
// @access  Private
router.get("/:id", authenticate, getPropertyById);

// @route   PUT /api/properties/:id
// @desc    Update a property
// @access  Private (User)
router.put(
  "/:id",
  [
    authenticate,
    check("location.kebele", "Kebele is required").optional().not().isEmpty(),
    check("location.subCity", "Sub-city is required")
      .optional()
      .not()
      .isEmpty(),
    check("area", "Area must be a positive number")
      .optional()
      .isFloat({ min: 0 }),
    check("propertyType", "Property type is required")
      .optional()
      .isIn(["residential", "commercial", "industrial", "agricultural"]),
  ],
  updateProperty
);

// @route   DELETE /api/properties/:id
// @desc    Delete a property
// @access  Private (User)
router.delete("/:id", authenticate, deleteProperty);



export default router;
