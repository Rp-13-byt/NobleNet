import { Donation, DonationStatus } from '../../donations/models/Donation';
import { VolunteerApplication } from '../../volunteering/models/VolunteerApplication';
import { ItemDonation } from '../../wishlists/models/ItemDonation';
import { Notification } from '../../notifications/models/Notification';

export class UserDashboardService {
  static async getDashboard(userId: string) {
    const [donations, volunteerApps, itemDonations, notifications] = await Promise.all([
      Donation.find({ userId })
        .populate('campaignId', 'title category images')
        .sort({ createdAt: -1 }),
      VolunteerApplication.find({ userId })
        .populate({
          path: 'opportunityId',
          populate: { path: 'ngoId', select: 'organizationName address' },
        })
        .sort({ createdAt: -1 }),
      ItemDonation.find({ userId })
        .populate({
          path: 'wishlistItemId',
          select: 'itemName category priority',
        })
        .sort({ createdAt: -1 }),
      Notification.find({ recipientUserId: userId })
        .sort({ createdAt: -1 })
        .limit(10),
    ]);

    const confirmedDonations = donations.filter(
      (d) => d.paymentStatus === DonationStatus.CONFIRMED || (d.paymentStatus as any) === 'SUCCESS'
    );

    const totalDonated = confirmedDonations.reduce((sum, d) => sum + (d.amount || 0), 0);
    const campaignsSet = new Set(confirmedDonations.map((d) => d.campaignId?._id?.toString() || d.campaignId?.toString()));
    const campaignsSupported = campaignsSet.size;

    return {
      summary: {
        totalDonated,
        campaignsSupported,
        volunteerActivities: volunteerApps.length,
        itemsDonated: itemDonations.length,
        unreadNotifications: notifications.filter((n) => !n.read).length,
      },
      donations: donations.slice(0, 10),
      volunteerApplications: volunteerApps.slice(0, 10),
      itemDonations: itemDonations.slice(0, 10),
      recentNotifications: notifications,
    };
  }
}
