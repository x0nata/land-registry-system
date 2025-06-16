import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "../models/User.js";

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

// Sample users to create
const sampleUsers = [
  {
    fullName: "System Administrator",
    email: "admin@system.com",
    password: "admin123",
    phoneNumber: "+251-11-123-4567",
    nationalId: "ETH000000001",
    role: "admin"
  },
  {
    fullName: "John Doe",
    email: "john.doe@landoffice.gov.et",
    password: "landofficer123",
    phoneNumber: "+251-11-234-5678",
    nationalId: "ETH000000002",
    role: "landOfficer"
  },
  {
    fullName: "Jane Smith",
    email: "jane.smith@landoffice.gov.et",
    password: "landofficer123",
    phoneNumber: "+251-11-345-6789",
    nationalId: "ETH000000003",
    role: "landOfficer"
  },
  {
    fullName: "Michael Johnson",
    email: "michael.johnson@email.com",
    password: "user123456",
    phoneNumber: "+251-11-456-7890",
    nationalId: "ETH000000004",
    role: "user"
  },
  {
    fullName: "Sarah Wilson",
    email: "sarah.wilson@email.com",
    password: "user123456",
    phoneNumber: "+251-11-567-8901",
    nationalId: "ETH000000005",
    role: "user"
  }
];

// Create users
const seedUsers = async () => {
  try {
    console.log("🌱 Seeding users...\n");

    for (const userData of sampleUsers) {
      try {
        // Check if user already exists
        const existingUser = await User.findOne({ 
          $or: [
            { email: userData.email },
            { nationalId: userData.nationalId }
          ]
        });

        if (existingUser) {
          console.log(`⚠️  User ${userData.email} already exists, skipping...`);
          continue;
        }

        // Create new user
        const user = new User(userData);
        await user.save();

        console.log(`✅ Created ${userData.role}: ${userData.fullName} (${userData.email})`);

      } catch (error) {
        console.error(`❌ Error creating user ${userData.email}:`, error.message);
      }
    }

    console.log("\n🎉 User seeding completed!");
    console.log("\n📋 Login Credentials:");
    console.log("==========================================");
    console.log("🔐 ADMIN:");
    console.log("   Email: admin@system.com");
    console.log("   Password: admin123");
    console.log("\n👮 LAND OFFICERS:");
    console.log("   Email: john.doe@landoffice.gov.et");
    console.log("   Password: landofficer123");
    console.log("   ---");
    console.log("   Email: jane.smith@landoffice.gov.et");
    console.log("   Password: landofficer123");
    console.log("\n👤 REGULAR USERS:");
    console.log("   Email: michael.johnson@email.com");
    console.log("   Password: user123456");
    console.log("   ---");
    console.log("   Email: sarah.wilson@email.com");
    console.log("   Password: user123456");
    console.log("==========================================");

  } catch (error) {
    console.error("❌ Error seeding users:", error.message);
  }
};

// Main function
const main = async () => {
  try {
    await connectDB();
    await seedUsers();
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
