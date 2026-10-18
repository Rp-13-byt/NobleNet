import request from 'supertest';
import mongoose from 'mongoose';
import crypto from 'crypto';
import app from '../src/app';
import { Payment, PaymentStatus } from '../src/modules/payments/models/Payment';
import { Donation, DonationStatus } from '../src/modules/donations/models/Donation';
import { Campaign, CampaignStatus } from '../src/modules/campaigns/models/Campaign';
import { WebhookEvent, WebhookEventStatus } from '../src/modules/payments/models/WebhookEvent';
import { PaymentService } from '../src/modules/payments/services/payment.service';
import { env } from '../src/config/env';

describe('Webhook HMAC Verification, Concurrency & Anti-Race Tests', () => {
  const razorpayOrderId = `order_wh_${Date.now()}`;
  const paymentId = `pay_wh_${Date.now()}`;
  let donationId: any;
  let campaignId: any;

  beforeAll(async () => {
    const campaign = await Campaign.create({
      ngoId: new mongoose.Types.ObjectId(),
      title: 'Disaster Relief Fund',
      description: 'Emergency provisions',
      category: 'Disaster',
      goalAmount: 100000,
      raisedAmount: 0,
      status: CampaignStatus.ACTIVE,
      startDate: new Date(),
      endDate: new Date(Date.now() + 864000000),
    });
    campaignId = campaign._id;

    const donation = await Donation.create({
      userId: new mongoose.Types.ObjectId(),
      campaignId,
      amount: 2000,
      currency: 'INR',
      paymentStatus: DonationStatus.PENDING,
    });
    donationId = donation._id;

    await Payment.create({
      donationId,
      gateway: 'razorpay',
      orderId: razorpayOrderId,
      amount: 2000,
      currency: 'INR',
      status: PaymentStatus.ORDER_CREATED,
    });
  });

  afterAll(async () => {
    await Payment.deleteMany({ orderId: razorpayOrderId });
    await Donation.findByIdAndDelete(donationId);
    await Campaign.findByIdAndDelete(campaignId);
    await WebhookEvent.deleteMany({ provider: 'razorpay' });
  });

  it('1. Rejection: Rejects webhook with invalid HMAC signature (400)', async () => {
    const payload = JSON.stringify({
      event: 'payment.captured',
      payload: { payment: { entity: { id: paymentId, order_id: razorpayOrderId, amount: 200000 } } },
    });

    const res = await request(app)
      .post('/api/v1/payments/webhook/razorpay')
      .set('Content-Type', 'application/json')
      .set('x-razorpay-signature', 'invalid_fake_hmac_signature')
      .send(payload);

    expect(res.status).toBe(400);
    expect(res.body.error?.code).toBe('INVALID_WEBHOOK_SIGNATURE');
  });

  it('2. Anti-Race Concurrency: Concurrent client verify and webhook deliver simultaneously without double-counting', async () => {
    const payload = JSON.stringify({
      event: 'payment.captured',
      event_id: `evt_race_${Date.now()}`,
      payload: {
        payment: {
          entity: {
            id: paymentId,
            order_id: razorpayOrderId,
            amount: 200000, // 2000 INR
            status: 'captured',
          },
        },
      },
    });

    const secret = env.RAZORPAY_WEBHOOK_SECRET || 'rzp_webhook_secret_dev_12345';
    const signature = crypto.createHmac('sha256', secret).update(payload).digest('hex');

    // Fire both client verify AND webhook simultaneously!
    const [webhookRes, verifyRes] = await Promise.all([
      request(app)
        .post('/api/v1/payments/webhook/razorpay')
        .set('Content-Type', 'application/json')
        .set('x-razorpay-signature', signature)
        .send(payload),
      PaymentService.verify(
        donationId.toString(),
        razorpayOrderId,
        paymentId,
        'mock_sig_race_test',
        undefined,
        200000
      ).catch((err) => ({ alreadyProcessed: true, error: err.message })),
    ]);

    expect(webhookRes.status).toBe(200);

    // Final state of Payment must be CAPTURED
    const payment = await Payment.findOne({ orderId: razorpayOrderId });
    expect(payment?.status).toBe(PaymentStatus.CAPTURED);

    // Final state of Donation must be CONFIRMED
    const donation = await Donation.findById(donationId);
    expect(donation?.paymentStatus).toBe(DonationStatus.CONFIRMED);

    // Crucial Invariant: Campaign raisedAmount must be incremented EXACTLY ONCE (2000, not 4000!)
    const campaign = await Campaign.findById(campaignId);
    expect(campaign?.raisedAmount).toBe(2000);
  });

  it('3. Webhook Idempotency: Duplicate webhook event ID returns 200 alreadyProcessed without re-processing', async () => {
    const eventId = `evt_dedup_${Date.now()}`;
    const payload = JSON.stringify({
      event: 'payment.captured',
      event_id: eventId,
      payload: {
        payment: {
          entity: {
            id: paymentId,
            order_id: razorpayOrderId,
            amount: 200000,
            status: 'captured',
          },
        },
      },
    });

    const secret = env.RAZORPAY_WEBHOOK_SECRET || 'rzp_webhook_secret_dev_12345';
    const signature = crypto.createHmac('sha256', secret).update(payload).digest('hex');

    // First delivery
    const res1 = await request(app)
      .post('/api/v1/payments/webhook/razorpay')
      .set('Content-Type', 'application/json')
      .set('x-razorpay-signature', signature)
      .send(payload);

    expect(res1.status).toBe(200);

    // Second identical delivery (webhook retry)
    const res2 = await request(app)
      .post('/api/v1/payments/webhook/razorpay')
      .set('Content-Type', 'application/json')
      .set('x-razorpay-signature', signature)
      .send(payload);

    expect(res2.status).toBe(200);
    expect(res2.body.alreadyProcessed).toBe(true);

    // Verify Campaign total remains exactly 2000
    const campaign = await Campaign.findById(campaignId);
    expect(campaign?.raisedAmount).toBe(2000);
  });
});
