import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import User from "../models/User.js";

// Get the directory name for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from the root directory
dotenv.config({ path: path.join(__dirname, "../../.env") });

// Connect to MongoDB
const connectDB = async () => {
  try {
    console.log("🔗 Connecting to MongoDB...");
    console.log("📍 MongoDB URI:", process.env.MONGO_URI ? "✅ Found" : "❌ Not found");

    if (!process.env.MONGO_URI) {
      throw new Error("MONGO_URI environment variable is not set");
    }

    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    console.log(`📊 Database: ${conn.connection.name}`);
  } catch (error) {
    console.error("❌ Error connecting to MongoDB:", error.message);
    process.exit(1);
  }
};

// Create admin user
const createAdminUser = async () => {
  try {
    // Check if admin user already exists
    const existingAdmin = await User.findOne({
      $or: [
        { email: "admin@system.com" },
        { nationalId: "ETH000000001" }
      ]
    });

    if (existingAdmin) {
      console.log("Admin user already exists!");
      console.log("Email:", existingAdmin.email);
      console.log("Role:", existingAdmin.role);
      return;
    }

    // Create new admin user
    const adminUser = new User({
      fullName: "System Administrator",
      email: "admin@system.com",
      password: "admin123", // This will be hashed automatically by the pre-save middleware
      phoneNumber: "+251-11-123-4567",
      nationalId: "ETH000000001",
      role: "admin"
    });

    // Save the admin user
    await adminUser.save();

    console.log("✅ Admin user created successfully!");
    console.log("📧 Email: admin@system.com");
    console.log("🔑 Password: admin123");
    console.log("👤 Role: admin");
    console.log("🆔 National ID: ETH000000001");
    console.log("\nYou can now login to the admin panel using these credentials.");

  } catch (error) {
    console.error("❌ Error creating admin user:", error.message);

    if (error.code === 11000) {
      console.log("Admin user with this email or National ID already exists.");
    }
  }
};

// Main function
const main = async () => {
  console.log("🚀 Creating admin user...\n");

  try {
    await connectDB();
    await createAdminUser();
  } catch (error) {
    console.error("❌ Script failed:", error.message);
  } finally {
    // Close the database connection
    await mongoose.connection.close();
    console.log("\n📝 Database connection closed.");
    process.exit(0);
  }
};

// Run the script
main();
