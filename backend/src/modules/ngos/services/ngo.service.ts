import { NGO, NgoStatus } from '../models/NGO';
import { Campaign } from '../../campaigns/models/Campaign';
import { Donation, DonationStatus } from '../../donations/models/Donation';
import { AppError } from '../../../core/errors/AppError';

export class NgoService {
  static async register(userId: string, data: any) {
    const existing = await NGO.findOne({
      $or: [{ userId }, { registrationNumber: data.registrationNumber }],
    });
    if (existing) {
      throw new AppError('NGO already registered with this user or registration number', 409, 'NGO_ALREADY_EXISTS');
    }

    return NGO.create({
      ...data,
      userId,
      status: NgoStatus.PENDING,
    });
  }

  static async verifyNgo(id: string, status: string, verificationNotes?: string) {
    const ngo = await NGO.findById(id);
    if (!ngo) throw new AppError('NGO not found', 404, 'NGO_NOT_FOUND');
    ngo.status = status as NgoStatus;
    if (verificationNotes) ngo.verificationNotes = verificationNotes;
    await ngo.save();
    return ngo;
  }

  static async getNgoById(id: string) {
    const ngo = await NGO.findById(id).populate('userId', 'name email profileImage');
    if (!ngo) throw new AppError('NGO not found', 404, 'NGO_NOT_FOUND');
    const obj = ngo.toObject();
    delete (obj as any).documents;
    return obj;
  }

  static async getProfile(id: string) {
    return this.getNgoById(id);
  }

  static async getNgoByUserId(userId: string) {
    const ngo = await NGO.findOne({ userId });
    if (!ngo) throw new AppError('NGO profile not found', 404, 'NGO_NOT_FOUND');
    return ngo;
  }

  static async getMyNgo(userId: string) {
    return this.getNgoByUserId(userId);
  }

  static async listVerifiedNgos(page = 1, limit = 20, search?: string) {
    const query: any = { status: NgoStatus.VERIFIED };
    if (search) {
      query.organizationName = { $regex: search, $options: 'i' };
    }
    const skip = (page - 1) * limit;
    const [ngos, total] = await Promise.all([
      NGO.find(query).select('-documents').populate('userId', 'name profileImage').skip(skip).limit(limit),
      NGO.countDocuments(query),
    ]);
    return { data: ngos, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  static async listPendingNgos() {
    return NGO.find({ status: NgoStatus.PENDING }).populate('userId', 'name email');
  }

  static async getAll(page = 1, limit = 20) {
    return this.listVerifiedNgos(page, limit);
  }

  static async updateProfile(userId: string, data: any) {
    const ngo = await NGO.findOne({ userId });
    if (!ngo) throw new AppError('NGO profile not found', 404, 'NGO_NOT_FOUND');

    const allowedFields = ['description', 'contactPhone', 'address', 'website', 'logoUrl', 'socialLinks'];
    for (const key of allowedFields) {
      if (data[key] !== undefined) {
        (ngo as any)[key] = data[key];
      }
    }
    await ngo.save();
    return ngo;
  }

  static async getNgoDonations(userId: string, page = 1, limit = 20) {
    const ngo = await NGO.findOne({ userId });
    if (!ngo) throw new AppError('NGO profile not found', 404, 'NGO_NOT_FOUND');

    const campaigns = await Campaign.find({ ngoId: ngo._id }).select('_id');
    const campaignIds = campaigns.map((c) => c._id);

    const skip = (page - 1) * limit;
    const query = {
      campaignId: { $in: campaignIds },
      paymentStatus: { $in: [DonationStatus.CONFIRMED, DonationStatus.SUCCESS] },
    };

    const [donations, total] = await Promise.all([
      Donation.find(query)
        .populate('userId', 'name email')
        .populate('campaignId', 'title')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Donation.countDocuments(query),
    ]);

    return { data: donations, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }
}
