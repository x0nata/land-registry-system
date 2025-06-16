import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "../models/User.js";
import jwt from "jsonwebtoken";

// Load environment variables
dotenv.config();

// Connect to MongoDB
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error("Error connecting to MongoDB:", error.message);
    process.exit(1);
  }
};

// Test admin login functionality
const testAdminLogin = async () => {
  try {
    console.log("🧪 Testing admin login functionality...\n");

    // Find admin user
    const adminUser = await User.findOne({ 
      email: "admin@system.com",
      role: "admin"
    });

    if (!adminUser) {
      console.log("❌ Admin user not found!");
      console.log("Please run: npm run create-admin");
      return;
    }

    console.log("✅ Admin user found:");
    console.log("📧 Email:", adminUser.email);
    console.log("👤 Full Name:", adminUser.fullName);
    console.log("🔑 Role:", adminUser.role);
    console.log("🆔 National ID:", adminUser.nationalId);

    // Test password verification
    const testPassword = "admin123";
    const isPasswordValid = await adminUser.comparePassword(testPassword);

    if (isPasswordValid) {
      console.log("✅ Password verification successful");
      
      // Generate a test JWT token
      const token = jwt.sign(
        { id: adminUser._id },
        process.env.JWT_SECRET || "your-secret-key",
        { expiresIn: "30d" }
      );

      console.log("✅ JWT token generated successfully");
      console.log("🔐 Token preview:", token.substring(0, 50) + "...");

      console.log("\n🎉 Admin login test PASSED!");
      console.log("\n📋 You can now login with:");
      console.log("   Email: admin@system.com");
      console.log("   Password: admin123");

    } else {
      console.log("❌ Password verification failed");
      console.log("The stored password doesn't match 'admin123'");
    }

  } catch (error) {
    console.error("❌ Error testing admin login:", error.message);
  }
};

// List all users for debugging
const listAllUsers = async () => {
  try {
    console.log("\n📋 All users in database:");
    console.log("========================");

    const users = await User.find({}).select("fullName email role createdAt");

    if (users.length === 0) {
      console.log("No users found in database");
      return;
    }

    users.forEach((user, index) => {
      console.log(`${index + 1}. ${user.fullName}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Role: ${user.role}`);
      console.log(`   Created: ${user.createdAt.toLocaleDateString()}`);
      console.log("");
    });

  } catch (error) {
    console.error("❌ Error listing users:", error.message);
  }
};

// Main function
const main = async () => {
  try {
    await connectDB();
    await testAdminLogin();
    await listAllUsers();
  } catch (error) {
    console.error("❌ Script failed:", error.message);
  } finally {
    // Close the database connection
    await mongoose.connection.close();
    console.log("📝 Database connection closed.");
    process.exit(0);
  }
};

// Run the script
main();
