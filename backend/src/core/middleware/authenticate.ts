import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AppError } from '../errors/AppError';
import { env } from '../../config/env';
import { User, UserStatus } from '../../modules/users/models/User';

declare global {
  namespace Express {
    interface Request {
      user?: any;
    }
  }
}

export const authenticate = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError('Not authenticated', 401, 'UNAUTHORIZED');
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET) as { userId: string; role: string };

    const user = await User.findById(decoded.userId).select('-passwordHash');
    if (!user) {
      throw new AppError('User not found. Please log in again.', 401, 'USER_NOT_FOUND');
    }

    if (user.status === UserStatus.SUSPENDED) {
      throw new AppError('Account is suspended', 403, 'ACCOUNT_SUSPENDED');
    }

    req.user = user;
    next();
  } catch (error: any) {
    if (error instanceof AppError) {
      return next(error);
    }
    if (error?.name === 'TokenExpiredError') {
      return next(new AppError('Token expired', 401, 'TOKEN_EXPIRED'));
    }
    next(new AppError('Invalid or expired token', 401, 'UNAUTHORIZED'));
  }
};

export const authorize = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return next(new AppError('Forbidden', 403, 'FORBIDDEN'));
    }
    next();
  };
};
