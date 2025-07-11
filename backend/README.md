# Land Registry System - Unified Backend

This is the unified backend API for the Land Registry System, designed to serve both user-side and land officer-side frontends through a single serverless deployment on Vercel.

## Features

- **Unified API**: Single backend serving both user and land officer frontends
- **Serverless Architecture**: Optimized for Vercel deployment
- **MongoDB Integration**: Robust database connection with circuit breaker pattern
- **Authentication & Authorization**: JWT-based auth with role-based access control
- **File Management**: GridFS-based file storage with Cloudinary integration
- **Payment Integration**: Chapa payment gateway support
- **Property Management**: Complete property registration and transfer system
- **Document Verification**: Document upload, verification, and management
- **Dispute Resolution**: Property dispute handling system
- **Comprehensive Logging**: Application activity tracking and reporting

## Architecture

### Controllers
- `authController.js` - Authentication and user management
- `propertyController.js` - Property registration and management
- `documentController.js` - Document upload and verification
- `paymentController.js` - Payment processing and verification
- `transferController.js` - Property transfer management
- `disputeController.js` - Dispute handling
- `applicationLogController.js` - Activity logging and tracking
- `reportsController.js` - System reporting and analytics
- `settingsController.js` - System configuration
- `userController.js` - User management (admin only)

### Routes
All routes are prefixed with `/api/` and include:
- `/auth` - Authentication endpoints
- `/properties` - Property management
- `/documents` - Document operations
- `/payments` - Payment processing
- `/transfers` - Property transfers
- `/disputes` - Dispute management
- `/logs` - Activity logs
- `/reports` - System reports
- `/settings` - System settings
- `/users` - User management
- `/db-health` - Database health monitoring

### Models
- `User.js` - User accounts (users, land officers, admins)
- `Property.js` - Property records
- `Document.js` - Document metadata
- `Payment.js` - Payment records
- `PropertyTransfer.js` - Property transfer records
- `Dispute.js` - Dispute records
- `ApplicationLog.js` - Activity logs

## Environment Variables

Copy `.env.example` to `.env` and configure the following variables:

### Required
- `MONGODB_URI` - MongoDB connection string
- `JWT_SECRET` - JWT signing secret
- `FRONTEND_URL` - User frontend URL (for CORS)
- `LANDOFFICER_FRONTEND_URL` - Land officer frontend URL (for CORS)

### Optional
- `CLOUDINARY_*` - Cloudinary configuration for file uploads
- `CHAPA_*` - Chapa payment gateway configuration
- `EMAIL_*` - Email service configuration
- `SMS_*` - SMS service configuration

## Deployment

### Vercel Deployment

1. **Install Vercel CLI**:
   ```bash
   npm install -g vercel
   ```

2. **Login to Vercel**:
   ```bash
   vercel login
   ```

3. **Deploy**:
   ```bash
   vercel --prod
   ```

4. **Configure Environment Variables**:
   - Go to your Vercel dashboard
   - Navigate to your project settings
   - Add all required environment variables from `.env.example`

### Environment Setup

1. **MongoDB Atlas**:
   - Create a MongoDB Atlas cluster
   - Configure network access (allow all IPs: 0.0.0.0/0 for Vercel)
   - Create a database user
   - Get the connection string

2. **Cloudinary** (optional):
   - Create a Cloudinary account
   - Get your cloud name, API key, and API secret

3. **Chapa** (optional):
   - Create a Chapa account
   - Get your public and secret keys

## Local Development

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Set Environment Variables**:
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Start Development Server**:
   ```bash
   npm run dev
   ```

4. **Access API**:
   - API will be available at `http://localhost:3000`
   - Health check: `http://localhost:3000/api/health`

## API Documentation

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/login-landofficer` - Land officer login
- `POST /api/auth/login-admin` - Admin login
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/profile` - Update user profile

### Properties
- `GET /api/properties` - Get all properties (admin/land officer)
- `POST /api/properties` - Register new property (user)
- `GET /api/properties/user` - Get user's properties
- `GET /api/properties/:id` - Get property by ID
- `PUT /api/properties/:id` - Update property
- `DELETE /api/properties/:id` - Delete property

### Documents
- `POST /api/documents/property/:propertyId` - Upload document
- `GET /api/documents/property/:propertyId` - Get property documents
- `GET /api/documents/:id` - Get document by ID
- `GET /api/documents/:id/download` - Download document
- `PUT /api/documents/:id/verify` - Verify document (admin/land officer)

### Payments
- `POST /api/payments/property/:propertyId` - Create payment
- `GET /api/payments/user` - Get user payments
- `POST /api/payments/chapa/initialize/:propertyId` - Initialize Chapa payment
- `PUT /api/payments/:id/verify` - Verify payment (admin/land officer)

## Security Features

- **Helmet**: Security headers
- **CORS**: Cross-origin resource sharing configuration
- **Rate Limiting**: Request rate limiting
- **JWT Authentication**: Secure token-based authentication
- **Role-based Access Control**: User, land officer, and admin roles
- **Input Validation**: Express-validator for request validation
- **Error Handling**: Comprehensive error handling middleware

## Database Features

- **Connection Pooling**: Optimized MongoDB connections
- **Circuit Breaker**: Database connection resilience
- **Health Monitoring**: Database health check endpoints
- **GridFS**: Large file storage support
- **Indexing**: Optimized database queries

## Monitoring and Logging

- **Morgan**: HTTP request logging
- **Application Logs**: Comprehensive activity tracking
- **Health Checks**: System health monitoring endpoints
- **Performance Metrics**: Database and application metrics

## Support

For issues and questions, please refer to the project documentation or contact the development team.
