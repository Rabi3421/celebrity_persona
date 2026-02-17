# Celebrity Persona - Full-Stack Authentication System

A comprehensive Next.js application with MongoDB authentication, role-based access control, and JWT token management.

## Features

### 🔐 Authentication System
- **JWT-based Authentication** with access tokens (1 hour) and refresh tokens (30 days)
- **Automatic Token Refresh** without user interaction
- **Role-based Access Control** (User, Admin, SuperAdmin)
- **Secure Cookie Management** for refresh tokens
- **Context API** for state management (no localStorage)

### 👥 User Roles
- **User**: Can sign up, login, and access user dashboard
- **Admin**: Access to admin dashboard + user features (created by SuperAdmin)
- **SuperAdmin**: Full system access + can create admin accounts

### 🛡️ Security Features
- **Password Hashing** with bcrypt
- **MongoDB Integration** with Mongoose
- **Protected Routes** with middleware
- **Automatic Session Management**
- **CORS and Security Headers**

## Quick Start

### 1. Prerequisites
- Node.js 18+ 
- MongoDB Atlas account (or local MongoDB)
- Git

### 2. Installation
```bash
# Clone the repository
git clone <your-repo-url>
cd website_project-main

# Install dependencies
npm install

# Setup environment variables
cp .env.example .env
```

### 3. Environment Configuration

Update your `.env` file with the following variables:

```env
# MongoDB Connection
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/database

# JWT Secrets (Change these in production!)
JWT_ACCESS_SECRET=your_access_token_secret_key_change_this_in_production
JWT_REFRESH_SECRET=your_refresh_token_secret_key_change_this_in_production

# Default SuperAdmin Credentials
SUPERADMIN_EMAIL=superadmin@celebritypersona.com
SUPERADMIN_PASSWORD=SuperAdmin123!
```

### 4. Initialize SuperAdmin Account

Before using the system, you need to create the SuperAdmin account:

1. Start the development server:
```bash
npm run dev
```

2. Visit: `http://localhost:4028/init-superadmin`
3. Click "Create SuperAdmin Account"
4. The SuperAdmin will be created with the credentials from your `.env` file

### 5. Test the System

#### Create User Account:
1. Go to `http://localhost:4028/signup`
2. Fill out the registration form
3. After signup, you'll be redirected to login

#### Login as SuperAdmin:
1. Go to `http://localhost:4028/login`
2. Email: `superadmin@celebritypersona.com`
3. Password: `SuperAdmin123!`
4. You'll be redirected to `/superadmin`

#### Create Admin Account:
1. Login as SuperAdmin
2. Go to SuperAdmin Dashboard → Role Management
3. Use the "Create Admin Account" form
4. The new admin can then login with their credentials

## API Endpoints

### Authentication
- `POST /api/auth/signup` - User registration (users only)
- `POST /api/auth/login` - Login for all roles
- `POST /api/auth/logout` - Logout and clear tokens
- `POST /api/auth/refresh` - Refresh access token
- `GET /api/auth/me` - Get current user info

### Admin Management (SuperAdmin only)
- `POST /api/admin/create` - Create admin accounts
- `GET /api/admin/create` - Get all admin accounts

### System Initialization
- `POST /api/init-superadmin` - Initialize SuperAdmin account
- `GET /api/init-superadmin` - Check if SuperAdmin exists

## Project Structure

```
src/
├── app/
│   ├── api/auth/           # Authentication API routes
│   ├── api/admin/          # Admin management API
│   ├── api/init-superadmin/# SuperAdmin initialization
│   ├── login/              # Login page
│   ├── signup/             # Signup page
│   ├── dashboard/          # User dashboard
│   ├── admin/              # Admin dashboard
│   ├── superadmin/         # SuperAdmin dashboard
│   └── init-superadmin/    # SuperAdmin initialization page
├── components/
│   ├── admin/              # Admin-related components
│   ├── common/             # Shared components (Header, Footer)
│   └── ui/                 # UI components
├── context/
│   └── AuthContext.tsx     # Authentication context
├── hooks/
│   └── useAuth.ts          # Authentication hooks
├── lib/
│   ├── mongodb.ts          # MongoDB connection
│   ├── tokenService.ts     # JWT token management
│   └── authMiddleware.ts   # Route protection middleware
└── models/
    └── User.ts             # User MongoDB model
```

## Key Features Explained

### 🔄 Automatic Token Refresh
- Access tokens expire in 1 hour
- Refresh tokens are valid for 30 days
- The system automatically refreshes access tokens 5 minutes before expiration
- Users never see token expiration issues

### 🛡️ Role-Based Protection
- Routes automatically redirect based on user role:
  - Users → `/dashboard`
  - Admins → `/admin`
  - SuperAdmin → `/superadmin`
- Protected routes check authentication and role permissions
- Unauthorized access redirects appropriately

### 📱 Context API State Management
- No localStorage usage for security
- Real-time authentication state
- Automatic login persistence through HTTP-only cookies
- Clean logout and session management

## Security Considerations

### Production Deployment:
1. **Change JWT Secrets**: Use strong, unique secrets
2. **HTTPS Only**: Ensure secure cookie transmission
3. **Environment Variables**: Never commit secrets to git
4. **MongoDB Security**: Use MongoDB Atlas with IP whitelisting
5. **Password Policy**: Implement stronger password requirements

### Default Credentials:
- SuperAdmin: `superadmin@celebritypersona.com` / `SuperAdmin123!`
- **⚠️ Change these immediately in production!**

## Common Issues & Solutions

### 1. MongoDB Connection Issues
```
Error: MongoServerError: bad auth
```
**Solution**: Verify your `MONGODB_URI` credentials and IP whitelist

### 2. JWT Token Errors
```
JsonWebTokenError: invalid signature
```
**Solution**: Ensure `JWT_ACCESS_SECRET` and `JWT_REFRESH_SECRET` are set

### 3. CORS Issues
```
Access to fetch blocked by CORS policy
```
**Solution**: Next.js API routes handle CORS automatically

### 4. SuperAdmin Not Found
**Solution**: Visit `/init-superadmin` to create the SuperAdmin account

## Build & Deploy

### Development
```bash
npm run dev
```

### Production Build
```bash
npm run build
npm start
```

### Verify Build
```bash
npm run build
```
All builds should complete successfully with TypeScript validation.

## Testing Authentication Flow

1. **Signup as User**: Create account → Auto-login → Redirect to dashboard
2. **Login as SuperAdmin**: Login → Redirect to superadmin panel
3. **Create Admin**: SuperAdmin creates admin → Admin can login
4. **Token Refresh**: Wait near token expiration → Should refresh automatically
5. **Logout**: Test logout → Should clear all tokens and redirect

## Support & Troubleshooting

If you encounter issues:
1. Check the console for error messages
2. Verify environment variables are set correctly
3. Ensure MongoDB connection is working
4. Check that all dependencies are installed
5. Try clearing browser cookies and refreshing

## Architecture Highlights

- **Next.js 15** with App Router
- **MongoDB** with Mongoose ODM
- **JWT** with automatic refresh
- **TypeScript** for type safety
- **Tailwind CSS** for styling
- **React Context** for state management
- **HTTP-only cookies** for security

The system is production-ready with proper error handling, validation, and security measures!