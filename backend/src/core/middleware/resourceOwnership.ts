import { Request, Response, NextFunction } from 'express';
import { AppError } from '../errors/AppError';
import { Campaign } from '../../modules/campaigns/models/Campaign';
import { NGO } from '../../modules/ngos/models/NGO';
import { Donation } from '../../modules/donations/models/Donation';

/**
 * Ensures an NGO user only mutates campaigns that their verified NGO profile owns.
 * SUPER_ADMIN is always permitted.
 */
export const authorizeCampaignOwner = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) return next(new AppError('Unauthorized', 401, 'UNAUTHORIZED'));
    if (req.user.role === 'SUPER_ADMIN') return next();

    const campaignId = req.params.id || req.params.campaignId;
    if (!campaignId) return next(new AppError('Campaign ID required', 400, 'BAD_REQUEST'));

    const campaign = await Campaign.findById(campaignId);
    if (!campaign) return next(new AppError('Campaign not found', 404, 'CAMPAIGN_NOT_FOUND'));

    const ngo = await NGO.findOne({ userId: req.user._id || req.user.id });
    if (!ngo || !campaign.ngoId.equals(ngo._id)) {
      return next(new AppError('Forbidden: You do not own this campaign', 403, 'FORBIDDEN'));
    }

    (req as any).campaign = campaign;
    (req as any).ngo = ngo;
    next();
  } catch (err) {
    next(err);
  }
};

/**
 * Ensures users only view their own receipts/private donation records.
 * SUPER_ADMIN is always permitted.
 */
export const authorizeDonationViewer = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) return next(new AppError('Unauthorized', 401, 'UNAUTHORIZED'));
    if (req.user.role === 'SUPER_ADMIN') return next();

    const donationId = req.params.id || req.params.donationId;
    if (!donationId) return next(new AppError('Donation ID required', 400, 'BAD_REQUEST'));

    const donation = await Donation.findById(donationId);
    if (!donation) return next(new AppError('Donation not found', 404, 'DONATION_NOT_FOUND'));

    if (donation.userId && !donation.userId.equals(req.user._id || req.user.id)) {
      return next(new AppError('Forbidden: Cannot access another user donation', 403, 'FORBIDDEN'));
    }

    (req as any).donation = donation;
    next();
  } catch (err) {
    next(err);
  }
};
