import crypto from 'crypto';
import mongoose from 'mongoose';
import { Donation, DonationStatus } from '../models/Donation';
import { Receipt, ReceiptStatus } from '../models/Receipt';
import { Payment, PaymentStatus } from '../../payments/models/Payment';
import { Campaign } from '../../campaigns/models/Campaign';
import { NGO } from '../../ngos/models/NGO';
import { AppError } from '../../../core/errors/AppError';
import { getPaymentProvider } from '../../../config/payment';
import { PaymentService } from '../../payments/services/payment.service';
import { IdempotencyKey } from '../../payments/models/IdempotencyKey';

export class DonationService {
  /**
   * Initiate a donation intent.
   * Enforces minimum amount, campaign status, and scoped idempotency.
   */
  static async initiate(
    userId: string,
    campaignId: string,
    amount: number,
    anonymous = false,
    idempotencyKey?: string
  ) {
    const campaign = await Campaign.findById(campaignId);
    if (!campaign) throw new AppError('Campaign not found', 404, 'CAMPAIGN_NOT_FOUND');
    if (campaign.status !== 'ACTIVE' && (campaign as any).status !== 'Active') {
      throw new AppError('Campaign is not currently active for donations', 400, 'CAMPAIGN_NOT_ACTIVE');
    }
    if (amount < 1) throw new AppError('Donation amount must be at least ₹1', 400, 'INVALID_AMOUNT');

    // Scoped client idempotency check
    if (idempotencyKey) {
      const existingKey = await IdempotencyKey.findOne({
        key: idempotencyKey,
        userId: new mongoose.Types.ObjectId(userId),
        endpoint: '/api/v1/campaigns/donate',
      });
      if (existingKey) {
        return existingKey.responseData;
      }
    }

    const txRef = `txn_${crypto.randomBytes(12).toString('hex')}`;

    const donation = await Donation.create({
      userId,
      campaignId,
      amount,
      currency: 'INR',
      paymentStatus: DonationStatus.PENDING,
      transactionReference: txRef,
      anonymous,
      idempotencyKey,
    });

    const responseData = {
      donationId: donation._id.toString(),
      campaignId: campaign._id.toString(),
      campaignTitle: campaign.title,
      amount: donation.amount,
      currency: donation.currency,
      status: donation.paymentStatus,
      transactionReference: txRef,
    };

    if (idempotencyKey) {
      await IdempotencyKey.create({
        key: idempotencyKey,
        userId: new mongoose.Types.ObjectId(userId),
        endpoint: '/api/v1/campaigns/donate',
        responseStatus: 201,
        responseData,
      }).catch(() => {});
    }

    return responseData;
  }

  /**
   * Comprehensive Status Recovery Endpoint.
   * Handles browser refreshes, lost callbacks, delayed webhooks, and gateway reconciliation.
   */
  static async getStatus(id: string, userId?: string, role?: string) {
    const donation = await Donation.findById(id).populate('campaignId', 'title ngoId');
    if (!donation) throw new AppError('Donation not found', 404, 'DONATION_NOT_FOUND');

    // Authorization: Super Admin, donor owner, or owning NGO
    if (role !== 'SUPER_ADMIN') {
      const isDonor = userId && donation.userId && donation.userId.equals(userId);
      let isCampaignOwnerNgo = false;
      if (role === 'NGO' && userId) {
        const ngo = await NGO.findOne({ userId });
        const campaign = donation.campaignId as any;
        if (ngo && campaign && campaign.ngoId && (campaign.ngoId.equals?.(ngo._id) || campaign.ngoId.toString() === ngo._id.toString())) {
          isCampaignOwnerNgo = true;
        }
      }
      if (!isDonor && !isCampaignOwnerNgo) {
        throw new AppError('Forbidden: Cannot view another user donation status', 403, 'FORBIDDEN');
      }
    }

    let payment = await Payment.findOne({ donationId: donation._id });

    // Lazy Order Expiration Check (30 minutes)
    if (
      payment &&
      (payment.status === PaymentStatus.CREATED ||
        payment.status === PaymentStatus.ORDER_CREATED ||
        payment.status === PaymentStatus.PENDING)
    ) {
      const ageMs = Date.now() - payment.createdAt.getTime();
      if (ageMs > 30 * 60 * 1000) {
        payment.status = PaymentStatus.EXPIRED;
        payment.failureReason = 'Order window expired';
        await payment.save();

        donation.paymentStatus = DonationStatus.FAILED;
        donation.failureReason = 'Order window expired';
        await donation.save();
      } else if (ageMs > 10000) {
        // Status Recovery / Reconciliation with gateway if still pending past 10 seconds
        const provider = getPaymentProvider();
        const gatewayPayment = await provider.fetchPayment(payment.paymentId || payment.orderId).catch(() => null);
        if (gatewayPayment && gatewayPayment.status === 'captured') {
          // Reconcile and confirm payment automatically!
          await PaymentService.verify(
            donation._id.toString(),
            payment.orderId,
            gatewayPayment.id || payment.paymentId || `pay_recon_${payment.orderId}`,
            'reconciled_from_gateway'
          ).catch((e) => console.warn('[STATUS] Auto-reconciliation notice:', e.message));

          // Reload fresh documents
          payment = await Payment.findOne({ donationId: donation._id });
        }
      }
    }

    const receipt = await Receipt.findOne({ donationId: donation._id });

    return {
      donation: {
        id: donation._id.toString(),
        status: donation.paymentStatus,
        amount: donation.amount,
        currency: donation.currency,
        campaignTitle: (donation.campaignId as any)?.title || 'Noble Cause',
        createdAt: donation.createdAt,
      },
      payment: {
        id: payment?._id.toString(),
        status: payment?.status || 'UNKNOWN',
        gateway: payment?.gateway || 'unknown',
        orderId: payment?.orderId,
        paymentId: payment?.paymentId,
        refundedAmount: payment?.refundedAmount || 0,
        paidAt: payment?.paidAt,
        failureReason: payment?.failureReason,
      },
      receipt: {
        available: !!receipt,
        id: receipt?._id.toString(),
        receiptNumber: receipt?.receiptNumber,
      },
    };
  }

  static async getReceipt(id: string, userId?: string, role?: string) {
    const donation = await Donation.findById(id).populate('campaignId');
    if (!donation) throw new AppError('Donation not found', 404, 'DONATION_NOT_FOUND');

    if (role !== 'SUPER_ADMIN' && userId && donation.userId && !donation.userId.equals(userId)) {
      throw new AppError('Forbidden: Cannot access this receipt', 403, 'FORBIDDEN');
    }

    if (donation.paymentStatus !== DonationStatus.CONFIRMED && (donation.paymentStatus as any) !== 'SUCCESS') {
      throw new AppError('Receipt is only available for confirmed donations', 400, 'RECEIPT_NOT_AVAILABLE');
    }

    const receipt = await Receipt.findOne({ donationId: donation._id });
    if (!receipt) {
      throw new AppError('Receipt record not found', 404, 'RECEIPT_NOT_FOUND');
    }

    const payment = await Payment.findOne({ donationId: donation._id });

    return {
      receiptNumber: receipt.receiptNumber,
      donationId: donation._id,
      donorName: anonymousToName(donation.anonymous),
      amount: donation.amount,
      currency: donation.currency,
      campaignTitle: (donation.campaignId as any)?.title || 'General Relief Fund',
      paymentId: payment?.paymentId || payment?.orderId,
      gateway: payment?.gateway,
      issuedAt: receipt.generatedAt || receipt.createdAt,
      taxExemptSection: 'Section 80G',
    };
  }

  static async getUserDonations(userId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [donations, total] = await Promise.all([
      Donation.find({ userId }).populate('campaignId', 'title').sort({ createdAt: -1 }).skip(skip).limit(limit),
      Donation.countDocuments({ userId }),
    ]);
    return { data: donations, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  static async getDonationById(id: string, userId?: string, role?: string) {
    const donation = await Donation.findById(id).populate('campaignId', 'title ngoId');
    if (!donation) throw new AppError('Donation not found', 404, 'DONATION_NOT_FOUND');

    if (role !== 'SUPER_ADMIN') {
      const isDonor = userId && donation.userId && donation.userId.equals(userId);
      let isCampaignOwnerNgo = false;
      if (role === 'NGO' && userId) {
        const ngo = await NGO.findOne({ userId });
        const campaign = donation.campaignId as any;
        if (ngo && campaign && campaign.ngoId && (campaign.ngoId.equals?.(ngo._id) || campaign.ngoId.toString() === ngo._id.toString())) {
          isCampaignOwnerNgo = true;
        }
      }
      if (!isDonor && !isCampaignOwnerNgo) {
        throw new AppError('Forbidden: Not authorized to access this donation record', 403, 'FORBIDDEN');
      }
    }

    return donation;
  }
}

function anonymousToName(isAnon: boolean): string {
  return isAnon ? 'Anonymous Supporter' : 'Noble Supporter';
}
