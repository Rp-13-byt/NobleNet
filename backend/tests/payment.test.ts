import request from 'supertest';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import app from '../src/app';
import { User, UserRole } from '../src/modules/users/models/User';
import { NGO, NgoStatus } from '../src/modules/ngos/models/NGO';
import { Campaign, CampaignStatus } from '../src/modules/campaigns/models/Campaign';
import { Payment, PaymentStatus } from '../src/modules/payments/models/Payment';
import { Donation, DonationStatus } from '../src/modules/donations/models/Donation';
import { OutboxEvent, OutboxStatus } from '../src/events/models/OutboxEvent';

describe('Production Payment Architecture & State Machine Tests', () => {
  let userToken: string;
  let otherUserToken: string;
  let userId: string;
  let otherUserId: string;
  let ngoId: string;
  let campaignId: string;
  let donationId: string;
  let orderId: string;

  beforeAll(async () => {
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash('Password@123', salt);

    // Primary test user
    const user = await User.create({
      name: 'Primary Donor',
      email: `donor_${Date.now()}@noblenet.org`,
      passwordHash,
      role: UserRole.USER,
    });
    userId = user._id.toString();

    const res1 = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: user.email, password: 'Password@123' });
    userToken = res1.body.data.accessToken;

    // Secondary user for security/access tests
    const otherUser = await User.create({
      name: 'Other User',
      email: `other_${Date.now()}@noblenet.org`,
      passwordHash,
      role: UserRole.USER,
    });
    otherUserId = otherUser._id.toString();

    const res2 = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: otherUser.email, password: 'Password@123' });
    otherUserToken = res2.body.data.accessToken;

    // Verified NGO
    const ngo = await NGO.create({
      userId: new mongoose.Types.ObjectId(),
      organizationName: 'Global Care Foundation',
      registrationNumber: `REG-${Date.now()}`,
      description: 'Care and emergency response',
      address: 'Connaught Place, New Delhi',
      contactEmail: 'contact@care.org',
      contactPhone: '9876543210',
      status: NgoStatus.VERIFIED,
    });
    ngoId = ngo._id.toString();

    // Active Campaign
    const campaign = await Campaign.create({
      ngoId: ngo._id,
      title: 'Pediatric Healthcare Initiative',
      description: 'Medical support for children',
      category: 'Health',
      goalAmount: 100000,
      raisedAmount: 0,
      status: CampaignStatus.ACTIVE,
      startDate: new Date(),
      endDate: new Date(Date.now() + 864000000),
    });
    campaignId = campaign._id.toString();
  });

  afterAll(async () => {
    await User.deleteMany({ _id: { $in: [userId, otherUserId] } });
    await NGO.findByIdAndDelete(ngoId);
    await Campaign.findByIdAndDelete(campaignId);
    if (donationId) {
      await Payment.deleteMany({ donationId });
      await Donation.findByIdAndDelete(donationId);
      await OutboxEvent.deleteMany({ 'payload.donationId': donationId });
    }
  });

  it('1. Should initiate donation with server-side validation (201)', async () => {
    const res = await request(app)
      .post(`/api/v1/campaigns/${campaignId}/donate`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({ amount: 1000, anonymous: false });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.donationId).toBeDefined();
    expect(res.body.data.amount).toBe(1000);
    expect(res.body.data.status).toBe('PENDING');

    donationId = res.body.data.donationId;
  });

  it('2. Should reject donation amount less than ₹1 (400)', async () => {
    const res = await request(app)
      .post(`/api/v1/campaigns/${campaignId}/donate`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({ amount: 0 });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('3. Should create gateway payment order based strictly on database donation record (200)', async () => {
    const res = await request(app)
      .post('/api/v1/payments/order')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ donationId });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.orderId).toBeDefined();
    expect(res.body.data.amount).toBe(1000);
    expect(res.body.data.amountInPaise).toBe(100000); // exactly 1000 * 100 paise

    orderId = res.body.data.orderId;

    // Verify Payment document transitioned to ORDER_CREATED
    const payment = await Payment.findOne({ orderId });
    expect(payment).toBeDefined();
    expect(payment?.status).toBe(PaymentStatus.ORDER_CREATED);
    expect(payment?.amount).toBe(1000);
  });

  it('4. Security: User B cannot create an order for User A donation (403)', async () => {
    const res = await request(app)
      .post('/api/v1/payments/order')
      .set('Authorization', `Bearer ${otherUserToken}`)
      .send({ donationId });

    expect(res.status).toBe(403);
  });

  it('5. Amount Tampering: Rejects client amount in paise that mismatches database amount (400)', async () => {
    const res = await request(app)
      .post('/api/v1/payments/verify')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        donationId,
        orderId,
        paymentId: `pay_${Date.now()}`,
        signature: 'mock_sig_valid',
        amountInPaise: 50000, // Tampered: 500 INR instead of 1000 INR
      });

    expect(res.status).toBe(400);
    expect(res.body.error?.code).toBe('AMOUNT_MISMATCH');
  });

  it('6. Order ID Tampering: Rejects verify request when orderId mismatches recorded order (400)', async () => {
    const res = await request(app)
      .post('/api/v1/payments/verify')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        donationId,
        orderId: 'fake_untrusted_order_id_123',
        paymentId: `pay_${Date.now()}`,
        signature: 'mock_sig_valid',
      });

    expect(res.status).toBe(400);
    expect(res.body.error?.code).toBe('ORDER_MISMATCH');
  });

  it('7. Invalid Signature: Rejects invalid signature and transitions Payment to FAILED (400)', async () => {
    const res = await request(app)
      .post('/api/v1/payments/verify')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        donationId,
        orderId,
        paymentId: `pay_${Date.now()}`,
        signature: 'invalid_cryptographic_signature',
      });

    expect(res.status).toBe(400);
    expect(res.body.error?.code).toBe('PAYMENT_VERIFICATION_FAILED');

    const payment = await Payment.findOne({ orderId });
    expect(payment?.status).toBe(PaymentStatus.FAILED);
  });

  it('8. Valid Verification: Atomically captures payment, confirms donation, increments campaign, and issues receipt (200)', async () => {
    // Reset status to ORDER_CREATED for capture test
    await Payment.findOneAndUpdate({ orderId }, { status: PaymentStatus.ORDER_CREATED });
    await Donation.findByIdAndUpdate(donationId, { paymentStatus: DonationStatus.PENDING });

    const paymentId = `pay_captured_${Date.now()}`;
    const res = await request(app)
      .post('/api/v1/payments/verify')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        donationId,
        orderId,
        paymentId,
        signature: 'mock_sig_success',
        amountInPaise: 100000,
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.alreadyProcessed).toBe(false);

    // Verify Payment state is CAPTURED
    const payment = await Payment.findOne({ orderId });
    expect(payment?.status).toBe(PaymentStatus.CAPTURED);
    expect(payment?.paidAt).toBeDefined();

    // Verify Donation state is CONFIRMED
    const donation = await Donation.findById(donationId);
    expect(donation?.paymentStatus).toBe(DonationStatus.CONFIRMED);

    // Verify Campaign raisedAmount atomically increased by 1000
    const campaign = await Campaign.findById(campaignId);
    expect(campaign?.raisedAmount).toBe(1000);

    // Verify OutboxEvent recorded
    const outbox = await OutboxEvent.findOne({ 'payload.donationId': new mongoose.Types.ObjectId(donationId) });
    expect(outbox).toBeDefined();
    expect(outbox?.status).toBe(OutboxStatus.PENDING);
  });

  it('9. Idempotency: Duplicate verify request returns alreadyProcessed: true without duplicate increments (200)', async () => {
    const res = await request(app)
      .post('/api/v1/payments/verify')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        donationId,
        orderId,
        paymentId: 'pay_duplicate_test',
        signature: 'mock_sig_success',
      });

    expect(res.status).toBe(200);
    expect(res.body.data.alreadyProcessed).toBe(true);

    // Campaign raisedAmount must NOT double-increment!
    const campaign = await Campaign.findById(campaignId);
    expect(campaign?.raisedAmount).toBe(1000);
  });

  it('10. Status Recovery: GET /donations/:id/status returns complete verified structure (200)', async () => {
    const res = await request(app)
      .get(`/api/v1/donations/${donationId}/status`)
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.donation.status).toBe('CONFIRMED');
    expect(res.body.data.payment.status).toBe('CAPTURED');
    expect(res.body.data.receipt.available).toBe(true);
    expect(res.body.data.receipt.receiptNumber).toMatch(/^RCP-/);
  });

  it('11. Receipt Access: GET /donations/:id/receipt returns 80G compliant certificate (200)', async () => {
    const res = await request(app)
      .get(`/api/v1/donations/${donationId}/receipt`)
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.taxExemptSection).toBe('Section 80G');
    expect(res.body.data.amount).toBe(1000);
  });
});
