import { Request, Response, NextFunction } from 'express';
import { DonationService } from '../services/donation.service';
import { PaymentService } from '../../payments/services/payment.service';

export class DonationController {
  static async initiate(req: Request, res: Response, next: NextFunction) {
    try {
      const campaignId = req.params.campaignId || req.body.campaignId;
      const { amount, anonymous } = req.body;
      const idempotencyKey = req.headers['idempotency-key'] as string;
      const result = await DonationService.initiate(req.user!.id, campaignId, amount, anonymous || false, idempotencyKey);
      res.status(201).json({ success: true, message: 'Donation initiated', data: result });
    } catch (e) {
      next(e);
    }
  }

  static async verify(req: Request, res: Response, next: NextFunction) {
    try {
      const { donationId, orderId, paymentId, signature } = req.body;
      const idempotencyKey = req.headers['idempotency-key'] as string;
      const result = await PaymentService.verify(donationId, orderId, paymentId, signature, idempotencyKey);
      res.json({
        success: true,
        message: result.alreadyProcessed ? 'Donation already processed' : 'Donation verified successfully',
        data: result.donation,
      });
    } catch (e) {
      next(e);
    }
  }

  static async getStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await DonationService.getStatus(req.params.id as string, req.user?.id, req.user?.role);
      res.json({ success: true, data: result });
    } catch (e) {
      next(e);
    }
  }

  static async getReceipt(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await DonationService.getReceipt(req.params.id as string, req.user?.id, req.user?.role);
      res.json({ success: true, data: result });
    } catch (e) {
      next(e);
    }
  }

  static async myDonations(req: Request, res: Response, next: NextFunction) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = Math.min(parseInt(req.query.limit as string) || 20, 50);
      const result = await DonationService.getUserDonations(req.user!.id, page, limit);
      res.json({ success: true, ...result });
    } catch (e) {
      next(e);
    }
  }

  static async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const donation = await DonationService.getDonationById(
        req.params.id as string,
        req.user?.id,
        req.user?.role
      );
      res.json({ success: true, data: donation });
    } catch (e) {
      next(e);
    }
  }
}
