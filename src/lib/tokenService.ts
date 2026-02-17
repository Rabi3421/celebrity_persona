import jwt from 'jsonwebtoken';
import { IUser } from '@/models/User';

const JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET!;
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET!;

export interface TokenPayload {
  userId: string;
  email: string;
  role: string;
  iat?: number;
  exp?: number;
}

export class TokenService {
  static generateAccessToken(user: IUser): string {
    const payload: TokenPayload = {
      userId: user._id,
      email: user.email,
      role: user.role,
    };

    return jwt.sign(payload, JWT_ACCESS_SECRET, {
      expiresIn: '1h', // 1 hour
    });
  }

  static generateRefreshToken(user: IUser): string {
    const payload: TokenPayload = {
      userId: user._id,
      email: user.email,
      role: user.role,
    };

    return jwt.sign(payload, JWT_REFRESH_SECRET, {
      expiresIn: '30d', // 30 days
    });
  }

  static verifyAccessToken(token: string): TokenPayload {
    return jwt.verify(token, JWT_ACCESS_SECRET) as TokenPayload;
  }

  static verifyRefreshToken(token: string): TokenPayload {
    return jwt.verify(token, JWT_REFRESH_SECRET) as TokenPayload;
  }

  static generateTokenPair(user: IUser) {
    return {
      accessToken: this.generateAccessToken(user),
      refreshToken: this.generateRefreshToken(user),
    };
  }
}

export default TokenService;