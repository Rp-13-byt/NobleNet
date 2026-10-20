import { User, UserStatus } from '../../users/models/User';
import { NGO, NgoStatus } from '../../ngos/models/NGO';
import { Campaign, CampaignStatus } from '../../campaigns/models/Campaign';
import { Donation, DonationStatus } from '../../donations/models/Donation';
import { VolunteerOpportunity } from '../../volunteering/models/VolunteerOpportunity';
import { ItemDonation, ItemDonationStatus } from '../../wishlists/models/ItemDonation';
import { AuditService } from '../../audit/services/audit.service';
import { AppError } from '../../../core/errors/AppError';
import { eventEmitter, AppEvents } from '../../../events/EventEmitter';
import { Payment } from '../../payments/models/Payment';

export class AdminService {
  static async getDashboardStats() {
    const [
      totalUsers,
      totalNgos,
      verifiedNgos,
      pendingNgos,
      activeCampaigns,
      donationsAgg,
      totalVolunteers,
      totalItemsPledged,
    ] = await Promise.all([
      User.countDocuments({ role: 'USER' as any }),
      NGO.countDocuments(),
      NGO.countDocuments({ status: NgoStatus.VERIFIED }),
      NGO.countDocuments({ status: NgoStatus.PENDING }),
      Campaign.countDocuments({ status: CampaignStatus.ACTIVE }),
      Donation.aggregate([
        { $match: { paymentStatus: { $in: [DonationStatus.CONFIRMED, DonationStatus.SUCCESS] } } },
        { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } },
      ]),
      VolunteerOpportunity.aggregate([
        { $group: { _id: null, total: { $sum: '$approvedVolunteers' } } },
      ]),
      ItemDonation.countDocuments({ status: ItemDonationStatus.CONFIRMED }),
    ]);

    return {
      totalUsers,
      totalNgos,
      verifiedNgos,
      pendingNgos,
      activeCampaigns,
      totalDonationsAmount: donationsAgg[0]?.total || 0,
      totalDonationsCount: donationsAgg[0]?.count || 0,
      totalVolunteersEngaged: totalVolunteers[0]?.total || 0,
      totalItemsFulfilled: totalItemsPledged,
      users: { total: totalUsers },
      ngos: { total: totalNgos, pending: pendingNgos, approved: verifiedNgos },
      campaigns: { total: activeCampaigns, active: activeCampaigns },
      donations: { totalAmount: donationsAgg[0]?.total || 0, count: donationsAgg[0]?.count || 0 },
      volunteering: { opportunities: totalVolunteers[0]?.total || 0, applications: totalVolunteers[0]?.total || 0 },
      items: { totalDonations: totalItemsPledged },
    };
  }

  static async getPlatformStats() {
    return this.getDashboardStats();
  }

  static async getUsers(page = 1, limit = 20, role?: string, status?: string) {
    const query: any = {};
    if (role) query.role = role;
    if (status) query.status = status;

    const skip = (page - 1) * limit;
    const [users, total] = await Promise.all([
      User.find(query).select('-passwordHash').skip(skip).limit(limit),
      User.countDocuments(query),
    ]);

    return { data: users, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  static async updateUserStatus(userId: string, status: string, adminId: string) {
    const user = await User.findById(userId);
    if (!user) throw new AppError('User not found', 404, 'USER_NOT_FOUND');
    if (user.role === 'SUPER_ADMIN') throw new AppError('Cannot modify super admin status', 400, 'CANNOT_MODIFY_ADMIN');

    user.status = status as UserStatus;
    await user.save();

    await AuditService.log({
      actorId: adminId,
      actorRole: 'SUPER_ADMIN',
      action: 'USER_STATUS_UPDATED',
      targetType: 'User',
      targetId: user._id.toString(),
      metadata: { newStatus: status },
    });

    eventEmitter.emit(AppEvents.USER_STATUS_CHANGED, {
      userId: user._id,
      status: user.status,
    });

    return user;
  }

  static async getPendingNgos(page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [ngos, total] = await Promise.all([
      NGO.find({ status: NgoStatus.PENDING }).populate('userId', 'name email').skip(skip).limit(limit),
      NGO.countDocuments({ status: NgoStatus.PENDING }),
    ]);
    return { data: ngos, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  static async getAllNgos(page = 1, limit = 20, status?: string, search?: string) {
    const skip = (page - 1) * limit;
    const query: any = {};
    if (status) query.status = status;
    if (search) {
      query.$or = [
        { organizationName: { $regex: search, $options: 'i' } },
        { contactEmail: { $regex: search, $options: 'i' } },
        { registrationNumber: { $regex: search, $options: 'i' } },
      ];
    }
    const [ngos, total] = await Promise.all([
      NGO.find(query).populate('userId', 'name email').sort({ createdAt: -1 }).skip(skip).limit(limit),
      NGO.countDocuments(query),
    ]);
    return { data: ngos, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  static async reviewNgo(ngoId: string, status: string, verificationNotes?: string, adminId?: string) {
    const ngo = await NGO.findById(ngoId);
    if (!ngo) throw new AppError('NGO not found', 404, 'NGO_NOT_FOUND');

    ngo.status = status as NgoStatus;
    if (verificationNotes) ngo.verificationNotes = verificationNotes;
    if (adminId) ngo.reviewedBy = adminId as any;
    ngo.reviewedAt = new Date();
    await ngo.save();

    const isApproved = status === 'APPROVED' || status === NgoStatus.VERIFIED;
    await User.findByIdAndUpdate(ngo.userId, { isVerified: isApproved });

    await AuditService.log({
      actorId: adminId,
      actorRole: 'SUPER_ADMIN',
      action: `NGO_${status}`,
      targetType: 'NGO',
      targetId: ngo._id.toString(),
      metadata: { organizationName: ngo.organizationName, status, verificationNotes },
    });

    if (isApproved) {
      eventEmitter.emit(AppEvents.NGO_VERIFIED, {
        userId: ngo.userId,
        ngoId: ngo._id,
        organizationName: ngo.organizationName,
      });
    } else {
      eventEmitter.emit(AppEvents.NGO_REJECTED, {
        userId: ngo.userId,
        ngoId: ngo._id,
        organizationName: ngo.organizationName,
        notes: verificationNotes,
      });
    }

    return ngo;
  }

  static async verifyNgo(ngoId: string, adminId: string) {
    return this.reviewNgo(ngoId, NgoStatus.VERIFIED, 'Approved by admin', adminId);
  }

  static async rejectNgo(ngoId: string, rejectionReason: string, adminId: string) {
    return this.reviewNgo(ngoId, NgoStatus.REJECTED, rejectionReason, adminId);
  }

  static async suspendNgo(ngoId: string, suspensionReason: string, adminId: string) {
    const ngo = await NGO.findById(ngoId);
    if (!ngo) throw new AppError('NGO not found', 404, 'NGO_NOT_FOUND');

    ngo.status = NgoStatus.SUSPENDED;
    ngo.suspensionReason = suspensionReason;
    await ngo.save();

    await User.findByIdAndUpdate(ngo.userId, { isVerified: false });

    await Campaign.updateMany(
      { ngoId: ngo._id, status: CampaignStatus.ACTIVE },
      { status: CampaignStatus.PAUSED }
    );

    await AuditService.log({
      actorId: adminId,
      actorRole: 'SUPER_ADMIN',
      action: 'NGO_SUSPENDED',
      targetType: 'NGO',
      targetId: ngo._id.toString(),
      metadata: { suspensionReason },
    });

    eventEmitter.emit(AppEvents.NGO_REJECTED, {
      userId: ngo.userId,
      ngoId: ngo._id,
      organizationName: ngo.organizationName,
      notes: suspensionReason,
    });

    return ngo;
  }

  static async getAllDonations(page = 1, limit = 20, status?: string) {
    const skip = (page - 1) * limit;
    const query: any = {};
    if (status) {
      query.paymentStatus = status;
    }
    const [donations, total] = await Promise.all([
      Donation.find(query)
        .populate('userId', 'name email')
        .populate('campaignId', 'title ngoId')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Donation.countDocuments(query),
    ]);

    // Attach payment info if present
    const donationIds = donations.map((d) => d._id);
    const payments = await Payment.find({ donationId: { $in: donationIds } }).lean();
    const paymentMap = new Map(payments.map((p) => [p.donationId.toString(), p]));

    const enriched = donations.map((d) => ({
      ...d,
      payment: paymentMap.get(d._id.toString()) || null,
    }));

    return { data: enriched, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  static async getAllCampaigns(page = 1, limit = 20, status?: string, search?: string) {
    const skip = (page - 1) * limit;
    const query: any = {};
    if (status) query.status = status;
    if (search) query.title = { $regex: search, $options: 'i' };

    const [campaigns, total] = await Promise.all([
      Campaign.find(query)
        .populate('ngoId', 'organizationName contactEmail')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Campaign.countDocuments(query),
    ]);

    return { data: campaigns, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  static async moderateCampaign(campaignId: string, status: string, reason: string, adminId: string) {
    const campaign = await Campaign.findById(campaignId);
    if (!campaign) throw new AppError('Campaign not found', 404, 'CAMPAIGN_NOT_FOUND');

    const previousStatus = campaign.status;
    campaign.status = status as CampaignStatus;
    await campaign.save();

    await AuditService.log({
      actorId: adminId,
      actorRole: 'SUPER_ADMIN',
      action: `CAMPAIGN_MODERATED_${status}`,
      targetType: 'Campaign',
      targetId: campaign._id.toString(),
      metadata: { previousStatus, newStatus: status, reason },
    });

    eventEmitter.emit(AppEvents.CAMPAIGN_UPDATED, campaign);

    return campaign;
  }
}
