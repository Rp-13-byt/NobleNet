import { ImpactReport } from '../models/ImpactReport';
import { NGO } from '../../ngos/models/NGO';
import { AppError } from '../../../core/errors/AppError';

export class ImpactService {
  static async create(userId: string, data: Record<string, unknown>) {
    const ngo = await NGO.findOne({ userId });
    if (!ngo) throw new AppError('NGO profile not found', 404, 'NGO_NOT_FOUND');

    return ImpactReport.create({ ...data, ngoId: ngo._id });
  }

  static async getByNgo(ngoId: string) {
    return ImpactReport.find({ ngoId, published: true }).sort({ createdAt: -1 });
  }

  static async getByCampaign(campaignId: string) {
    return ImpactReport.find({ campaignId, published: true }).sort({ createdAt: -1 });
  }

  static async update(reportId: string, userId: string, data: Record<string, unknown>) {
    const ngo = await NGO.findOne({ userId });
    if (!ngo) throw new AppError('NGO profile not found', 404, 'NGO_NOT_FOUND');

    const report = await ImpactReport.findOneAndUpdate(
      { _id: reportId, ngoId: ngo._id },
      data,
      { new: true }
    );
    if (!report) throw new AppError('Report not found or unauthorized', 404, 'REPORT_NOT_FOUND');
    return report;
  }

  static async delete(reportId: string, userId: string) {
    const ngo = await NGO.findOne({ userId });
    if (!ngo) throw new AppError('NGO profile not found', 404, 'NGO_NOT_FOUND');

    const result = await ImpactReport.findOneAndDelete({ _id: reportId, ngoId: ngo._id });
    if (!result) throw new AppError('Report not found or unauthorized', 404, 'REPORT_NOT_FOUND');
    return { success: true };
  }
}
