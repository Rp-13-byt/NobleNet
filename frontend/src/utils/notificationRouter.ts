import { Role } from '@/store/authStore';

export interface AppNotification {
  _id: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  data?: Record<string, any>;
}

/**
 * Deterministically resolves a safe in-app route for a notification based on its type,
 * payload, and the recipient's authenticated role.
 *
 * Security: Prevents IDOR and privilege escalation via notifications.
 * - NGOs are NEVER navigated to donor-private user tabs (/me).
 * - Users are NEVER navigated to NGO (/organization) or Admin (/admin) workspaces.
 * - External or arbitrary URLs in notification payloads are ignored.
 */
export function resolveNotificationRoute(notification: AppNotification, role: Role): string {
  const type = notification.type || '';
  const data = notification.data || {};

  switch (role) {
    case 'NGO': {
      if (type.includes('DONATION')) {
        return '/organization?tab=donations';
      }
      if (type.includes('VOLUNTEER')) {
        return '/organization?tab=volunteers';
      }
      if (type.includes('WISHLIST') || type.includes('ITEM')) {
        return '/organization?tab=wishlist';
      }
      if (type.includes('CAMPAIGN')) {
        if (data.campaignId) {
          return `/campaigns/${data.campaignId}`;
        }
        return '/organization?tab=campaigns';
      }
      if (type.includes('NGO') || type.includes('VERIF')) {
        return '/organization';
      }
      return '/organization';
    }

    case 'SUPER_ADMIN': {
      if (type.includes('DONATION')) {
        return '/admin?tab=overview';
      }
      if (type.includes('NGO')) {
        return '/admin?tab=verification';
      }
      if (type.includes('CAMPAIGN')) {
        if (data.campaignId) {
          return `/campaigns/${data.campaignId}`;
        }
        return '/admin?tab=campaigns';
      }
      return '/admin';
    }

    case 'USER':
    default: {
      if (type.includes('DONATION')) {
        if (data.donationId && type === 'DONATION_SUCCESS') {
          return `/donations/${data.donationId}/receipt`;
        }
        return '/me?tab=donations';
      }
      if (type.includes('VOLUNTEER')) {
        return '/me?tab=volunteering';
      }
      if (type.includes('CAMPAIGN') && data.campaignId) {
        return `/campaigns/${data.campaignId}`;
      }
      if (type.includes('WISHLIST')) {
        return '/wishlist';
      }
      return '/me';
    }
  }
}
