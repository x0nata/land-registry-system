import express from "express";
import { authenticate } from "../middleware/auth.js";

const router = express.Router();

// All settings functionality has been removed
// This system is now strictly for regular users only
// Admin settings management is not available

export default router;
