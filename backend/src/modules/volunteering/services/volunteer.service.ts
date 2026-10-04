import { VolunteerOpportunity, OpportunityStatus } from '../models/VolunteerOpportunity';
import { VolunteerApplication, ApplicationStatus } from '../models/VolunteerApplication';
import { NGO, NgoStatus } from '../../ngos/models/NGO';
import { AppError } from '../../../core/errors/AppError';
import { eventEmitter, AppEvents } from '../../../events/EventEmitter';

export class VolunteerService {
  static async createOpportunity(userId: string, data: any) {
    const ngo = await NGO.findOne({ userId });
    if (!ngo) throw new AppError('NGO profile not found', 404, 'NGO_NOT_FOUND');

    if (ngo.status !== NgoStatus.VERIFIED) {
      throw new AppError('Only verified NGOs can create volunteer opportunities', 403, 'NGO_NOT_VERIFIED');
    }

    return VolunteerOpportunity.create({
      ...data,
      ngoId: ngo._id,
      approvedVolunteers: 0,
    });
  }

  static async getOpportunities(filters: Record<string, any> = {}, page = 1, limit = 20) {
    const query: any = { status: OpportunityStatus.OPEN };
    if (filters.category) query.category = new RegExp(`^${filters.category}$`, 'i');
    if (filters.location) query.location = { $regex: filters.location, $options: 'i' };

    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      VolunteerOpportunity.find(query).populate('ngoId', 'organizationName').sort({ eventDate: 1 }).skip(skip).limit(limit),
      VolunteerOpportunity.countDocuments(query),
    ]);
    return { data, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  static async getOpportunityById(id: string) {
    const opp = await VolunteerOpportunity.findById(id).populate('ngoId', 'organizationName description contactEmail');
    if (!opp) throw new AppError('Opportunity not found', 404, 'OPPORTUNITY_NOT_FOUND');
    return opp;
  }

  static async apply(userId: string, opportunityId: string, data: any) {
    const opp = await VolunteerOpportunity.findById(opportunityId);
    if (!opp) throw new AppError('Opportunity not found', 404, 'OPPORTUNITY_NOT_FOUND');
    if (opp.status !== OpportunityStatus.OPEN) throw new AppError('Opportunity is not open for applications', 400, 'OPPORTUNITY_CLOSED');

    try {
      const app = await VolunteerApplication.create({
        opportunityId,
        userId,
        ...data,
        status: ApplicationStatus.PENDING,
      });

      eventEmitter.emit(AppEvents.VOLUNTEER_APPLIED, {
        applicationId: app._id,
        opportunityId: opp._id,
        opportunityTitle: opp.title,
        ngoId: opp.ngoId,
        applicantUserId: userId,
      });

      return app;
    } catch (err: any) {
      if (err.code === 11000) {
        throw new AppError('You have already applied for this volunteer opportunity', 409, 'DUPLICATE_APPLICATION');
      }
      throw err;
    }
  }

  static async getUserApplications(userId: string) {
    return VolunteerApplication.find({ userId }).populate('opportunityId').sort({ createdAt: -1 });
  }

  static async withdrawApplication(applicationId: string, userId: string) {
    const app = await VolunteerApplication.findOne({ _id: applicationId, userId });
    if (!app) throw new AppError('Application not found', 404, 'APPLICATION_NOT_FOUND');
    app.status = ApplicationStatus.WITHDRAWN;
    await app.save();
    return app;
  }

  static async getApplicationsForNgo(userId: string) {
    const ngo = await NGO.findOne({ userId });
    if (!ngo) throw new AppError('NGO not found', 404, 'NGO_NOT_FOUND');

    const opps = await VolunteerOpportunity.find({ ngoId: ngo._id }).select('_id');
    const oppIds = opps.map(o => o._id);

    return VolunteerApplication.find({ opportunityId: { $in: oppIds } })
      .populate('userId', 'name email phone profileImage')
      .populate('opportunityId', 'title eventDate')
      .sort({ createdAt: -1 });
  }

  static async approveApplication(applicationId: string, userId: string) {
    const app = await VolunteerApplication.findById(applicationId).populate('opportunityId');
    if (!app) throw new AppError('Application not found', 404, 'APPLICATION_NOT_FOUND');

    const ngo = await NGO.findOne({ userId });
    const opp = app.opportunityId as any;
    if (!ngo || !opp.ngoId.equals(ngo._id)) {
      throw new AppError('Forbidden: Not authorized to review this application', 403, 'FORBIDDEN');
    }

    app.status = ApplicationStatus.APPROVED;
    app.reviewedAt = new Date();
    await app.save();

    await VolunteerOpportunity.findByIdAndUpdate(opp._id, {
      $inc: { approvedVolunteers: 1 },
    });

    eventEmitter.emit(AppEvents.VOLUNTEER_APPROVED, {
      userId: app.userId,
      applicationId: app._id,
      opportunityId: opp._id,
      opportunityTitle: opp.title,
    });

    return app;
  }

  static async rejectApplication(applicationId: string, userId: string) {
    const app = await VolunteerApplication.findById(applicationId).populate('opportunityId');
    if (!app) throw new AppError('Application not found', 404, 'APPLICATION_NOT_FOUND');

    const ngo = await NGO.findOne({ userId });
    const opp = app.opportunityId as any;
    if (!ngo || !opp.ngoId.equals(ngo._id)) {
      throw new AppError('Forbidden: Not authorized to review this application', 403, 'FORBIDDEN');
    }

    app.status = ApplicationStatus.REJECTED;
    app.reviewedAt = new Date();
    await app.save();

    eventEmitter.emit(AppEvents.VOLUNTEER_REJECTED, {
      userId: app.userId,
      applicationId: app._id,
      opportunityId: opp._id,
      opportunityTitle: opp.title,
    });

    return app;
  }

  static async getApplicationById(applicationId: string, userId: string, userRole: string) {
    const app = await VolunteerApplication.findById(applicationId)
      .populate('opportunityId')
      .populate('userId', 'name email phone profileImage');
    if (!app) throw new AppError('Volunteer application not found', 404, 'APPLICATION_NOT_FOUND');

    if (userRole !== 'SUPER_ADMIN') {
      const isApplicant = app.userId && (app.userId as any)._id?.equals?.(userId) || (app.userId as any).equals?.(userId);
      let isOrganizingNgo = false;
      if (userRole === 'NGO') {
        const ngo = await NGO.findOne({ userId });
        const opp = app.opportunityId as any;
        if (ngo && opp && opp.ngoId && (opp.ngoId.equals?.(ngo._id) || opp.ngoId.toString() === ngo._id.toString())) {
          isOrganizingNgo = true;
        }
      }
      if (!isApplicant && !isOrganizingNgo) {
        throw new AppError('Forbidden: Not authorized to access this volunteer application', 403, 'FORBIDDEN');
      }
    }

    return app;
  }
}
