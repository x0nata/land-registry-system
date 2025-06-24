# Vercel Deployment Guide

## Recommended Deployment Strategy

For this full-stack application, we recommend deploying the frontend and backend separately for better performance and easier management.

## Option 1: Frontend-Only Deployment (Recommended for Frontend)

### Deploy the React Frontend to Vercel

1. **Navigate to the client directory**:
   ```bash
   cd client
   ```

2. **Deploy to Vercel**:
   ```bash
   npx vercel
   ```
   Or connect the `client` folder as a separate project in Vercel dashboard.

3. **Configure Environment Variables** in Vercel dashboard:
   ```bash
   VITE_API_URL=https://your-backend-url.com
   ```

### Deploy the Backend Separately

For the backend, consider these options:

#### Option A: Railway (Recommended for Node.js backends)
1. Connect your repository to Railway
2. Set the root directory to `/server`
3. Configure environment variables
4. Deploy

#### Option B: Render
1. Connect your repository to Render
2. Set the root directory to `/server`
3. Configure environment variables
4. Deploy

#### Option C: Heroku
1. Create a new Heroku app
2. Set the root directory to `/server`
3. Configure environment variables
4. Deploy

## Option 2: Full-Stack Deployment on Vercel

If you prefer to deploy everything on Vercel, follow these steps:

### 1. Project Structure Adjustment

Create an `api` directory in the root and move your server files:

```bash
mkdir api
cp -r server/* api/
```

### 2. Create vercel.json in root:

```json
{
  "version": 2,
  "builds": [
    {
      "src": "client/package.json",
      "use": "@vercel/static-build",
      "config": {
        "distDir": "dist"
      }
    },
    {
      "src": "api/**/*.js",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "/api/$1"
    },
    {
      "src": "/(.*)",
      "dest": "/client/dist/$1"
    }
  ]
}
```

### 3. Update package.json scripts:

```json
{
  "scripts": {
    "build": "cd client && npm install && npm run build",
    "vercel-build": "cd client && npm install && npm run build"
  }
}
```

## Environment Variables

### Frontend (.env in client directory):
```bash
VITE_API_URL=https://your-backend-url.com
```

### Backend (.env in server directory):
```bash
NODE_ENV=production
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
CHAPA_SECRET_KEY=your_chapa_secret_key
CHAPA_PUBLIC_KEY=your_chapa_public_key
FRONTEND_URL=https://your-frontend-domain.vercel.app
BACKEND_URL=https://your-backend-domain.com
```

## Quick Start (Recommended)

1. **Deploy Frontend**:
   - Go to Vercel dashboard
   - Import the repository
   - Set root directory to `client`
   - Deploy

2. **Deploy Backend**:
   - Use Railway, Render, or Heroku
   - Set root directory to `server`
   - Configure environment variables
   - Deploy

3. **Update Frontend Environment**:
   - Add backend URL to frontend environment variables
   - Redeploy frontend

## Troubleshooting

### Common Vercel Errors:

1. **"functions property cannot be used with builds"**:
   - Remove either `functions` or `builds` from vercel.json
   - Use the configurations provided above

2. **Build failures**:
   - Ensure all dependencies are in package.json
   - Check build scripts are correct
   - Verify environment variables are set

3. **API routes not working**:
   - Ensure API routes are properly configured
   - Check CORS settings
   - Verify environment variables

## Post-Deployment

After successful deployment:

1. **Set up database indexes**:
   ```bash
   npm run setup-production
   ```

2. **Test the application**:
   - Verify frontend loads correctly
   - Test API endpoints
   - Check database connectivity

3. **Configure monitoring**:
   - Set up error tracking
   - Monitor performance
   - Set up alerts

## Support

If you encounter issues:
1. Check Vercel deployment logs
2. Verify environment variables
3. Test locally first
4. Check network connectivity between frontend and backend
