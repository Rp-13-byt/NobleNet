import { Campaign, CampaignStatus } from '../models/Campaign';
import { NGO, NgoStatus } from '../../ngos/models/NGO';
import { Donation, DonationStatus } from '../../donations/models/Donation';
import { VolunteerOpportunity } from '../../volunteering/models/VolunteerOpportunity';
import { AppError } from '../../../core/errors/AppError';
import { eventEmitter, AppEvents } from '../../../events/EventEmitter';

export class CampaignService {
  static async createCampaign(userId: string, data: any) {
    const ngo = await NGO.findOne({ userId });
    if (!ngo) throw new AppError('NGO profile not found', 404, 'NGO_NOT_FOUND');

    if (ngo.status !== NgoStatus.VERIFIED) {
      throw new AppError('Only verified NGOs can create campaigns', 403, 'NGO_NOT_VERIFIED');
    }

    const goalAmount = Number(data.goalAmount || data.targetAmount);
    if (!goalAmount || goalAmount <= 0) {
      throw new AppError('A valid target goal amount is required', 400, 'INVALID_GOAL_AMOUNT');
    }

    const images = Array.isArray(data.images) && data.images.length > 0
      ? data.images
      : (data.imageUrl ? [data.imageUrl] : ['https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?q=80&w=800']);

    const startDate = data.startDate ? new Date(data.startDate) : new Date();
    const endDate = data.endDate ? new Date(data.endDate) : (data.deadline ? new Date(data.deadline) : new Date(Date.now() + 60 * 24 * 60 * 60 * 1000));

    const campaign = await Campaign.create({
      title: data.title,
      description: data.description,
      category: data.category || 'General',
      goalAmount,
      images,
      startDate,
      endDate,
      ngoId: ngo._id,
      status: CampaignStatus.ACTIVE,
      raisedAmount: 0,
    });

    eventEmitter.emit(AppEvents.CAMPAIGN_CREATED, campaign);
    return campaign;
  }

  static async create(userId: string, data: any) {
    return this.createCampaign(userId, data);
  }

  static async getCampaign(id: string) {
    const campaign = await Campaign.findById(id).populate('ngoId', 'organizationName description address contactEmail');
    if (!campaign) throw new AppError('Campaign not found', 404, 'CAMPAIGN_NOT_FOUND');
    return campaign;
  }

  static async getById(id: string) {
    return this.getCampaign(id);
  }

  static async listActiveCampaigns(filters: { category?: any; search?: any } = {}) {
    const query: any = { status: CampaignStatus.ACTIVE };
    if (filters.category && filters.category !== 'all') {
      query.category = new RegExp(`^${filters.category}$`, 'i');
    }
    if (filters.search) {
      query.$or = [
        { title: { $regex: filters.search, $options: 'i' } },
        { description: { $regex: filters.search, $options: 'i' } },
      ];
    }
    return Campaign.find(query).populate('ngoId', 'organizationName').sort({ createdAt: -1 });
  }

  static async getAll(filters: { category?: string; search?: string; status?: string; ngoId?: string }, page = 1, limit = 20) {
    const query: any = {};
    query.status = filters.status || CampaignStatus.ACTIVE;
    if (filters.category && filters.category !== 'all') {
      query.category = new RegExp(`^${filters.category}$`, 'i');
    }
    if (filters.ngoId) query.ngoId = filters.ngoId;
    if (filters.search) {
      query.$or = [
        { title: { $regex: filters.search, $options: 'i' } },
        { description: { $regex: filters.search, $options: 'i' } },
      ];
    }

    const skip = (page - 1) * limit;
    const [campaigns, total] = await Promise.all([
      Campaign.find(query).populate('ngoId', 'organizationName status').sort({ createdAt: -1 }).skip(skip).limit(limit),
      Campaign.countDocuments(query),
    ]);

    return { data: campaigns, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  static async updateStatus(id: string, userId: string, status: string, userRole?: string) {
    const campaign = await Campaign.findById(id);
    if (!campaign) throw new AppError('Campaign not found', 404, 'CAMPAIGN_NOT_FOUND');

    if (userRole !== 'SUPER_ADMIN') {
      const ngo = await NGO.findOne({ userId });
      if (!ngo || !campaign.ngoId.equals(ngo._id)) {
        throw new AppError('Forbidden: Not authorized to edit this campaign', 403, 'FORBIDDEN');
      }
    }

    campaign.status = status as CampaignStatus;
    await campaign.save();

    eventEmitter.emit(AppEvents.CAMPAIGN_UPDATED, campaign);
    return campaign;
  }

  static async getCampaignSupporters(campaignId: string, limit = 10) {
    const donations = await Donation.find({
      campaignId,
      paymentStatus: { $in: [DonationStatus.CONFIRMED, DonationStatus.SUCCESS] },
    })
      .populate('userId', 'name')
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    return donations.map((d: any) => ({
      _id: d._id,
      amount: d.amount,
      donorName: d.anonymous ? 'Anonymous Supporter' : d.userId?.name || 'Supporter',
      createdAt: d.createdAt,
    }));
  }

  static async getPublicStats() {
    const [activeCampaigns, donationsAgg, verifiedNgos, totalVolunteers] = await Promise.all([
      Campaign.countDocuments({ status: CampaignStatus.ACTIVE }),
      Donation.aggregate([
        { $match: { paymentStatus: { $in: [DonationStatus.CONFIRMED, DonationStatus.SUCCESS] } } },
        { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } },
      ]),
      NGO.countDocuments({ status: NgoStatus.VERIFIED }),
      VolunteerOpportunity.aggregate([
        { $group: { _id: null, total: { $sum: '$approvedVolunteers' } } },
      ]),
    ]);

    return {
      totalRaised: donationsAgg[0]?.total || 0,
      totalSupporters: donationsAgg[0]?.count || 0,
      activeCampaigns,
      verifiedNgos,
      volunteersEngaged: totalVolunteers[0]?.total || 0,
    };
  }
}
