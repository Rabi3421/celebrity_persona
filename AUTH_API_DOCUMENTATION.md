# Celebrity Persona Authentication System

A complete JWT-based authentication system with three roles: **User**, **Admin**, and **SuperAdmin**. Each role has specific access controls and functionality.

## 🚀 Features

- **Role-based access control** (User, Admin, SuperAdmin)
- **JWT authentication** with access and refresh tokens
- **Password reset functionality** for all roles
- **Token-based authorization** ensuring role-specific access
- **Secure password hashing** with bcrypt
- **MongoDB integration** with Mongoose
- **Complete CRUD operations** for user management (SuperAdmin only)
- **Token refresh mechanism**
- **Multi-device logout support**

## 🔐 Role Permissions

### SuperAdmin
- Only **one SuperAdmin** can exist at a time
- Create/Delete SuperAdmin with special key
- Create and manage Users and Admins
- Full access to all user management operations
- Own profile and password management

### Admin
- Login and logout
- View own profile
- Update own password
- Reset password functionality

### User
- Registration (signup)
- Login and logout
- View and update own profile
- Update own password
- Reset password functionality

## 📋 Environment Variables

Make sure to set these environment variables in your `.env` file:

```bash
# MongoDB Connection
MONGODB_URI=mongodb+srv://celebritypersona:GRFA287342114@celebritypersona.wuahw7q.mongodb.net/celebritypersona

# JWT Secrets (Change these in production!)
JWT_ACCESS_SECRET=celeb_persona_access_jwt_secret_2026_very_secure_key_change_in_production
JWT_REFRESH_SECRET=celeb_persona_refresh_jwt_secret_2026_very_secure_key_change_in_production

# Default SuperAdmin Credentials
SUPERADMIN_EMAIL=superadmin@celebritypersona.com
SUPERADMIN_PASSWORD=SuperAdmin123!

# Special Key for SuperAdmin Operations (Change this in production!)
SUPERADMIN_SPECIAL_KEY=celeb_persona_super_admin_key_2026_secure
```

## 🛠️ Installation & Setup

1. **Clone the repository**
```bash
git clone <repository-url>
cd website_project-main
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up environment variables**
- Copy `.env.example` to `.env`
- Update the values as needed

4. **Run the development server**
```bash
npm run dev
```

The server will start at `http://localhost:4028`

## 📚 API Documentation

### Base URL
```
http://localhost:4028/api/auth
```

### Authentication
Most endpoints require an `Authorization` header with a Bearer token:
```
Authorization: Bearer <access_token>
```

---

## 🔒 SuperAdmin APIs

### Create SuperAdmin
**POST** `/superadmin/create`

Creates the initial SuperAdmin account. Only one SuperAdmin can exist.

**Request Body:**
```json
{
  "email": "superadmin@celebritypersona.com",
  "password": "SuperAdmin123!",
  "specialKey": "celeb_persona_super_admin_key_2026_secure"
}
```

### SuperAdmin Login
**POST** `/superadmin/login`

**Request Body:**
```json
{
  "email": "superadmin@celebritypersona.com",
  "password": "SuperAdmin123!"
}
```

**Response:**
```json
{
  "success": true,
  "message": "SuperAdmin login successful",
  "data": {
    "user": {
      "id": "...",
      "email": "superadmin@celebritypersona.com",
      "name": "Super Administrator",
      "role": "superadmin",
      "lastLogin": "2026-02-17T..."
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### Get SuperAdmin Profile
**GET** `/superadmin/profile`
- **Requires:** SuperAdmin access token

### Update SuperAdmin Password
**PUT** `/superadmin/update-password`
- **Requires:** SuperAdmin access token

**Request Body:**
```json
{
  "currentPassword": "SuperAdmin123!",
  "newPassword": "NewSuperAdmin123!"
}
```

### SuperAdmin Password Reset
**POST** `/superadmin/reset-password` (Request reset)
**PUT** `/superadmin/reset-password` (Confirm reset)

### Create User/Admin
**POST** `/superadmin/create-user`
- **Requires:** SuperAdmin access token

**Request Body:**
```json
{
  "name": "Test Admin",
  "email": "admin@example.com",
  "password": "Admin123!",
  "role": "admin"
}
```

### Manage Users
**GET** `/superadmin/manage-users` - Get all users with pagination
**PUT** `/superadmin/manage-users` - Update user
**DELETE** `/superadmin/manage-users` - Delete user
- **Requires:** SuperAdmin access token

### Delete SuperAdmin
**DELETE** `/superadmin/delete`

**Request Body:**
```json
{
  "specialKey": "celeb_persona_super_admin_key_2026_secure"
}
```

---

## 👨‍💼 Admin APIs

### Admin Login
**POST** `/admin/login`

**Request Body:**
```json
{
  "email": "admin@example.com",
  "password": "Admin123!"
}
```

### Get Admin Profile
**GET** `/admin/profile`
- **Requires:** Admin access token

### Update Admin Password
**PUT** `/admin/update-password`
- **Requires:** Admin access token

### Admin Password Reset
**POST** `/admin/reset-password` (Request reset)
**PUT** `/admin/reset-password` (Confirm reset)

---

## 👤 User APIs

### User Registration
**POST** `/user/signup`

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "user@example.com",
  "password": "User123!"
}
```

### User Login
**POST** `/user/login`

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "User123!"
}
```

### Get User Profile
**GET** `/user/profile`
- **Requires:** User access token

### Update User Profile
**PUT** `/user/profile`
- **Requires:** User access token

**Request Body:**
```json
{
  "name": "John Updated",
  "email": "john.updated@example.com"
}
```

### Update User Password
**PUT** `/user/update-password`
- **Requires:** User access token

### User Password Reset
**POST** `/user/reset-password` (Request reset)
**PUT** `/user/reset-password` (Confirm reset)

---

## 🔄 Common Auth APIs

### Refresh Access Token
**POST** `/refresh-token`

**Request Body:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### Logout
**POST** `/logout`
- **Requires:** Any valid access token

**Request Body:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "logoutAll": false
}
```

Set `logoutAll: true` to logout from all devices.

---

## 🔐 Security Features

1. **Password Hashing**: All passwords are hashed using bcrypt with salt rounds of 12
2. **JWT Tokens**: 
   - Access tokens expire in 1 hour
   - Refresh tokens expire in 30 days
3. **Role-based Access Control**: Each endpoint checks for appropriate role permissions
4. **Token Validation**: All protected routes validate JWT tokens and user existence
5. **Password Reset**: Secure token-based password reset with 15-minute expiry
6. **Special Key Protection**: SuperAdmin creation/deletion requires a special key

## 📄 Response Format

All API responses follow this format:

**Success Response:**
```json
{
  "success": true,
  "message": "Operation successful",
  "data": { /* response data */ }
}
```

**Error Response:**
```json
{
  "success": false,
  "message": "Error description"
}
```

## 🧪 Testing with Postman

1. Import the Postman collection from `/postman/Celebrity_Persona_Auth_API.postman_collection.json`
2. The collection includes environment variables that auto-populate tokens
3. Test the complete authentication flow:
   - Create SuperAdmin
   - Login as different roles
   - Test role-based access restrictions
   - Test token refresh and logout functionality

## 🚨 Important Security Notes

1. **Change all default passwords and secrets in production!**
2. **The special key is critical - store it securely**
3. **Reset tokens are returned in API responses for testing - in production, send them via email**
4. **Always use HTTPS in production**
5. **Consider implementing rate limiting for auth endpoints**
6. **Regularly rotate JWT secrets**

## 🏗️ Project Structure

```
src/
├── app/api/auth/
│   ├── superadmin/          # SuperAdmin specific routes
│   ├── admin/               # Admin specific routes
│   ├── user/                # User specific routes
│   ├── refresh-token/       # Token refresh endpoint
│   └── logout/              # Logout endpoint
├── lib/
│   ├── authMiddleware.ts    # Authentication middleware
│   ├── tokenService.ts     # JWT token utilities
│   └── mongodb.ts          # Database connection
├── models/
│   └── User.ts             # User model with role support
└── ...
```

## 📖 Usage Examples

### Complete Authentication Flow

1. **Create SuperAdmin:**
```bash
curl -X POST http://localhost:4028/api/auth/superadmin/create \
  -H "Content-Type: application/json" \
  -d '{"email":"superadmin@celebritypersona.com","password":"SuperAdmin123!","specialKey":"celeb_persona_super_admin_key_2026_secure"}'
```

2. **SuperAdmin creates an Admin:**
```bash
curl -X POST http://localhost:4028/api/auth/superadmin/create-user \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <superadmin_access_token>" \
  -d '{"name":"Test Admin","email":"admin@example.com","password":"Admin123!","role":"admin"}'
```

3. **User signs up:**
```bash
curl -X POST http://localhost:4028/api/auth/user/signup \
  -H "Content-Type: application/json" \
  -d '{"name":"John Doe","email":"user@example.com","password":"User123!"}'
```

4. **User logs in:**
```bash
curl -X POST http://localhost:4028/api/auth/user/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"User123!"}'
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📝 License

This project is licensed under the MIT License.

---

**Happy Coding! 🚀**