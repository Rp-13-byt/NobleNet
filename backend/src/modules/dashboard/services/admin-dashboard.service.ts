import { User, UserRole } from '../../users/models/User';
import { NGO, NgoStatus } from '../../ngos/models/NGO';
import { Campaign, CampaignStatus } from '../../campaigns/models/Campaign';
import { Donation, DonationStatus } from '../../donations/models/Donation';
import { VolunteerApplication } from '../../volunteering/models/VolunteerApplication';
import { ItemDonation } from '../../wishlists/models/ItemDonation';
import { AuditLog } from '../../audit/models/AuditLog';

export class AdminDashboardService {
  static async getDashboard() {
    const [
      totalUsers,
      totalNgos,
      verifiedNgos,
      pendingNgosCount,
      activeCampaigns,
      donationsAgg,
      totalVolunteerApps,
      totalItemDonations,
      pendingNgosList,
      recentAuditLogs,
      recentDonations,
    ] = await Promise.all([
      User.countDocuments(),
      NGO.countDocuments(),
      NGO.countDocuments({ status: NgoStatus.VERIFIED }),
      NGO.countDocuments({ status: { $in: [NgoStatus.PENDING, NgoStatus.UNDER_REVIEW] } }),
      Campaign.countDocuments({ status: CampaignStatus.ACTIVE }),
      Donation.aggregate([
        { $match: { paymentStatus: { $in: [DonationStatus.CONFIRMED, DonationStatus.SUCCESS] } } },
        { $group: { _id: null, totalAmount: { $sum: '$amount' }, count: { $sum: 1 } } },
      ]),
      VolunteerApplication.countDocuments(),
      ItemDonation.countDocuments(),
      NGO.find({ status: { $in: [NgoStatus.PENDING, NgoStatus.UNDER_REVIEW] } })
        .populate('userId', 'name email createdAt')
        .sort({ createdAt: -1 })
        .limit(10),
      AuditLog.find().sort({ timestamp: -1 }).limit(10),
      Donation.find({ paymentStatus: { $in: [DonationStatus.CONFIRMED, DonationStatus.SUCCESS] } })
        .populate('userId', 'name email')
        .populate('campaignId', 'title')
        .sort({ createdAt: -1 })
        .limit(10),
    ]);

    const totalDonationsAmount = donationsAgg[0]?.totalAmount || 0;
    const totalDonationsCount = donationsAgg[0]?.count || 0;

    return {
      summary: {
        totalUsers,
        totalNgos,
        verifiedNgos,
        pendingVerifications: pendingNgosCount,
        activeCampaigns,
        totalFundsRaised: totalDonationsAmount,
        totalSuccessfulDonations: totalDonationsCount,
        volunteerApplications: totalVolunteerApps,
        confirmedItemDonations: totalItemDonations,
      },
      pendingNgosQueue: pendingNgosList,
      recentAuditLogs,
      recentDonations,
    };
  }
}
