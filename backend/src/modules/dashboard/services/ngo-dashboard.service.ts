import { NGO, NgoStatus } from '../../ngos/models/NGO';
import { Campaign, CampaignStatus } from '../../campaigns/models/Campaign';
import { Donation, DonationStatus } from '../../donations/models/Donation';
import { VolunteerOpportunity } from '../../volunteering/models/VolunteerOpportunity';
import { VolunteerApplication } from '../../volunteering/models/VolunteerApplication';
import { Wishlist } from '../../wishlists/models/Wishlist';
import { WishlistItem } from '../../wishlists/models/WishlistItem';
import { ImpactReport } from '../../impact/models/ImpactReport';
import { AppError } from '../../../core/errors/AppError';

export class NGODashboardService {
  static async getDashboard(userId: string) {
    const ngo = await NGO.findOne({ userId });
    if (!ngo) {
      throw new AppError('NGO profile not found for this account', 404, 'NGO_NOT_FOUND');
    }

    // 1. Campaigns
    const campaigns = await Campaign.find({ ngoId: ngo._id }).sort({ createdAt: -1 });
    const campaignIds = campaigns.map((c) => c._id);

    // 2. Confirmed Donations
    const donations = await Donation.find({
      campaignId: { $in: campaignIds },
      paymentStatus: { $in: [DonationStatus.CONFIRMED, DonationStatus.SUCCESS] },
    })
      .populate('userId', 'name email')
      .populate('campaignId', 'title')
      .sort({ createdAt: -1 });

    const totalRaised = donations.reduce((sum, d) => sum + (d.amount || 0), 0);
    const activeCampaigns = campaigns.filter((c) => c.status === CampaignStatus.ACTIVE).length;
    
    // Unique donors
    const donorSet = new Set<string>();
    donations.forEach((d: any) => {
      if (d.userId?._id) donorSet.add(d.userId._id.toString());
      else if (d.userId) donorSet.add(d.userId.toString());
    });
    const supporters = donorSet.size;

    // 3. Volunteer Opportunities & Inquiries
    const opportunities = await VolunteerOpportunity.find({ ngoId: ngo._id });
    const oppIds = opportunities.map((o) => o._id);
    const applications = await VolunteerApplication.find({ opportunityId: { $in: oppIds } })
      .populate('userId', 'name email phone')
      .populate('opportunityId', 'title')
      .sort({ createdAt: -1 });

    const pendingVolunteerApplications = applications.filter((a) => a.status === 'PENDING').length;

    // 4. Wishlists & Fulfillment
    const wishlists = await Wishlist.find({ ngoId: ngo._id });
    const wishlistIds = wishlists.map((w) => w._id);
    const wishlistItems = await WishlistItem.find({ wishlistId: { $in: wishlistIds } });
    
    const totalRequired = wishlistItems.reduce((sum, item) => sum + (item.requiredQuantity || 0), 0);
    const totalFulfilled = wishlistItems.reduce((sum, item) => sum + (item.fulfilledQuantity || 0), 0);
    const wishlistFulfillment = totalRequired > 0 ? Math.min(100, Math.round((totalFulfilled / totalRequired) * 100)) : 100;

    // 5. Impact Reports
    const impactReports = await ImpactReport.find({ ngoId: ngo._id }).sort({ createdAt: -1 });

    // 6. Actionable "Needs Attention" List
    const needsAttention: Array<{ type: string; title: string; count?: number; link: string }> = [];
    if (ngo.status !== NgoStatus.VERIFIED) {
      needsAttention.push({
        type: 'VERIFICATION',
        title: 'Account Verification Pending with Trust & Safety Team',
        link: '/organization?tab=overview',
      });
    }
    if (pendingVolunteerApplications > 0) {
      needsAttention.push({
        type: 'VOLUNTEER_APPLICATIONS',
        title: `${pendingVolunteerApplications} Volunteer application(s) awaiting review`,
        count: pendingVolunteerApplications,
        link: '/organization?tab=volunteers',
      });
    }
    const draftCampaigns = campaigns.filter((c) => c.status === CampaignStatus.DRAFT).length;
    if (draftCampaigns > 0) {
      needsAttention.push({
        type: 'CAMPAIGNS',
        title: `${draftCampaigns} Draft campaign(s) ready to publish`,
        count: draftCampaigns,
        link: '/organization?tab=campaigns',
      });
    }

    return {
      summary: {
        totalRaised,
        activeCampaigns,
        supporters,
        pendingVolunteerApplications,
        wishlistFulfillment,
        isVerified: ngo.status === NgoStatus.VERIFIED,
      },
      ngo: {
        id: ngo._id,
        organizationName: ngo.organizationName,
        status: ngo.status,
        contactEmail: ngo.contactEmail,
        contactPhone: ngo.contactPhone,
        address: ngo.address,
      },
      campaigns: campaigns.map((c) => ({
        id: c._id,
        _id: c._id,
        title: c.title,
        status: c.status,
        goalAmount: c.goalAmount,
        targetAmount: c.goalAmount,
        raisedAmount: c.raisedAmount,
        category: c.category,
        images: c.images,
        imageUrl: c.images?.[0] || '',
        createdAt: c.createdAt,
      })),
      recentDonations: donations.slice(0, 10).map((d: any) => ({
        id: d._id,
        amount: d.amount,
        donorName: d.anonymous ? 'Anonymous' : d.userId?.name || 'Supporter',
        campaignTitle: d.campaignId?.title || 'Fundraiser',
        createdAt: d.createdAt,
      })),
      pendingApplications: applications.filter((a) => a.status === 'PENDING'),
      wishlistSummary: wishlistItems,
      impactSummary: {
        totalReports: impactReports.length,
        reports: impactReports.slice(0, 5),
      },
      needsAttention,
    };
  }
}
