import request from 'supertest';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import app from '../src/app';
import { User, UserRole } from '../src/modules/users/models/User';
import { Payment, PaymentStatus } from '../src/modules/payments/models/Payment';
import { Donation, DonationStatus } from '../src/modules/donations/models/Donation';
import { Campaign, CampaignStatus } from '../src/modules/campaigns/models/Campaign';
import { AuditLog } from '../src/modules/audit/models/AuditLog';

describe('Refund Subsystem, Multi-Partial Limits & Balance Reversal Tests', () => {
  let adminToken: string;
  let userToken: string;
  let adminId: string;
  let userId: string;
  let campaignId: string;
  let donationId: string;
  let paymentId: string;

  beforeAll(async () => {
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash('Password@123', salt);

    // Super Admin
    const admin = await User.create({
      name: 'Super Admin',
      email: `admin_${Date.now()}@noblenet.org`,
      passwordHash,
      role: UserRole.SUPER_ADMIN,
    });
    adminId = admin._id.toString();

    const adminLogin = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: admin.email, password: 'Password@123' });
    adminToken = adminLogin.body.data.accessToken;

    // Normal User
    const user = await User.create({
      name: 'Regular User',
      email: `user_${Date.now()}@noblenet.org`,
      passwordHash,
      role: UserRole.USER,
    });
    userId = user._id.toString();

    const userLogin = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: user.email, password: 'Password@123' });
    userToken = userLogin.body.data.accessToken;

    // Campaign with initial funds
    const campaign = await Campaign.create({
      ngoId: new mongoose.Types.ObjectId(),
      title: 'Water Well Drilling Project',
      description: 'Clean drinking water access',
      category: 'Environment',
      goalAmount: 50000,
      raisedAmount: 5000, // already raised ₹5000
      status: CampaignStatus.ACTIVE,
      startDate: new Date(),
      endDate: new Date(Date.now() + 864000000),
    });
    campaignId = campaign._id.toString();

    // Captured Donation of ₹1000
    const donation = await Donation.create({
      userId: user._id,
      campaignId: campaign._id,
      amount: 1000,
      currency: 'INR',
      paymentStatus: DonationStatus.CONFIRMED,
    });
    donationId = donation._id.toString();

    const payment = await Payment.create({
      donationId: donation._id,
      gateway: 'mock',
      orderId: `order_rfnd_${Date.now()}`,
      paymentId: `pay_rfnd_${Date.now()}`,
      amount: 1000,
      refundedAmount: 0,
      currency: 'INR',
      status: PaymentStatus.CAPTURED,
      paidAt: new Date(),
    });
    paymentId = payment._id.toString();
  });

  afterAll(async () => {
    await User.deleteMany({ _id: { $in: [adminId, userId] } });
    await Campaign.findByIdAndDelete(campaignId);
    await Donation.findByIdAndDelete(donationId);
    await Payment.findByIdAndDelete(paymentId);
    await AuditLog.deleteMany({ targetId: paymentId });
  });

  it('1. Security: Normal user cannot execute refund (403)', async () => {
    const res = await request(app)
      .post(`/api/v1/admin/payments/${paymentId}/refund`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({ amount: 500, reason: 'Unauthorized user refund attempt' });

    expect(res.status).toBe(403);
  });

  it('2. Partial Refund: Super Admin refunds ₹400 of ₹1000 -> status PARTIALLY_REFUNDED (200)', async () => {
    const res = await request(app)
      .post(`/api/v1/admin/payments/${paymentId}/refund`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ amount: 400, reason: 'Partial refund requested by donor' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.isFullRefund).toBe(false);
    expect(res.body.data.refundAmount).toBe(400);

    // Verify Payment document
    const payment = await Payment.findById(paymentId);
    expect(payment?.status).toBe(PaymentStatus.PARTIALLY_REFUNDED);
    expect(payment?.refundedAmount).toBe(400);

    // Verify Campaign raisedAmount atomically decremented by ₹400 (from 5000 to 4600)
    const campaign = await Campaign.findById(campaignId);
    expect(campaign?.raisedAmount).toBe(4600);

    // Verify AuditLog was recorded
    const audit = await AuditLog.findOne({ targetId: paymentId, action: 'PAYMENT_REFUNDED' });
    expect(audit).toBeDefined();
    expect(audit?.actorRole).toBe('SUPER_ADMIN');
  });

  it('3. Excessive Refund: Rejects second refund that exceeds remaining balance (400)', async () => {
    // ₹400 already refunded. Remaining is ₹600. Requesting ₹700 must fail!
    const res = await request(app)
      .post(`/api/v1/admin/payments/${paymentId}/refund`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ amount: 700, reason: 'Exceeding refund attempt' });

    expect(res.status).toBe(400);
    expect(res.body.error?.code).toBe('EXCESSIVE_REFUND');
  });

  it('4. Full Refund Completion: Super Admin refunds remaining ₹600 -> status REFUNDED (200)', async () => {
    const res = await request(app)
      .post(`/api/v1/admin/payments/${paymentId}/refund`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ amount: 600, reason: 'Completing full refund' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.isFullRefund).toBe(true);

    // Verify Payment document is now REFUNDED
    const payment = await Payment.findById(paymentId);
    expect(payment?.status).toBe(PaymentStatus.REFUNDED);
    expect(payment?.refundedAmount).toBe(1000);

    // Verify Donation document is now REFUNDED
    const donation = await Donation.findById(donationId);
    expect(donation?.paymentStatus).toBe(DonationStatus.REFUNDED);

    // Verify Campaign raisedAmount atomically decremented by ₹600 (from 4600 to 4000)
    const campaign = await Campaign.findById(campaignId);
    expect(campaign?.raisedAmount).toBe(4000);
  });

  it('5. Terminal State Guard: Rejects refund on an already fully refunded payment (400)', async () => {
    const res = await request(app)
      .post(`/api/v1/admin/payments/${paymentId}/refund`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ amount: 100 });

    expect(res.status).toBe(400);
    expect(res.body.error?.code).toBe('INVALID_PAYMENT_STATE');
  });
});
