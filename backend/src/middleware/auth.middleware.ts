import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
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
    return res.status(401).json({ error: 'UNAUTHORIZED', message: 'Invalid token' });
  }
};
