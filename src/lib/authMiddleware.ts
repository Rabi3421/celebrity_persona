import { NextRequest, NextResponse } from 'next/server';
import { TokenService } from '@/lib/tokenService';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';

export interface AuthenticatedRequest extends NextRequest {
  user?: {
    userId: string;
    email: string;
    role: string;
    name: string;
    avatar?: string;
  };
}

export function authMiddleware(requiredRoles?: string[]) {
  return async (request: AuthenticatedRequest) => {
    try {
      // Get access token from Authorization header
      const authHeader = request.headers.get('Authorization');
      
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return NextResponse.json(
          { 
            success: false,
            message: 'Access token required. Please provide token in Authorization header.' 
          },
          { status: 401 }
        );
      }

      const accessToken = authHeader.substring(7); // Remove 'Bearer ' prefix

      // Verify access token
      let decoded;
      try {
        decoded = TokenService.verifyAccessToken(accessToken);
      } catch (error) {
        return NextResponse.json(
          { 
            success: false,
            message: 'Invalid or expired access token' 
          },
          { status: 401 }
        );
      }

      await dbConnect();

      // Find user
      const user = await User.findById(decoded.userId);
      if (!user) {
        return NextResponse.json(
          { 
            success: false,
            message: 'User not found' 
          },
          { status: 401 }
        );
      }

      // Check if user is active
      if (!user.isActive) {
        return NextResponse.json(
          { 
            success: false,
            message: 'Account is deactivated' 
          },
          { status: 401 }
        );
      }

      // Check role-based access
      if (requiredRoles && !requiredRoles.includes(user.role)) {
        return NextResponse.json(
          { 
            success: false,
            message: `Access denied. Required role: ${requiredRoles.join(' or ')}` 
          },
          { status: 403 }
        );
      }

      // Attach user to request
      request.user = {
        userId: user._id,
        email: user.email,
        role: user.role,
        name: user.name,
        avatar: (user as any).avatar || '',
      };

      return null; // Continue to next handler
    } catch (error) {
      console.error('Auth middleware error:', error);
      return NextResponse.json(
        { 
          success: false,
          message: 'Authentication error' 
        },
        { status: 500 }
      );
    }
  };
}

// Helper to create auth wrapper for API handlers
export function withAuth(handler: Function, requiredRoles?: string[]) {
  return async (request: AuthenticatedRequest, context?: any) => {
    const authResult = await authMiddleware(requiredRoles)(request);
    if (authResult) {
      return authResult; // Return error response
    }
    return handler(request, context); // Continue to handler
  };
}