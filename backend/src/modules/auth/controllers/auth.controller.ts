import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/auth.service';
import { NGO, NgoStatus } from '../../ngos/models/NGO';
import { UserRole } from '../../users/models/User';

export class AuthController {
  static async register(req: Request, res: Response, next: NextFunction) {
    try {
      const { password, ...rest } = req.body;
      const data = { ...rest, passwordHash: password };
      const result = await AuthService.register(data);
      
      res.status(201).json({
        success: true,
        message: 'Registration successful',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  static async login(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password } = req.body;
      const result = await AuthService.login(email, password);
      
      res.status(200).json({
        success: true,
        message: 'Login successful',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  static async refresh(req: Request, res: Response, next: NextFunction) {
    try {
      const { refreshToken } = req.body;
      const result = await AuthService.refreshToken(refreshToken);
      
      res.status(200).json({
        success: true,
        message: 'Token refreshed',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  static async me(req: Request, res: Response, next: NextFunction) {
    try {
      const rawUser = (req as any).user;
      const user = rawUser.toObject ? rawUser.toObject() : { ...rawUser };
      delete user.passwordHash;

      if (user.role === UserRole.NGO) {
        const ngo = await NGO.findOne({ userId: user._id });
        if (ngo) {
          user.isVerified = ngo.status === NgoStatus.VERIFIED;
          user.ngoStatus = ngo.status;
          user.ngoId = ngo._id;
          user.organizationName = ngo.organizationName;
        } else {
          user.isVerified = false;
        }
      } else if (user.role === UserRole.SUPER_ADMIN) {
        user.isVerified = true;
      }

      res.status(200).json({
        success: true,
        data: {
          user,
        },
      });
    } catch (error) {
      next(error);
    }
  }
}
