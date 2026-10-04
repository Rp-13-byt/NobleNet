import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User, IUser, UserStatus, UserRole } from '../../users/models/User';
import { NGO, NgoStatus } from '../../ngos/models/NGO';
import { AppError } from '../../../core/errors/AppError';
import { env } from '../../../config/env';

export class AuthService {
  private static generateTokens(userId: string, role: string) {
    const payload = { userId, role };
    const accessToken = jwt.sign(payload, env.JWT_ACCESS_SECRET, { expiresIn: '7d' });
    const refreshToken = jwt.sign(payload, env.JWT_REFRESH_SECRET, { expiresIn: '30d' });
    return { accessToken, refreshToken };
  }

  static async register(data: Partial<IUser>) {
    const existingUser = await User.findOne({ email: data.email });
    if (existingUser) {
      throw new AppError('Email already in use', 409, 'EMAIL_EXISTS');
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(data.passwordHash as string, salt);

    const user = await User.create({
      name: data.name,
      email: data.email,
      passwordHash,
      role: data.role || UserRole.USER,
    });

    const { accessToken, refreshToken } = this.generateTokens(user.id, user.role);

    return { user: await this.sanitizeUser(user), accessToken, refreshToken };
  }

  static async login(email: string, password: string) {
    const user = await User.findOne({ email });
    if (!user) {
      throw new AppError('Invalid email or password', 401, 'UNAUTHORIZED');
    }

    if (user.status === UserStatus.SUSPENDED) {
      throw new AppError('Account is suspended', 403, 'ACCOUNT_SUSPENDED');
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      throw new AppError('Invalid email or password', 401, 'UNAUTHORIZED');
    }

    user.lastLoginAt = new Date();
    await user.save();

    const { accessToken, refreshToken } = this.generateTokens(user.id, user.role);

    return { user: await this.sanitizeUser(user), accessToken, refreshToken };
  }

  static async refreshToken(token: string) {
    try {
      const decoded = jwt.verify(token, env.JWT_REFRESH_SECRET) as { userId: string; role: string };
      const user = await User.findById(decoded.userId);
      
      if (!user || user.status === UserStatus.SUSPENDED) {
        throw new Error();
      }

      const tokens = this.generateTokens(user.id, user.role);
      return tokens;
    } catch (error) {
      throw new AppError('Invalid refresh token', 401, 'UNAUTHORIZED');
    }
  }

  static async sanitizeUser(user: IUser) {
    const { passwordHash, ...safeUser } = user.toObject();
    if (user.role === UserRole.NGO) {
      const ngo = await NGO.findOne({ userId: user._id });
      if (ngo) {
        safeUser.isVerified = ngo.status === NgoStatus.VERIFIED;
        safeUser.ngoStatus = ngo.status;
        safeUser.ngoId = ngo._id;
        safeUser.organizationName = ngo.organizationName;
      } else {
        safeUser.isVerified = false;
      }
    } else if (user.role === UserRole.SUPER_ADMIN) {
      safeUser.isVerified = true;
    }
    return safeUser;
  }
}
