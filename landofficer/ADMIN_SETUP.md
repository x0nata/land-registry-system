# Admin User Setup Guide

This guide will help you create an admin user in the database for the Property Registration System.

## Prerequisites

1. Make sure MongoDB is running
2. Make sure your `.env` file is properly configured with `MONGO_URI`
3. Make sure you're in the project root directory

## Option 1: Create Admin User Only

To create just the admin user, run:

```bash
npm run create-admin
```

This will create an admin user with the following credentials:
- **Email:** admin@system.com
- **Password:** admin123
- **Role:** admin
- **National ID:** ETH000000001

## Option 2: Seed Multiple Users (Recommended)

To create multiple users including admin, land officers, and regular users, run:

```bash
npm run seed-users
```

## Option 3: Reset Admin Password

If you're getting "invalid credentials" error, reset the admin password:

```bash
npm run reset-admin-password
```

## Option 4: Test Admin Login

To verify that the admin user was created correctly and test login functionality:

```bash
npm run test-admin
```

This will create the following users:

### Admin User
- **Email:** admin@system.com
- **Password:** admin123
- **Role:** admin

### Land Officers
- **Email:** john.doe@landoffice.gov.et
- **Password:** landofficer123
- **Role:** landOfficer

- **Email:** jane.smith@landoffice.gov.et
- **Password:** landofficer123
- **Role:** landOfficer

### Regular Users
- **Email:** michael.johnson@email.com
- **Password:** user123456
- **Role:** user

- **Email:** sarah.wilson@email.com
- **Password:** user123456
- **Role:** user

## Accessing the Admin Panel

1. Start the application:
   ```bash
   npm run dev
   ```

2. Navigate to the admin login page:
   ```
   http://localhost:3000/admin-login
   ```

3. Login with admin credentials:
   - **Username:** admin
   - **Password:** admin123

   OR

   - **Email:** admin@system.com
   - **Password:** admin123

## Admin Panel Features

Once logged in as admin, you can:

- **User Management:** View, create, edit, and delete users
- **Land Officer Management:** Manage land officers and assign applications
- **Property Management:** Review and approve property applications
- **Payment Management:** Verify payments and manage transactions
- **Reports:** Generate various system reports and analytics
- **Settings:** Configure system settings, fees, and security options

## Troubleshooting

### Script Fails to Run
- Make sure MongoDB is running
- Check your `.env` file has the correct `MONGO_URI`
- Ensure you're in the project root directory

### User Already Exists
- The scripts will skip creating users that already exist
- Check the console output for details

### Database Connection Issues
- Verify MongoDB is running on the correct port
- Check your MongoDB connection string in `.env`

### Login Issues
- **"Invalid credentials" error:** Run `npm run reset-admin-password` to reset the password
- **"Invalid signature" error:** This should be fixed with the new authentication system
- Make sure you're using the correct credentials: admin@system.com / admin123
- Check the browser console for any errors
- Verify the admin user exists by running `npm run test-admin`

## Manual Database Verification

To verify the admin user was created, you can connect to MongoDB and run:

```javascript
// Connect to your database
use your_database_name

// Find the admin user
db.users.findOne({email: "admin@system.com"})
```

## Security Notes

- Change the default admin password after first login
- The hardcoded admin login (admin/admin123) is for development only
- In production, disable the hardcoded admin login and use only database users
- Consider implementing additional security measures like 2FA for admin accounts
