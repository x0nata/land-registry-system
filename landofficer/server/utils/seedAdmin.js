import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "../models/User.js";

// Load environment variables
dotenv.config();

// Admin user data
const adminUser = {
  fullName: "System Administrator",
  email: "admin@system.com",
  password: "admin123",
  phoneNumber: "+251911111111",
  nationalId: "ETH123456789",
  role: "admin",
};

// Connect to MongoDB
const connectDB = async () => {
  try {
    console.log("Attempting to connect to MongoDB...");
    await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      family: 4,
    });
    console.log("Connected to MongoDB");
    return true;
  } catch (error) {
    console.error("MongoDB connection error:", error);

    try {
      console.log("Trying to connect to local MongoDB instance...");
      await mongoose.connect(
        "mongodb://localhost:27017/property-registration",
        {
          serverSelectionTimeoutMS: 10000,
          socketTimeoutMS: 45000,
          family: 4,
        }
      );
      console.log("Connected to local MongoDB");
      return true;
    } catch (localError) {
      console.error("Local MongoDB connection error:", localError);
      return false;
    }
  }
};

// Seed admin user
const seedAdmin = async () => {
  try {
    // Check if admin user already exists
    const existingAdmin = await User.findOne({ email: adminUser.email });

    if (existingAdmin) {
      console.log("Admin user already exists");
      return;
    }

    // Create new admin user
    const newAdmin = new User(adminUser);
    await newAdmin.save();

    console.log("Admin user created successfully");
  } catch (error) {
    console.error("Error seeding admin user:", error);
  }
};

// Main function
const main = async () => {
  const connected = await connectDB();

  if (connected) {
    await seedAdmin();
    // Disconnect from MongoDB
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB");
  } else {
    console.log("Failed to connect to MongoDB. Admin user not seeded.");
  }

  process.exit(0);
};

// Run the main function
main();
