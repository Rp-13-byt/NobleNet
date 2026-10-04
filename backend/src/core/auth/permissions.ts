import { Request, Response, NextFunction } from 'express';
import { UserRole } from '../../modules/users/models/User';
import { AppError } from '../errors/AppError';

export enum Permission {
  // User permissions
  USER_PROFILE_SELF = 'USER_PROFILE_SELF',
  USER_DONATIONS_SELF = 'USER_DONATIONS_SELF',
  USER_VOLUNTEER_APPLICATIONS_SELF = 'USER_VOLUNTEER_APPLICATIONS_SELF',
  USER_NOTIFICATIONS_SELF = 'USER_NOTIFICATIONS_SELF',

  // NGO permissions
  NGO_PROFILE_SELF = 'NGO_PROFILE_SELF',
  NGO_CAMPAIGN_MANAGE_OWN = 'NGO_CAMPAIGN_MANAGE_OWN',
  NGO_WISHLIST_MANAGE_OWN = 'NGO_WISHLIST_MANAGE_OWN',
  NGO_VOLUNTEERS_MANAGE_OWN = 'NGO_VOLUNTEERS_MANAGE_OWN',
  NGO_APPLICATIONS_REVIEW_OWN = 'NGO_APPLICATIONS_REVIEW_OWN',
  NGO_DONATIONS_VIEW_OWN = 'NGO_DONATIONS_VIEW_OWN',

  // Super Admin permissions
  ADMIN_USERS_MANAGE = 'ADMIN_USERS_MANAGE',
  ADMIN_NGOS_VERIFY = 'ADMIN_NGOS_VERIFY',
  ADMIN_CAMPAIGNS_MODERATE = 'ADMIN_CAMPAIGNS_MODERATE',
  ADMIN_DONATIONS_VIEW = 'ADMIN_DONATIONS_VIEW',
  ADMIN_REFUNDS_EXECUTE = 'ADMIN_REFUNDS_EXECUTE',
  ADMIN_AUDIT_VIEW = 'ADMIN_AUDIT_VIEW',
}

const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  [UserRole.USER]: [
    Permission.USER_PROFILE_SELF,
    Permission.USER_DONATIONS_SELF,
    Permission.USER_VOLUNTEER_APPLICATIONS_SELF,
    Permission.USER_NOTIFICATIONS_SELF,
  ],
  [UserRole.NGO]: [
    Permission.NGO_PROFILE_SELF,
    Permission.NGO_CAMPAIGN_MANAGE_OWN,
    Permission.NGO_WISHLIST_MANAGE_OWN,
    Permission.NGO_VOLUNTEERS_MANAGE_OWN,
    Permission.NGO_APPLICATIONS_REVIEW_OWN,
    Permission.NGO_DONATIONS_VIEW_OWN,
    Permission.USER_NOTIFICATIONS_SELF,
  ],
  [UserRole.SUPER_ADMIN]: Object.values(Permission),
};

export function hasPermission(role: UserRole, permission: Permission): boolean {
  const permissions = ROLE_PERMISSIONS[role] || [];
  return permissions.includes(permission);
}

export function requirePermission(...requiredPermissions: Permission[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AppError('Unauthorized: Authentication required', 401, 'UNAUTHORIZED'));
    }

    const userRole = req.user.role as UserRole;
    const hasAll = requiredPermissions.every((p) => hasPermission(userRole, p));

    if (!hasAll) {
      return next(new AppError('Forbidden: Insufficient permissions for this resource', 403, 'FORBIDDEN'));
    }

    next();
  };
}
