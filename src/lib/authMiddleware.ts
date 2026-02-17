import { NextRequest, NextResponse } from 'next/server';
import TokenService from '@/lib/tokenService';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';

export interface AuthenticatedRequest extends NextRequest {
  user?: {
    userId: string;
    email: string;
    role: string;
  };
}

export function authMiddleware(requiredRoles?: string[]) {
  return async (request: AuthenticatedRequest) => {
    try {
      // Get refresh token from cookies for authentication
      const refreshToken = request.cookies.get('refreshToken')?.value;

      if (!refreshToken) {
        return NextResponse.json(
          { message: 'Authentication required' },
          { status: 401 }
        );
      }

      // Verify refresh token
      let decoded;
      try {
        decoded = TokenService.verifyRefreshToken(refreshToken);
      } catch (error) {
        return NextResponse.json(
          { message: 'Invalid token' },
          { status: 401 }
        );
      }

      await dbConnect();

      // Find user and check if refresh token exists
      const user = await User.findById(decoded.userId);
      if (!user || !user.refreshTokens.includes(refreshToken)) {
        return NextResponse.json(
          { message: 'Invalid token' },
          { status: 401 }
        );
      }

      // Check if user is active
      if (!user.isActive) {
        return NextResponse.json(
          { message: 'Account is deactivated' },
          { status: 403 }
        );
      }

      // Check role permissions
      if (requiredRoles && !requiredRoles.includes(user.role)) {
        return NextResponse.json(
          { message: 'Insufficient permissions' },
          { status: 403 }
        );
      }

      // Add user info to request
      request.user = {
        userId: user._id.toString(),
        email: user.email,
        role: user.role,
      };

      return null; // Continue to the actual handler
    } catch (error) {
      console.error('Auth middleware error:', error);
      return NextResponse.json(
        { message: 'Internal server error' },
        { status: 500 }
      );
    }
  };
}

// Helper function to create role-based middleware
export const requireAuth = authMiddleware();
export const requireAdmin = authMiddleware(['admin', 'superadmin']);
export const requireSuperAdmin = authMiddleware(['superadmin']);

// Utility function to get current user from request
export async function getCurrentUser(request: NextRequest) {
  try {
    const refreshToken = request.cookies.get('refreshToken')?.value;
    if (!refreshToken) return null;

    const decoded = TokenService.verifyRefreshToken(refreshToken);
    await dbConnect();
    
    const user = await User.findById(decoded.userId);
    if (!user || !user.refreshTokens.includes(refreshToken)) return null;

    return {
      _id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
    };
  } catch (error) {
    return null;
  }
}