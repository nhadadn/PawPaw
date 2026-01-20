import { Request, Response, NextFunction } from 'express';
import { authMiddleware } from './auth.middleware';

export const adminAuthMiddleware = [
  authMiddleware,
  (req: Request, res: Response, next: NextFunction) => {
    if (req.user?.role !== 'admin') {
      return res.status(403).json({ error: 'FORBIDDEN', message: 'Admin access required' });
    }
    next();
  }
];
