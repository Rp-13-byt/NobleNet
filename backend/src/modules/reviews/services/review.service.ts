import { Review } from '../models/Review';
import { Donation, DonationStatus } from '../../donations/models/Donation';
import { VolunteerApplication, ApplicationStatus } from '../../volunteering/models/VolunteerApplication';
import { ItemDonation, ItemDonationStatus } from '../../wishlists/models/ItemDonation';
import { Campaign } from '../../campaigns/models/Campaign';
import { AppError } from '../../../core/errors/AppError';

export class ReviewService {
  /**
   * Server-side eligibility verification:
   * User must have at least one verified interaction with the NGO
   * (successful donation, completed volunteer activity, or confirmed item donation)
   */
  static async checkEligibility(userId: string, ngoId: string): Promise<boolean> {
    const ngoCampaigns = await Campaign.find({ ngoId }).select('_id');
    const campaignIds = ngoCampaigns.map(c => c._id);

    // 1. Monetary Donation check
    const hasDonation = await Donation.exists({
      userId,
      campaignId: { $in: campaignIds },
      paymentStatus: { $in: [DonationStatus.CONFIRMED, DonationStatus.SUCCESS] },
    });
    if (hasDonation) return true;

    // 2. Completed Volunteering check
    const hasVolunteered = await VolunteerApplication.exists({
      userId,
      status: ApplicationStatus.COMPLETED,
    });
    if (hasVolunteered) return true;

    // 3. Item Donation check
    const hasItemDonation = await ItemDonation.exists({
      userId,
      status: { $in: [ItemDonationStatus.CONFIRMED] },
    });
    if (hasItemDonation) return true;

    return false;
  }

  static async createReview(userId: string, ngoId: string, data: { rating: number; comment: string; campaignId?: string }) {
    const isEligible = await this.checkEligibility(userId, ngoId);
    if (!isEligible) {
      throw new AppError(
        'You are not eligible to review this organization. Only verified donors, volunteers, or item contributors may review.',
        403,
        'NOT_ELIGIBLE_TO_REVIEW'
      );
    }

    try {
      const review = await Review.create({
        userId,
        ngoId,
        campaignId: data.campaignId,
        rating: data.rating,
        comment: data.comment,
        verifiedContribution: true,
      });
      return review;
    } catch (err: unknown) {
      if ((err as any).code === 11000) {
        throw new AppError('You have already reviewed this NGO. Use the update endpoint instead.', 409, 'DUPLICATE_REVIEW');
      }
      throw err;
    }
  }

  static async getReviewsByNgo(ngoId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      Review.find({ ngoId }).populate('userId', 'name profileImage').sort({ createdAt: -1 }).skip(skip).limit(limit),
      Review.countDocuments({ ngoId }),
    ]);
    return { data, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  static async updateReview(reviewId: string, userId: string, data: { rating: number; comment: string }) {
    const review = await Review.findOneAndUpdate(
      { _id: reviewId, userId },
      { rating: data.rating, comment: data.comment },
      { new: true, runValidators: true }
    );
    if (!review) throw new AppError('Review not found or unauthorized', 404, 'REVIEW_NOT_FOUND');
    return review;
  }

  static async deleteReview(reviewId: string, userId: string) {
    const result = await Review.findOneAndDelete({ _id: reviewId, userId });
    if (!result) throw new AppError('Review not found or unauthorized', 404, 'REVIEW_NOT_FOUND');
    return { success: true };
  }
}
