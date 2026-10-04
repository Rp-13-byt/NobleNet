import mongoose from 'mongoose';
import crypto from 'crypto';
import { Payment, PaymentStatus } from '../models/Payment';
import { WebhookEvent, WebhookEventStatus } from '../models/WebhookEvent';
import { IdempotencyKey } from '../models/IdempotencyKey';
import { Donation, DonationStatus } from '../../donations/models/Donation';
import { Receipt, ReceiptStatus } from '../../donations/models/Receipt';
import { Campaign } from '../../campaigns/models/Campaign';
import { OutboxEvent, OutboxStatus } from '../../../events/models/OutboxEvent';
import { getPaymentProvider } from '../../../config/payment';
import { AppError } from '../../../core/errors/AppError';
import { AuditService } from '../../audit/services/audit.service';
import { eventEmitter, AppEvents } from '../../../events/EventEmitter';
import { withTransaction } from '../../../core/database/transaction';

const ORDER_EXPIRATION_MS = 30 * 60 * 1000; // 30 minutes

export class PaymentService {
  /**
   * Step 1: Create gateway order from persisted server-side donation record.
   * Strict amount integrity: amount comes strictly from DB donation, not frontend.
   */
  static async createOrder(donationId: string, idempotencyKey?: string, userId?: string) {
    const donation = await Donation.findById(donationId);
    if (!donation) {
      throw new AppError('Donation record not found', 404, 'DONATION_NOT_FOUND');
    }

    if (userId && donation.userId && !donation.userId.equals(userId)) {
      throw new AppError('Forbidden: Cannot create order for another user donation', 403, 'FORBIDDEN');
    }

    if (donation.paymentStatus !== DonationStatus.PENDING) {
      throw new AppError(`Cannot create order for donation in ${donation.paymentStatus} status`, 400, 'INVALID_DONATION_STATE');
    }

    // Check if an order already exists for this donation
    let payment = await Payment.findOne({ donationId: donation._id });

    // Client idempotency check
    if (idempotencyKey) {
      const existingKey = await IdempotencyKey.findOne({
        key: idempotencyKey,
        ...(userId ? { userId: new mongoose.Types.ObjectId(userId) } : {}),
        endpoint: '/api/v1/payments/order',
      });
      if (existingKey) {
        return existingKey.responseData;
      }
    }

    // If order already created and not expired, return existing order details
    if (payment && payment.status === PaymentStatus.ORDER_CREATED && payment.expiresAt && payment.expiresAt.getTime() > Date.now()) {
      const responseData = {
        donationId: donation._id.toString(),
        orderId: payment.orderId,
        amount: payment.amount,
        amountInPaise: Math.round(payment.amount * 100),
        currency: payment.currency,
        gateway: payment.gateway,
      };
      return responseData;
    }

    const provider = getPaymentProvider();
    const receiptRef = `rcpt_${donation._id.toString().slice(-8)}_${Date.now().toString().slice(-6)}`;
    
    // Server computes amount strictly from donation record in INR and paise
    const orderResult = await provider.createOrder(donation.amount, donation.currency || 'INR', receiptRef);
    const expiresAt = new Date(Date.now() + ORDER_EXPIRATION_MS);

    if (payment) {
      payment.orderId = orderResult.orderId;
      payment.status = PaymentStatus.ORDER_CREATED;
      payment.gateway = orderResult.gateway;
      payment.amount = donation.amount;
      payment.currency = donation.currency || 'INR';
      payment.expiresAt = expiresAt;
      if (idempotencyKey) payment.idempotencyKey = idempotencyKey;
      await payment.save();
    } else {
      payment = await Payment.create({
        donationId: donation._id,
        gateway: orderResult.gateway,
        orderId: orderResult.orderId,
        amount: donation.amount,
        currency: donation.currency || 'INR',
        status: PaymentStatus.ORDER_CREATED,
        expiresAt,
        idempotencyKey,
      });
    }

    const responseData = {
      donationId: donation._id.toString(),
      orderId: orderResult.orderId,
      amount: orderResult.amount,
      amountInPaise: orderResult.amountInPaise,
      currency: orderResult.currency,
      gateway: orderResult.gateway,
      keyId: orderResult.keyId,
    };

    // Store idempotency response if key provided
    if (idempotencyKey) {
      await IdempotencyKey.create({
        key: idempotencyKey,
        ...(userId ? { userId: new mongoose.Types.ObjectId(userId) } : {}),
        endpoint: '/api/v1/payments/order',
        responseStatus: 200,
        responseData,
      }).catch(() => {});
    }

    return responseData;
  }

  /**
   * Step 2: Verify payment signature and atomically capture payment.
   * Concurrency-safe: uses conditional findOneAndUpdate with status guard to prevent double-counting.
   */
  static async verify(
    donationId: string,
    orderId: string,
    paymentId: string,
    signature: string,
    idempotencyKey?: string,
    clientAmountPaise?: number
  ) {
    const provider = getPaymentProvider();

    // Query payment record
    const query: any = { orderId };
    if (donationId && mongoose.Types.ObjectId.isValid(donationId)) {
      query.$or = [{ orderId }, { donationId: new mongoose.Types.ObjectId(donationId) }];
      delete query.orderId;
    }

    const payment = await Payment.findOne(query);
    if (!payment) {
      throw new AppError('Payment order not found', 404, 'PAYMENT_NOT_FOUND');
    }

    // Verify order ID matches server-persisted order ID
    if (orderId && payment.orderId !== orderId) {
      throw new AppError('Order ID mismatch: untrusted replacement supplied', 400, 'ORDER_MISMATCH');
    }

    // Validate amount in paise if provided
    if (clientAmountPaise !== undefined) {
      const expectedPaise = Math.round(payment.amount * 100);
      if (clientAmountPaise !== expectedPaise) {
        throw new AppError(`Amount mismatch: expected ${expectedPaise} paise, received ${clientAmountPaise}`, 400, 'AMOUNT_MISMATCH');
      }
    }

    // Idempotency: if already CAPTURED, return gracefully
    if (payment.status === PaymentStatus.CAPTURED) {
      const donation = await Donation.findById(payment.donationId);
      const receipt = await Receipt.findOne({ donationId: payment.donationId });
      return { donation, receipt, payment, alreadyProcessed: true };
    }

    // Verify HMAC-SHA256 signature
    const isValid = await provider.verifyPayment({
      orderId: payment.orderId,
      paymentId,
      signature,
      amountInPaise: Math.round(payment.amount * 100),
    });

    if (!isValid) {
      payment.status = PaymentStatus.FAILED;
      payment.failureReason = 'Invalid payment cryptographic signature';
      await payment.save();

      await Donation.findByIdAndUpdate(payment.donationId, {
        paymentStatus: DonationStatus.FAILED,
        failureReason: 'Invalid signature',
      });
      throw new AppError('Payment verification failed: invalid signature', 400, 'PAYMENT_VERIFICATION_FAILED');
    }

    // Atomic Multi-Document Transaction with Status Guard
    return await withTransaction(async (session) => {
      // Conditional update: only transition if still in allowed pre-capture states
      const updatedPayment = await Payment.findOneAndUpdate(
        {
          _id: payment._id,
          status: {
            $in: [
              PaymentStatus.CREATED,
              PaymentStatus.ORDER_CREATED,
              PaymentStatus.PENDING,
              PaymentStatus.AUTHORIZED,
            ],
          },
        },
        {
          $set: {
            status: PaymentStatus.CAPTURED,
            paymentId,
            signature,
            paidAt: new Date(),
            ...(idempotencyKey ? { idempotencyKey } : {}),
          },
        },
        { returnDocument: 'after', session }
      );

      // If null, a concurrent racer (e.g. webhook) already captured this payment!
      if (!updatedPayment) {
        const current = await Payment.findById(payment._id).session(session || null);
        if (current?.status === PaymentStatus.CAPTURED) {
          const donation = await Donation.findById(current.donationId).session(session || null);
          const receipt = await Receipt.findOne({ donationId: current.donationId }).session(session || null);
          return { donation, receipt, payment: current, alreadyProcessed: true };
        }
        throw new AppError('Payment is not in a capturable state', 400, 'INVALID_PAYMENT_STATE');
      }

      // Update Donation status to CONFIRMED
      const donation = await Donation.findByIdAndUpdate(
        payment.donationId,
        {
          $set: {
            paymentStatus: DonationStatus.CONFIRMED,
            donatedAt: new Date(),
          },
        },
        { new: true, session }
      );

      // Pure atomic $inc in MongoDB for campaign raisedAmount
      await Campaign.findByIdAndUpdate(
        donation!.campaignId,
        { $inc: { raisedAmount: donation!.amount } },
        { session }
      );

      // Issue Receipt record directly in MongoDB (guaranteed persistence even if Redis is down)
      const receiptNumber = `RCP-${Date.now()}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
      const receiptDocs = await Receipt.create(
        [
          {
            donationId: donation!._id,
            userId: donation!.userId,
            receiptNumber,
            status: ReceiptStatus.READY,
            generatedAt: new Date(),
          },
        ],
        { session }
      );
      const createdReceipt = Array.isArray(receiptDocs) ? receiptDocs[0] : receiptDocs;

      // Record OutboxEvent for asynchronous message dispatch
      await OutboxEvent.create(
        [
          {
            eventType: AppEvents.DONATION_SUCCESSFUL,
            payload: {
              donationId: donation!._id,
              userId: donation!.userId,
              campaignId: donation!.campaignId,
              amount: donation!.amount,
              receiptId: createdReceipt._id,
            },
            status: OutboxStatus.PENDING,
          },
        ],
        { session }
      );

      // Safely dispatch event in-process after commit
      setTimeout(() => {
        try {
          eventEmitter.emit(AppEvents.DONATION_SUCCESSFUL, {
            donationId: donation!._id,
            userId: donation!.userId,
            campaignId: donation!.campaignId,
            amount: donation!.amount,
          });
        } catch (e: any) {
          console.warn('[EVENT] Async event emitter warning:', e.message);
        }
      }, 0);

      return { donation, receipt: createdReceipt, payment: updatedPayment, alreadyProcessed: false };
    });
  }

  /**
   * Raw Webhook Processor with Signature Verification & Database Idempotency
   */
  static async processWebhook(rawBody: Buffer, signature: string, payload: any) {
    const provider = getPaymentProvider();
    const isValid = provider.verifyWebhookSignature(rawBody, signature);
    if (!isValid) {
      throw new AppError('Invalid webhook signature', 400, 'INVALID_WEBHOOK_SIGNATURE');
    }

    const eventId = payload.event_id || payload.id || `wh_${crypto.randomBytes(8).toString('hex')}`;
    const eventType = payload.event || 'unknown';

    // Check compound unique index (provider, eventId)
    const existing = await WebhookEvent.findOne({ provider: 'razorpay', eventId });
    if (existing && existing.status === WebhookEventStatus.PROCESSED) {
      return { alreadyProcessed: true, eventId };
    }

    const webhookRecord = existing || (await WebhookEvent.create({
      provider: 'razorpay',
      eventId,
      eventType,
      payload,
      status: WebhookEventStatus.PENDING,
    }));

    try {
      if (eventType === 'payment.captured' || eventType === 'order.paid') {
        const paymentEntity = payload.payload?.payment?.entity || payload.payment;
        const orderId = paymentEntity?.order_id || payload.orderId;
        const paymentId = paymentEntity?.id || payload.paymentId;
        const amountInPaise = paymentEntity?.amount;

        if (orderId) {
          const payment = await Payment.findOne({ orderId });
          if (payment) {
            // Verify amount in paise against database record
            if (amountInPaise && amountInPaise !== Math.round(payment.amount * 100)) {
              throw new AppError('Webhook amount mismatch against payment record', 400, 'AMOUNT_MISMATCH');
            }

            if (payment.status !== PaymentStatus.CAPTURED) {
              await this.verify(
                payment.donationId.toString(),
                orderId,
                paymentId || `pay_wh_${orderId}`,
                'webhook_verified',
                undefined,
                amountInPaise
              );
            }
          }
        }
      } else if (eventType === 'payment.failed') {
        const paymentEntity = payload.payload?.payment?.entity || payload.payment;
        const orderId = paymentEntity?.order_id;
        if (orderId) {
          const payment = await Payment.findOneAndUpdate(
            { orderId, status: { $ne: PaymentStatus.CAPTURED } },
            {
              status: PaymentStatus.FAILED,
              failureReason: paymentEntity?.error_description || 'Payment failed at gateway',
            },
            { returnDocument: 'after' }
          );
          if (payment) {
            await Donation.findByIdAndUpdate(payment.donationId, {
              paymentStatus: DonationStatus.FAILED,
              failureReason: paymentEntity?.error_description || 'Gateway failure',
            });
          }
        }
      } else if (eventType === 'refund.processed') {
        const refundEntity = payload.payload?.refund?.entity || payload.refund;
        const paymentId = refundEntity?.payment_id;
        const refundAmountPaise = refundEntity?.amount;
        if (paymentId) {
          const payment = await Payment.findOne({ paymentId });
          if (payment && payment.status !== PaymentStatus.REFUNDED) {
            const refundAmount = refundAmountPaise ? refundAmountPaise / 100 : payment.amount;
            await this.refund(
              payment._id.toString(),
              refundAmount,
              'Refund confirmed via gateway webhook',
              undefined,
              'SYSTEM_WEBHOOK'
            ).catch((err) => console.warn('[WEBHOOK] Auto-refund sync notice:', err.message));
          }
        }
      }

      webhookRecord.status = WebhookEventStatus.PROCESSED;
      webhookRecord.processedAt = new Date();
      await webhookRecord.save();

      return { success: true, eventId };
    } catch (err: any) {
      webhookRecord.status = WebhookEventStatus.FAILED;
      webhookRecord.processingError = err.message;
      await webhookRecord.save();
      throw err;
    }
  }

  /**
   * Super Admin Refund with Strict Amount Validation & Campaign Balance Decrement
   */
  static async refund(
    paymentId: string,
    amount?: number,
    reason?: string,
    actorId?: string,
    actorRole = 'SUPER_ADMIN'
  ) {
    if (actorRole !== 'SUPER_ADMIN' && actorRole !== 'SYSTEM_WEBHOOK') {
      throw new AppError('Forbidden: Only Super Admin can process refunds', 403, 'FORBIDDEN');
    }

    const provider = getPaymentProvider();
    const isObjectId = mongoose.Types.ObjectId.isValid(paymentId);
    const queryList: any[] = [{ orderId: paymentId }, { paymentId }];
    if (isObjectId) queryList.push({ _id: paymentId });

    const payment = await Payment.findOne({ $or: queryList });
    if (!payment) {
      throw new AppError('Payment record not found', 404, 'PAYMENT_NOT_FOUND');
    }

    if (payment.status !== PaymentStatus.CAPTURED && payment.status !== PaymentStatus.PARTIALLY_REFUNDED) {
      throw new AppError(`Cannot refund payment in '${payment.status}' state`, 400, 'INVALID_PAYMENT_STATE');
    }

    // Remaining refundable amount validation
    const alreadyRefunded = payment.refundedAmount || 0;
    const remainingRefundable = payment.amount - alreadyRefunded;
    const refundAmount = amount !== undefined ? amount : remainingRefundable;

    if (refundAmount <= 0) {
      throw new AppError('Refund amount must be greater than zero', 400, 'INVALID_REFUND_AMOUNT');
    }

    if (refundAmount > remainingRefundable) {
      throw new AppError(
        `Refund amount ₹${refundAmount} exceeds remaining refundable balance ₹${remainingRefundable}`,
        400,
        'EXCESSIVE_REFUND'
      );
    }

    const refundAmountInPaise = Math.round(refundAmount * 100);

    // Call Gateway
    const refundRes = await provider.refundPayment(
      payment.paymentId || payment.orderId,
      refundAmountInPaise
    );

    if (!refundRes.success) {
      throw new AppError('Payment provider rejected refund operation', 502, 'REFUND_GATEWAY_ERROR');
    }

    const newRefundedTotal = alreadyRefunded + refundAmount;
    const isFullRefund = newRefundedTotal >= payment.amount;
    const nextStatus = isFullRefund ? PaymentStatus.REFUNDED : PaymentStatus.PARTIALLY_REFUNDED;

    return await withTransaction(async (session) => {
      payment.status = nextStatus;
      payment.refundId = refundRes.refundId;
      payment.refundAmount = refundAmount;
      payment.refundedAmount = newRefundedTotal;
      payment.refundReason = reason || 'Admin processed refund';
      payment.refundedAt = new Date();
      await payment.save({ session });

      const donation = await Donation.findByIdAndUpdate(
        payment.donationId,
        {
          $set: {
            ...(isFullRefund ? { paymentStatus: DonationStatus.REFUNDED } : {}),
            metadata: {
              refundedAmount: newRefundedTotal,
              lastRefundId: refundRes.refundId,
              lastRefundAt: new Date(),
            },
          },
        },
        { new: true, session }
      );

      // Pure atomic $inc decrement on Campaign raisedAmount
      if (donation) {
        await Campaign.findByIdAndUpdate(
          donation.campaignId,
          { $inc: { raisedAmount: -refundAmount } },
          { session }
        );
      }

      // Audit Trail
      await AuditService.log({
        actorId,
        actorRole,
        action: 'PAYMENT_REFUNDED',
        targetType: 'Payment',
        targetId: payment._id.toString(),
        metadata: {
          refundId: refundRes.refundId,
          refundAmount,
          newRefundedTotal,
          isFullRefund,
          reason,
        },
      });

      return {
        success: true,
        payment,
        refundId: refundRes.refundId,
        refundAmount,
        isFullRefund,
      };
    });
  }

  /**
   * Sweeps stale uncompleted orders older than 30 minutes to EXPIRED
   */
  static async checkAndExpireOrders() {
    const expirationThreshold = new Date(Date.now() - ORDER_EXPIRATION_MS);
    const stalePayments = await Payment.find({
      status: { $in: [PaymentStatus.CREATED, PaymentStatus.ORDER_CREATED, PaymentStatus.PENDING] },
      createdAt: { $lt: expirationThreshold },
    });

    for (const p of stalePayments) {
      p.status = PaymentStatus.EXPIRED;
      p.failureReason = 'Order window expired';
      await p.save();

      await Donation.findByIdAndUpdate(p.donationId, {
        paymentStatus: DonationStatus.FAILED,
        failureReason: 'Order window expired',
      });
    }

    return stalePayments.length;
  }
}
