# Development Port Configuration

This document outlines the port configuration for running both applications in development mode.

## Port Assignments

| Application | Component | Port | URL |
|-------------|-----------|------|-----|
| Land Officer | Frontend (React/Vite) | 3000 | http://localhost:3000 |
| Land Officer | Backend (Express) | 3001 | http://localhost:3001 |
| User | Frontend (React/Vite) | 3002 | http://localhost:3002 |
| User | Backend (Express) | 3003 | http://localhost:3003 |

## Quick Start

### Option 1: Use the provided scripts
```bash
# For Windows
start-dev.bat

# For Linux/Mac
chmod +x start-dev.sh
./start-dev.sh
```

### Option 2: Manual startup

#### Start Land Officer Application
```bash
cd landofficer
npm run dev
```
This will start:
- Frontend on http://localhost:3000
- Backend on http://localhost:3001

#### Start User Application (in a new terminal)
```bash
cd user
npm run dev
```
This will start:
- Frontend on http://localhost:3002
- Backend on http://localhost:3003

## Configuration Details

### Frontend Configuration
- **Land Officer**: `landofficer/client/vite.config.js` - port 3000
- **User**: `user/client/vite.config.js` - port 3002

### Backend Configuration
- **Land Officer**: `landofficer/server/server.js` - port 3001 (default)
- **User**: `user/server/server.js` - port 3003 (default)

### API Configuration
- **Land Officer**: `landofficer/client/src/services/api.js` - baseURL: http://localhost:3001/api
- **User**: `user/client/src/services/api.js` - baseURL: http://localhost:3003/api

### CORS Configuration
Both servers are configured to allow cross-origin requests from all relevant ports:
- Land Officer server allows: 3000, 3001, 3002, 3003
- User server allows: 3002, 3003

## Environment Variables

You can override the default ports using environment variables:

### Land Officer
```bash
# In landofficer/server/.env
PORT=3001  # Backend port

# Frontend port is set in vite.config.js
```

### User
```bash
# In user/server/.env
PORT=3003  # Backend port

# Frontend port is set in vite.config.js
```

## Troubleshooting

### Port Already in Use
If you get "port already in use" errors:

1. Check what's running on the port:
   ```bash
   # Windows
   netstat -ano | findstr :3000
   
   # Linux/Mac
   lsof -i :3000
   ```

2. Kill the process or use a different port

### CORS Errors
If you encounter CORS errors, ensure:
1. The backend server is running
2. The frontend is making requests to the correct backend port
3. The backend CORS configuration includes the frontend port

### API Connection Issues
If the frontend can't connect to the backend:
1. Verify the backend is running on the expected port
2. Check the API baseURL in `src/services/api.js`
3. Ensure no firewall is blocking the connections
