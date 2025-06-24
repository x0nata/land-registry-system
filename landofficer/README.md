# Property Registration System

A modern, secure, and user-friendly web-based property registration and management system.

## Features

- **User Authentication**: Secure login and registration system
- **Property Management**: Register, view, and manage properties
- **Document Upload**: Secure document upload and verification
- **Payment Integration**: Chapa payment gateway integration
- **Dashboard Analytics**: Comprehensive dashboard with statistics
- **Role-based Access**: Different access levels for users and land officers
- **Real-time Updates**: Live notifications and status updates

## Tech Stack

### Frontend
- React 18
- Vite
- Tailwind CSS
- React Router
- Formik & Yup
- Chart.js
- Framer Motion

### Backend
- Node.js
- Express.js
- MongoDB with Mongoose
- JWT Authentication
- Cloudinary (File Storage)
- Chapa Payment Gateway

## Deployment

This application is optimized for Vercel deployment.

### Environment Variables

Configure the following environment variables in your Vercel dashboard:

```bash
# Database
MONGO_URI=your_mongodb_connection_string

# JWT
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRE=30d

# Server
NODE_ENV=production
PORT=5000

# URLs
FRONTEND_URL=https://your-frontend-domain.vercel.app
BACKEND_URL=https://your-backend-domain.vercel.app

# Chapa Payment
CHAPA_SECRET_KEY=your_chapa_secret_key
CHAPA_PUBLIC_KEY=your_chapa_public_key
CHAPA_BASE_URL=https://api.chapa.co/v1
CHAPA_WEBHOOK_SECRET=your_webhook_secret

# Cloudinary
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret

# Admin User
ADMIN_EMAIL=admin@yourdomain.com
ADMIN_PASSWORD=your_secure_admin_password
```

### Deployment Steps

1. **Fork/Clone** this repository
2. **Connect** your repository to Vercel
3. **Configure** environment variables in Vercel dashboard
4. **Deploy** - Vercel will automatically build and deploy both frontend and backend

### Post-Deployment Setup

After successful deployment, run the production setup script:

```bash
# Option 1: Run the complete setup script
npm run setup-production

# Option 2: Run individual setup commands
npm run create-indexes    # Create database indexes
npm run seed-admin       # Create admin user
```

**Manual Setup Steps:**

1. **Database Setup**: Ensure your MongoDB database is accessible
2. **Admin User**: The setup script will create an admin user with credentials from environment variables
3. **Payment Gateway**: Configure Chapa webhook URLs in your Chapa dashboard:
   - Webhook URL: `https://your-domain.vercel.app/api/payments/chapa/callback`
4. **File Storage**: Verify Cloudinary configuration for file uploads
5. **Testing**: Test the application with the admin credentials

## License

This project is licensed under the ISC License.
