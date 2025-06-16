import mongoose from "mongoose";
import dotenv from "dotenv";
import dns from "dns";
import { promisify } from "util";

// Load environment variables
dotenv.config();

const resolveSrv = promisify(dns.resolveSrv);
const resolve4 = promisify(dns.resolve4);

console.log("🧪 Testing MongoDB Atlas connection and DNS resolution...");

const extractHostFromUri = (uri) => {
  const match = uri.match(/@([^/]+)/);
  return match ? match[1] : null;
};

const testDNSResolution = async () => {
  const uri = process.env.MONGO_URI;
  const host = extractHostFromUri(uri);

  if (!host) {
    console.error("❌ Could not extract host from connection string");
    return false;
  }

  console.log(`🔍 Testing DNS resolution for: ${host}`);

  try {
    // Test SRV record resolution (for mongodb+srv:// connections)
    if (uri.includes('mongodb+srv://')) {
      console.log("📡 Testing SRV record resolution...");
      const srvRecords = await resolveSrv(`_mongodb._tcp.${host}`);
      console.log("✅ SRV records found:", srvRecords.length);

      // Test each individual host
      for (const record of srvRecords.slice(0, 3)) { // Test first 3 records
        try {
          const addresses = await resolve4(record.name);
          console.log(`✅ ${record.name} resolves to: ${addresses.join(', ')}`);
        } catch (err) {
          console.log(`❌ ${record.name} failed to resolve: ${err.message}`);
        }
      }
    } else {
      // Test direct hostname resolution
      console.log("📡 Testing direct hostname resolution...");
      const addresses = await resolve4(host);
      console.log("✅ Host resolves to:", addresses.join(', '));
    }

    return true;
  } catch (error) {
    console.error("❌ DNS resolution failed:", error.message);

    if (error.code === 'ENOTFOUND') {
      console.log("\n🔍 DNS Resolution Failed - Try these solutions:");
      console.log("1. Change your DNS servers to Google DNS (8.8.8.8, 8.8.4.4)");
      console.log("2. Change your DNS servers to Cloudflare DNS (1.1.1.1, 1.0.0.1)");
      console.log("3. Check if your ISP blocks SRV DNS lookups");
      console.log("4. Try connecting from a different network");
      console.log("5. Contact your network administrator");
    }

    return false;
  }
};

const testConnection = async () => {
  console.log("\n🔗 Testing MongoDB connection...");
  console.log("Connection URI:", process.env.MONGO_URI?.replace(/\/\/([^:]+):([^@]+)@/, '//***:***@'));

  try {
    // Try with recommended options for DNS issues
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 5000, // 5 seconds
      connectTimeoutMS: 10000, // 10 seconds
      family: 4, // Force IPv4
    });

    console.log("✅ Connection successful!");
    console.log("Host:", conn.connection.host);
    console.log("Database:", conn.connection.name);

    // Test a simple operation
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log("Collections:", collections.map(c => c.name));

    await mongoose.disconnect();
    console.log("Disconnected successfully");

  } catch (error) {
    console.error("❌ Connection failed:");
    console.error("Error message:", error.message);

    if (error.message.includes('ETIMEOUT') || error.message.includes('queryTxt')) {
      console.log("\n🔍 DNS Timeout Error - This is the same issue your server is experiencing");
      console.log("Solutions to try:");
      console.log("1. Change DNS servers (most common fix)");
      console.log("2. Check firewall settings");
      console.log("3. Try from a different network");
      console.log("4. Contact your ISP about SRV record support");
    }
  }
};

const runTests = async () => {
  console.log("🚀 Starting comprehensive connection tests...\n");

  const dnsWorking = await testDNSResolution();

  if (dnsWorking) {
    await testConnection();
  } else {
    console.log("\n⚠️  Skipping connection test due to DNS resolution failure");
    console.log("Fix DNS issues first, then retry the connection");
  }

  process.exit(0);
};

runTests();
