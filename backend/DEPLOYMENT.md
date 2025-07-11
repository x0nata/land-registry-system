# Deployment Guide - Land Registry Unified Backend

This guide will help you deploy the unified Land Registry backend to Vercel.

## Pre-deployment Checklist

### ✅ 1. Environment Setup

**Required Environment Variables:**
- [ ] `MONGODB_URI` - MongoDB Atlas connection string
- [ ] `JWT_SECRET` - Strong JWT signing secret (32+ characters)
- [ ] `FRONTEND_URL` - User frontend URL (for CORS)
- [ ] `LANDOFFICER_FRONTEND_URL` - Land officer frontend URL (for CORS)
- [ ] `BACKEND_URL` - Backend URL (will be your Vercel deployment URL)

**Optional Environment Variables:**
- [ ] `CLOUDINARY_CLOUD_NAME` - For file uploads
- [ ] `CLOUDINARY_API_KEY` - For file uploads
- [ ] `CLOUDINARY_API_SECRET` - For file uploads
- [ ] `CHAPA_SECRET_KEY` - For payment processing
- [ ] `CHAPA_PUBLIC_KEY` - For payment processing
- [ ] `ADMIN_EMAIL` - Default admin email
- [ ] `ADMIN_PASSWORD` - Default admin password

### ✅ 2. Database Setup

**MongoDB Atlas Configuration:**
- [ ] Create MongoDB Atlas cluster
- [ ] Create database user with read/write permissions
- [ ] Configure network access (allow all IPs: 0.0.0.0/0 for Vercel)
- [ ] Get connection string and add to `MONGODB_URI`
- [ ] Test connection locally

### ✅ 3. File Structure Validation

**Required Files:**
- [ ] `api/index.js` - Main serverless entry point
- [ ] `package.json` - Dependencies and scripts
- [ ] `vercel.json` - Vercel configuration
- [ ] All controllers in `controllers/` directory
- [ ] All routes in `routes/` directory
- [ ] All models in `models/` directory
- [ ] All middleware in `middleware/` directory
- [ ] All config files in `config/` directory

## Deployment Steps

### Step 1: Install Vercel CLI

```bash
npm install -g vercel
```

### Step 2: Login to Vercel

```bash
vercel login
```

### Step 3: Initial Deployment

```bash
# Navigate to backend directory
cd backend

# Deploy to Vercel
vercel

# Follow the prompts:
# - Set up and deploy? Yes
# - Which scope? (select your account)
# - Link to existing project? No
# - Project name? land-registry-backend (or your preferred name)
# - Directory? ./ (current directory)
```

### Step 4: Configure Environment Variables

**Option A: Via Vercel Dashboard**
1. Go to [vercel.com/dashboard](https://vercel.com/dashboard)
2. Select your project
3. Go to Settings → Environment Variables
4. Add all required environment variables

**Option B: Via Vercel CLI**
```bash
# Add environment variables one by one
vercel env add MONGODB_URI
vercel env add JWT_SECRET
vercel env add FRONTEND_URL
vercel env add LANDOFFICER_FRONTEND_URL
# ... add all other variables
```

### Step 5: Production Deployment

```bash
# Deploy to production
vercel --prod
```

### Step 6: Verify Deployment

1. **Health Check:**
   ```bash
   curl https://your-deployment-url.vercel.app/api/health
   ```

2. **API Endpoints:**
   ```bash
   curl https://your-deployment-url.vercel.app/
   ```

3. **Database Connection:**
   ```bash
   curl https://your-deployment-url.vercel.app/api/db-health/ping
   ```

## Post-deployment Configuration

### 1. Update Frontend URLs

Update your frontend applications to use the new backend URL:

**User Frontend (.env):**
```
REACT_APP_API_URL=https://your-deployment-url.vercel.app/api
```

**Land Officer Frontend (.env):**
```
REACT_APP_API_URL=https://your-deployment-url.vercel.app/api
```

### 2. Test Critical Endpoints

Test the following endpoints to ensure everything is working:

- [ ] `GET /api/health` - Health check
- [ ] `POST /api/auth/register` - User registration
- [ ] `POST /api/auth/login` - User login
- [ ] `POST /api/auth/login-landofficer` - Land officer login
- [ ] `POST /api/auth/login-admin` - Admin login
- [ ] `GET /api/properties` - Properties endpoint (with auth)
- [ ] `POST /api/documents/property/:id` - File upload (with auth)

### 3. Create Admin User

If you haven't set up an admin user, you can create one using the API:

```bash
curl -X POST https://your-deployment-url.vercel.app/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "System Administrator",
    "email": "admin@landregistry.com",
    "password": "SecurePassword123!",
    "phoneNumber": "+251911234567",
    "nationalId": "ETH123456789"
  }'
```

Then manually update the user role to "admin" in your MongoDB database.

## Troubleshooting

### Common Issues

**1. Database Connection Errors**
- Verify MongoDB URI is correct
- Check network access settings in MongoDB Atlas
- Ensure database user has proper permissions

**2. CORS Errors**
- Verify frontend URLs are correctly set in environment variables
- Check CORS configuration in `api/index.js`

**3. File Upload Issues**
- Verify Cloudinary credentials are set
- Check file size limits
- Ensure GridFS is properly configured

**4. Authentication Issues**
- Verify JWT_SECRET is set and consistent
- Check token expiration settings
- Ensure middleware is properly configured

### Debugging

**View Logs:**
```bash
vercel logs your-deployment-url.vercel.app
```

**Check Function Execution:**
- Go to Vercel Dashboard → Functions tab
- Monitor function execution and errors

**Test Locally:**
```bash
# Run validation script
node scripts/validateBackend.js

# Start development server
npm run dev
```

## Performance Optimization

### 1. Database Optimization

- [ ] Add proper indexes to MongoDB collections
- [ ] Implement connection pooling
- [ ] Use projection to limit returned fields

### 2. Caching

- [ ] Implement Redis caching for frequently accessed data
- [ ] Add HTTP caching headers for static responses
- [ ] Use CDN for file uploads

### 3. Monitoring

- [ ] Set up error tracking (e.g., Sentry)
- [ ] Monitor API response times
- [ ] Set up uptime monitoring

## Security Checklist

- [ ] All environment variables are properly secured
- [ ] JWT secrets are strong and unique
- [ ] CORS is properly configured
- [ ] Rate limiting is enabled
- [ ] Input validation is implemented
- [ ] File upload restrictions are in place
- [ ] Database access is restricted

## Maintenance

### Regular Tasks

- [ ] Monitor error logs weekly
- [ ] Update dependencies monthly
- [ ] Backup database regularly
- [ ] Review security settings quarterly

### Updates

To update the deployment:

```bash
# Make your changes
git add .
git commit -m "Update backend"

# Deploy updates
vercel --prod
```

## Support

If you encounter issues during deployment:

1. Check the Vercel documentation: https://vercel.com/docs
2. Review the error logs in Vercel dashboard
3. Test locally using the validation script
4. Check MongoDB Atlas connection and settings

## Success Criteria

Your deployment is successful when:

- [ ] Health check endpoint returns 200 OK
- [ ] Database connection is established
- [ ] All API endpoints are accessible
- [ ] Authentication is working
- [ ] File uploads are functional
- [ ] Frontend applications can connect to the API
- [ ] No critical errors in logs

Congratulations! Your unified Land Registry backend is now deployed and ready to serve both frontend applications.
