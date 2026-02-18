# Complete Authentication & Content Management System

This is a comprehensive authentication and content management system built with **Next.js 15**, **MongoDB**, and **JWT authentication**. The system supports three user roles with specific access controls and provides a complete content management platform for celebrity-focused applications.

## 🔐 Authentication System

### User Roles
- **User**: Basic user account with standard access
- **Admin**: Administrative access with user management capabilities  
- **SuperAdmin**: Full system access including content management and user/admin creation

### Features
- JWT-based authentication with access tokens (1 hour) and refresh tokens (30 days)
- Role-based access control middleware
- Password reset functionality with secure tokens
- Protected routes and API endpoints
- Secure password hashing with bcryptjs

## 📊 Authentication APIs (27 endpoints)

### User APIs (`/api/auth/user/`)
- **POST** `/signup` - User registration
- **POST** `/login` - User login
- **GET** `/profile` - Get user profile
- **POST** `/reset-password` - Reset password request
- **POST** `/update-password` - Update password

### Admin APIs (`/api/auth/admin/`)
- **POST** `/login` - Admin login  
- **GET** `/profile` - Get admin profile
- **POST** `/reset-password` - Admin password reset
- **POST** `/update-password` - Admin password update

### SuperAdmin APIs (`/api/auth/superadmin/`)
- **POST** `/create` - Create SuperAdmin (requires special key)
- **POST** `/login` - SuperAdmin login
- **GET** `/profile` - Get SuperAdmin profile
- **POST** `/reset-password` - SuperAdmin password reset
- **POST** `/update-password` - SuperAdmin password update
- **POST** `/delete` - Delete SuperAdmin account
- **POST** `/create-user` - Create new user/admin accounts
- **GET** `/manage-users` - Get all users with filtering

### Common APIs
- **POST** `/api/auth/logout` - Logout (all roles)
- **POST** `/api/auth/refresh-token` - Refresh access token

## 🎭 Content Management System (SuperAdmin & Admin Access)

### Celebrity Management (`/api/content/celebrities/`)
- **GET** `/` - Get all celebrities with filtering and pagination
- **POST** `/` - Create new celebrity profile
- **GET** `/:id` - Get specific celebrity
- **PUT** `/:id` - Update celebrity profile  
- **DELETE** `/:id` - Delete celebrity

### Celebrity Outfits (`/api/content/outfits/`)
- **GET** `/` - Get all celebrity outfits with filtering
- **POST** `/` - Create new outfit post
- **GET** `/:id` - Get specific outfit
- **PUT** `/:id` - Update outfit details
- **DELETE** `/:id` - Delete outfit

### Celebrity News (`/api/content/news/`)
- **GET** `/` - Get all news articles with filtering
- **POST** `/` - Create new news article
- **GET** `/:id` - Get specific news article
- **PUT** `/:id` - Update news article
- **DELETE** `/:id` - Delete news article

### Movie Management (`/api/content/movies/`)
- **GET** `/` - Get all movies with filtering
- **POST** `/` - Create new movie
- **GET** `/:id` - Get specific movie
- **PUT** `/:id` - Update movie details
- **DELETE** `/:id` - Delete movie

### Movie Reviews (`/api/content/reviews/`)
- **GET** `/` - Get all movie reviews with filtering
- **POST** `/` - Create new movie review
- **GET** `/:id` - Get specific review
- **PUT** `/:id` - Update review
- **DELETE** `/:id` - Delete review

## 🗄️ Database Models

### User Model
- Role-based user system (user, admin, superadmin)
- Password hashing and validation
- Reset token management
- Last login tracking

### Celebrity Model
- Comprehensive profile information
- Social media links
- Awards and achievements
- Search indexing

### CelebrityOutfit Model
- Outfit items with pricing
- Event and occasion categorization
- Image gallery support

### CelebrityNews Model
- Full article management
- SEO optimization
- Publishing workflow
- Celebrity tagging

### Movie Model
- Complete movie information
- Cast management with role details
- Ratings from multiple sources
- Production details

### MovieReview Model
- Multi-type reviewer support (User, Critic, Celebrity)
- Rating system with pros/cons
- Review validation

## 🔧 Technical Stack

- **Framework**: Next.js 15.1.11 with TypeScript
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT tokens with bcryptjs hashing
- **Environment**: Secure environment variable configuration
- **API Testing**: Complete Postman collection included

## 🚀 Getting Started

1. **Environment Setup**:
   ```env
   MONGODB_URI=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret_key
   JWT_REFRESH_SECRET=your_refresh_token_secret
   SUPERADMIN_SPECIAL_KEY=celeb_persona_super_admin_key_2026_secure
   ```

2. **Install Dependencies**:
   ```bash
   npm install
   ```

3. **Build Project**:
   ```bash
   npm run build
   ```

4. **Start Development**:
   ```bash
   npm run dev
   ```

## 📋 Postman Collection

The complete API collection is available in `/postman/Celebrity_Persona_Auth_API.postman_collection.json` with:
- Pre-configured environment variables
- Authentication token management
- Example requests for all endpoints
- Organized by functionality (Auth, Content Management)

## 🔐 Security Features

- Role-based middleware protection
- JWT token validation on all protected routes
- Password strength requirements
- Secure reset token generation
- Environment-based configuration
- Special key protection for SuperAdmin creation

## 📱 Frontend Integration Ready

All API endpoints are designed to integrate seamlessly with the existing Next.js frontend components, supporting the celebrity persona application's complete functionality.

---

**Note**: Both SuperAdmin and Admin users can perform content management operations (create, update, delete) for celebrities, outfits, news, movies, and reviews. SuperAdmin retains exclusive access to user management and admin creation functions.