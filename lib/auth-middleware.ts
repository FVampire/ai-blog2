import { NextApiRequest, NextApiResponse } from 'next';

import { verifyToken, JWTPayload } from './jwt';

export interface AuthenticatedRequest extends NextApiRequest {
  user?: JWTPayload;
}

export const authMiddleware = (
  handler: (req: AuthenticatedRequest, res: NextApiResponse) => Promise<void>
) => {
  return async (req: AuthenticatedRequest, res: NextApiResponse) => {
    try {
      // Get token from Authorization header
      const authHeader = req.headers.authorization;
      console.log('🔐 [Auth] Authorization header:', authHeader ? 'Present' : 'Missing');

      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        console.log('❌ [Auth] No valid Bearer token provided');
        return res.status(401).json({
          success: false,
          message: '未提供认证令牌',
        });
      }

      const token = authHeader.substring(7); // Remove 'Bearer ' prefix
      console.log('🔐 [Auth] Token length:', token.length);

      // Verify token
      const decoded = verifyToken(token);

      if (!decoded) {
        console.log('❌ [Auth] Token verification failed');
        return res.status(401).json({
          success: false,
          message: '无效或过期的令牌',
        });
      }

      console.log('✅ [Auth] Token verified for user:', decoded.username);

      // Attach user info to request
      req.user = decoded;

      // Call the actual handler
      return handler(req, res);
    } catch (error) {
      console.error('Auth middleware error:', error);
      return res.status(500).json({
        success: false,
        message: '服务器错误',
      });
    }
  };
};

// Role-based access control middleware
export const requireRole = (allowedRoles: string[]) => {
  return (handler: (req: AuthenticatedRequest, res: NextApiResponse) => Promise<void>) => {
    return authMiddleware(async (req: AuthenticatedRequest, res: NextApiResponse) => {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: '未认证',
        });
      }

      if (!allowedRoles.includes(req.user.role)) {
        return res.status(403).json({
          success: false,
          message: '权限不足',
        });
      }

      return handler(req, res);
    });
  };
};
