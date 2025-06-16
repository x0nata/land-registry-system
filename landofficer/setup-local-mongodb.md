# Local MongoDB Setup Guide

## Quick Fix for Your Current Issue

The error you're seeing is now fixed! The problematic connection options have been removed. 

**Try restarting your server now** - it should connect successfully.

## If MongoDB Atlas Still Fails - Local Setup

### Option 1: MongoDB Community Server (Recommended)

#### 1. Download and Install
- Go to [MongoDB Download Center](https://www.mongodb.com/try/download/community)
- Select your OS (Windows/Mac/Linux)
- Download and install with default settings

#### 2. Start MongoDB Service

**Windows:**
```cmd
# Start as Windows Service (automatic)
net start MongoDB

# Or start manually
"C:\Program Files\MongoDB\Server\7.0\bin\mongod.exe" --dbpath "C:\data\db"
```

**Mac:**
```bash
# Using Homebrew
brew services start mongodb/brew/mongodb-community

# Or manually
mongod --config /usr/local/etc/mongod.conf
```

**Linux:**
```bash
# Using systemd
sudo systemctl start mongod
sudo systemctl enable mongod

# Or manually
mongod --dbpath /var/lib/mongodb
```

#### 3. Update Your .env File
```bash
# Replace your Atlas connection with local MongoDB
MONGO_URI=mongodb://localhost:27017/property-registration

# Keep other settings
JWT_SECRET=your-jwt-secret-here
JWT_EXPIRE=30d
NODE_ENV=development
PORT=5000
```

### Option 2: MongoDB Docker (Alternative)

#### 1. Install Docker
- Download [Docker Desktop](https://www.docker.com/products/docker-desktop)

#### 2. Run MongoDB Container
```bash
# Pull and run MongoDB
docker run -d \
  --name mongodb \
  -p 27017:27017 \
  -v mongodb_data:/data/db \
  mongo:latest

# Check if running
docker ps
```

#### 3. Update .env (same as above)
```bash
MONGO_URI=mongodb://localhost:27017/property-registration
```

## Testing Your Connection

### 1. Test with MongoDB Compass
- Download [MongoDB Compass](https://www.mongodb.com/try/download/compass)
- Connect to: `mongodb://localhost:27017`
- Should show successful connection

### 2. Test with Your Application
```bash
# In your server directory
npm run dev
```

You should see:
```
✅ MongoDB Connected: localhost
📊 Database: property-registration
🚀 Connected successfully!
```

## Troubleshooting Local MongoDB

### Common Issues:

#### 1. "MongoDB service not starting"
```bash
# Windows - Create data directory
mkdir C:\data\db

# Mac/Linux - Check permissions
sudo chown -R mongodb:mongodb /var/lib/mongodb
sudo chown mongodb:mongodb /tmp/mongodb-27017.sock
```

#### 2. "Port 27017 already in use"
```bash
# Find what's using the port
netstat -ano | findstr :27017

# Kill the process (Windows)
taskkill /PID <process_id> /F

# Kill the process (Mac/Linux)
sudo kill -9 <process_id>
```

#### 3. "Connection refused"
```bash
# Check if MongoDB is running
# Windows
sc query MongoDB

# Mac/Linux
ps aux | grep mongod
```

## Your Current Status

Based on your logs, I've fixed the connection options issue. Your server should now:

1. ✅ **Remove problematic options** (`bufferMaxEntries`, `bufferCommands`)
2. ✅ **Set mongoose global options** properly
3. ✅ **Continue running** even if database connection fails
4. ✅ **Retry connection** 3 times with delays
5. ✅ **Return default data** when database unavailable

## Next Steps

### 1. Restart Your Server
```bash
# Stop current server (Ctrl+C)
# Then restart
npm run dev
```

### 2. If Still Failing
- Check MongoDB Atlas cluster status
- Verify IP whitelist (add 0.0.0.0/0)
- Try local MongoDB setup above

### 3. Monitor Logs
Look for:
```
✅ MongoDB Connected: [hostname]
📊 Database: [database_name]
🚀 Connected successfully!
```

## Connection String Formats

### MongoDB Atlas (if working)
```bash
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/database?retryWrites=true&w=majority
```

### Local MongoDB
```bash
MONGO_URI=mongodb://localhost:27017/property-registration
```

The application will now handle connection failures gracefully and continue running with default data when the database is unavailable.
