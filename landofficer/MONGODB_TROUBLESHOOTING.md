# MongoDB Connection Troubleshooting Guide

## Current Issue
You're experiencing MongoDB Atlas connection timeouts with the error:
```
MongoServerSelectionError: connection <monitor> to 159.41.64.82:27017 timed out
```

## Quick Fixes (Try These First)

### 1. Check Your Internet Connection
```bash
# Test connectivity to MongoDB Atlas
ping ac-s5vilrn-shard-00-00.yvdsiaw.mongodb.net
```

### 2. Verify MongoDB Atlas Cluster Status
- Go to [MongoDB Atlas Dashboard](https://cloud.mongodb.com/)
- Check if your cluster is running (not paused)
- Verify cluster is not undergoing maintenance

### 3. Check Network Access (IP Whitelist)
- In MongoDB Atlas → Network Access
- Add your current IP address: `0.0.0.0/0` (for development only)
- Or add your specific IP address

### 4. Update Your .env File
Create a `server/.env` file with your MongoDB connection string:

```bash
# MongoDB Configuration
MONGO_URI=mongodb+srv://username:password@cluster-name.mongodb.net/database-name?retryWrites=true&w=majority

# Other required variables
JWT_SECRET=your-jwt-secret-here
JWT_EXPIRE=30d
NODE_ENV=development
PORT=5000
```

## Advanced Solutions

### 1. Use Alternative DNS Servers
If you're having DNS resolution issues:

**Windows:**
```cmd
# Change DNS to Google DNS
netsh interface ip set dns "Wi-Fi" static 8.8.8.8
netsh interface ip add dns "Wi-Fi" 8.8.4.4 index=2
```

**Or use Cloudflare DNS:**
```cmd
netsh interface ip set dns "Wi-Fi" static 1.1.1.1
netsh interface ip add dns "Wi-Fi" 1.0.0.1 index=2
```

### 2. Try Different Connection String Format
If SRV connection fails, try direct connection:

```bash
# Instead of mongodb+srv://
MONGO_URI=mongodb://username:password@ac-s5vilrn-shard-00-00.yvdsiaw.mongodb.net:27017,ac-s5vilrn-shard-00-01.yvdsiaw.mongodb.net:27017,ac-s5vilrn-shard-00-02.yvdsiaw.mongodb.net:27017/database-name?ssl=true&replicaSet=atlas-bwhfaj-shard-0&authSource=admin&retryWrites=true&w=majority
```

### 3. Firewall/Antivirus Check
- Temporarily disable Windows Firewall
- Disable antivirus real-time protection
- Check if corporate firewall blocks MongoDB ports (27017)

### 4. Network Troubleshooting
```bash
# Test specific MongoDB Atlas endpoints
telnet ac-s5vilrn-shard-00-00.yvdsiaw.mongodb.net 27017
telnet ac-s5vilrn-shard-00-01.yvdsiaw.mongodb.net 27017
telnet ac-s5vilrn-shard-00-02.yvdsiaw.mongodb.net 27017
```

## Local MongoDB Alternative

If Atlas continues to fail, set up local MongoDB:

### 1. Install MongoDB Community Server
- Download from [MongoDB Download Center](https://www.mongodb.com/try/download/community)
- Install with default settings

### 2. Start MongoDB Service
```bash
# Windows
net start MongoDB

# Or start manually
mongod --dbpath "C:\data\db"
```

### 3. Update .env for Local MongoDB
```bash
MONGO_URI=mongodb://localhost:27017/property-registration
```

## Connection String Formats

### MongoDB Atlas (SRV)
```bash
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/database?retryWrites=true&w=majority
```

### MongoDB Atlas (Direct)
```bash
MONGO_URI=mongodb://username:password@host1:27017,host2:27017,host3:27017/database?ssl=true&replicaSet=replicaSetName&authSource=admin
```

### Local MongoDB
```bash
MONGO_URI=mongodb://localhost:27017/property-registration
```

## Updated Database Configuration

I've already updated your `server/config/db.js` with:
- ✅ Increased timeout settings (30-60 seconds)
- ✅ Retry mechanism (3 attempts with 5-second delays)
- ✅ Better error handling
- ✅ Disabled mongoose buffering for immediate failures

## Testing Connection

### 1. Test with MongoDB Compass
- Download [MongoDB Compass](https://www.mongodb.com/try/download/compass)
- Use the same connection string to test connectivity

### 2. Test with Node.js Script
Create `test-connection.js`:
```javascript
import mongoose from 'mongoose';

const testConnection = async () => {
  try {
    await mongoose.connect('your-connection-string-here', {
      serverSelectionTimeoutMS: 30000,
      connectTimeoutMS: 30000,
    });
    console.log('✅ Connection successful!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
    process.exit(1);
  }
};

testConnection();
```

## Common Error Solutions

### "ETIMEOUT" or "ENOTFOUND"
- DNS resolution issue
- Try different DNS servers
- Check internet connectivity

### "Authentication failed"
- Wrong username/password
- Check database user permissions
- Verify connection string format

### "IP not whitelisted"
- Add your IP to MongoDB Atlas Network Access
- Use 0.0.0.0/0 for development (not recommended for production)

### "Connection refused"
- Cluster might be paused
- Check cluster status in Atlas dashboard
- Verify connection string

## Immediate Action Plan

1. **Check Atlas Dashboard**: Verify cluster is running
2. **Update Network Access**: Add your IP (0.0.0.0/0 for now)
3. **Create .env file**: Add your MongoDB connection string
4. **Restart server**: The updated connection code should help
5. **If still failing**: Try local MongoDB setup

## Need Help?

If issues persist:
1. Share your connection string (hide username/password)
2. Check MongoDB Atlas status page
3. Try connecting from a different network (mobile hotspot)
4. Contact MongoDB Atlas support if using paid tier

The updated database configuration should handle connection issues better with retry logic and increased timeouts.
