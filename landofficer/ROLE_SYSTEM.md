# Role-Based Access Control System

This property registration system implements a comprehensive role-based access control (RBAC) system with three distinct user roles.

## User Roles

### 1. User (Default Role)
- **Purpose**: Regular property owners and citizens
- **Default Assignment**: All new registrations are automatically assigned the "user" role
- **Permissions**:
  - Register new properties
  - Submit property applications
  - View their own properties and applications
  - Update their profile information
  - Make payments for property services
  - Receive notifications about their applications

### 2. Land Officer
- **Purpose**: Government officials responsible for property verification
- **Assignment**: Only admins can assign this role
- **Permissions**:
  - Review property applications
  - Verify property documents
  - Approve or reject property registrations
  - Add comments to applications
  - View all properties in their jurisdiction
  - Access land officer dashboard
  - All user permissions

### 3. Admin
- **Purpose**: System administrators with full access
- **Assignment**: Only existing admins can assign this role
- **Permissions**:
  - Full user management (create, update, delete users)
  - Change user roles
  - Access admin dashboard
  - View system statistics and reports
  - Manage system settings
  - All land officer and user permissions

## Role Assignment Rules

1. **Default Assignment**: All public registrations default to "user" role
2. **Admin Protection**: Admins cannot change their own role to prevent system lockout
3. **Role Validation**: All role changes are validated and logged
4. **Audit Trail**: Role changes are logged with admin details and timestamps

## Authentication Endpoints

### Public Registration
- `POST /api/auth/register` - Always creates users with "user" role

### Role-Specific Login
- `POST /api/auth/login` - General login for all users
- `POST /api/auth/login/land-officer` - Specific login for land officers and admins
- `POST /api/auth/login/admin` - Specific login for admins only

## Admin User Management

### Creating Users
- Admins can create users with any role through the admin panel
- `POST /api/users` - Create user with specified role (admin only)

### Changing Roles
- `PUT /api/users/:id/role` - Change user role (admin only)
- Includes validation to prevent admin self-demotion
- Logs all role changes for audit purposes

### User Statistics
- `GET /api/users/stats` - Get user counts by role (admin only)

## Frontend Role Protection

### Route Protection
- Role-based route protection using `ProtectedRoute` component
- Automatic redirection based on user role
- Different dashboards for each role type

### UI Components
- `RoleBadge` component for consistent role display
- Role-specific navigation menus
- Conditional rendering based on user permissions

## Setting Up Admin User

### First-Time Setup
Run the admin creation script to create the first admin user:

```bash
npm run create-admin
```

This creates an admin user with:
- Email: admin@system.com
- Password: Admin123!@# (change after first login)
- Role: admin

### Manual Admin Creation
If needed, you can manually create an admin user in the database with the "admin" role.

## Security Features

1. **JWT Token Authentication**: All protected routes require valid JWT tokens
2. **Role Validation**: Server-side role validation on all protected endpoints
3. **Password Hashing**: All passwords are hashed using bcrypt
4. **Input Validation**: Comprehensive input validation using express-validator
5. **Audit Logging**: Role changes and admin actions are logged

## Database Schema

The User model includes a role field with the following schema:

```javascript
role: {
  type: String,
  enum: ["admin", "landOfficer", "user"],
  default: "user"
}
```

## Usage Examples

### Checking User Role in Frontend
```javascript
const { user, hasRole } = useAuth();

// Check specific role
if (hasRole('admin')) {
  // Show admin features
}

// Check multiple roles
if (hasRole(['admin', 'landOfficer'])) {
  // Show features for admins and land officers
}
```

### Backend Role Middleware
```javascript
// Protect admin-only routes
router.get('/admin-only', authenticate, isAdmin, controller);

// Protect land officer routes (includes admins)
router.get('/land-officer', authenticate, isLandOfficer, controller);
```

## Best Practices

1. **Principle of Least Privilege**: Users are assigned the minimum role necessary
2. **Role Separation**: Clear separation of concerns between roles
3. **Audit Trail**: All role changes are logged and traceable
4. **Secure Defaults**: New users default to the least privileged role
5. **Admin Protection**: Safeguards prevent admin lockout scenarios

## Troubleshooting

### Common Issues
1. **No Admin User**: Run `npm run create-admin` to create the first admin
2. **Role Not Updating**: Check JWT token refresh and re-login
3. **Access Denied**: Verify user has correct role and valid token
4. **Database Connection**: Ensure MongoDB connection is working

### Debugging
- Check browser console for authentication errors
- Verify JWT token in localStorage/sessionStorage
- Check server logs for role validation errors
- Use MongoDB Compass to verify user roles in database
