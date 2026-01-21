import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  // Allow bypassing auth in test environment
  if (process.env.NODE_ENV === 'test') {
    const testRole = req.headers['x-test-role'] as string || 'user';
    req.user = {
      id: 'user-123',
      email: 'test@example.com',
      role: testRole
    };
    return next();
  }

  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    // console.log('[AuthMiddleware] Missing or invalid auth header:', authHeader);
    return res.status(401).json({ error: 'UNAUTHORIZED', message: 'Missing or invalid token' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const secret = process.env.JWT_SECRET || 'changeme_jwt_secret';
    const decoded = jwt.verify(token, secret) as {
      id?: string;
      user_id?: string;
      sub?: string;
      email?: string;
      role?: string;
    };
    req.user = {
      id: decoded.id || decoded.user_id || decoded.sub || '',
      email: decoded.email || '',
      role: decoded.role || ''
    };
    next();
  } catch (err) {
    console.log('[AuthMiddleware] Token verification failed:', err);
    return res.status(401).json({ error: 'UNAUTHORIZED', message: 'Invalid token' });
  }
};

export const optionalAuthMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return next();
  }

  const token = authHeader.split(' ')[1];
  try {
    const secret = process.env.JWT_SECRET || 'changeme_jwt_secret';
    const decoded = jwt.verify(token, secret) as {
      id?: string;
      user_id?: string;
      sub?: string;
      email?: string;
      role?: string;
    };
    req.user = {
      id: decoded.id || decoded.user_id || decoded.sub || '',
      email: decoded.email || '',
      role: decoded.role || ''
    };
    next();
  } catch (err) {
    // If token is invalid, just proceed as anonymous? 
    // Or return 401? Usually better to ignore bad token for optional auth, or return 401.
    // Let's just ignore and treat as anonymous to avoid blocking checkout if token expired.
    console.log('[OptionalAuthMiddleware] Token verification failed, proceeding as guest:', err);
    next();
  }
};
