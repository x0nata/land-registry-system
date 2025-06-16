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
    
    if (!process.env.MONGO_URI) {
      throw new Error("MONGO_URI environment variable is not set");
    }

    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error("❌ Error connecting to MongoDB:", error.message);
    process.exit(1);
  }
};

// Reset admin password
const resetAdminPassword = async () => {
  try {
    console.log("🔑 Resetting admin password...\n");

    // Find the admin user
    const adminUser = await User.findOne({ 
      email: "admin@system.com",
      role: "admin"
    });

    if (!adminUser) {
      console.log("❌ Admin user not found!");
      return;
    }

    console.log("✅ Admin user found:");
    console.log("📧 Email:", adminUser.email);
    console.log("👤 Full Name:", adminUser.fullName);
    console.log("🔑 Role:", adminUser.role);

    // Update the password
    adminUser.password = "admin123";
    
    // Save the user (this will trigger the pre-save middleware to hash the password)
    await adminUser.save();

    console.log("\n✅ Admin password reset successfully!");
    console.log("🔐 New password: admin123");

    // Test the new password
    const isPasswordValid = await adminUser.comparePassword("admin123");
    
    if (isPasswordValid) {
      console.log("✅ Password verification test: PASSED");
      console.log("\n🎉 Admin password reset completed successfully!");
      console.log("\n📋 Login Credentials:");
      console.log("==========================================");
      console.log("📧 Email: admin@system.com");
      console.log("🔑 Password: admin123");
      console.log("🔗 Login URL: http://localhost:3000/admin-login");
      console.log("==========================================");
    } else {
      console.log("❌ Password verification test: FAILED");
      console.log("There might be an issue with password hashing");
    }

  } catch (error) {
    console.error("❌ Error resetting admin password:", error.message);
  }
};

// Main function
const main = async () => {
  try {
    await connectDB();
    await resetAdminPassword();
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
