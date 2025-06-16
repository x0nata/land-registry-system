import express from "express";
import { authenticate } from "../middleware/auth.js";

const router = express.Router();

// All reporting functionality has been removed
// This system is now strictly for regular users only
// Admin and land officer reporting is not available

export default router;
