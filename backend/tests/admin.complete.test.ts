import request from 'supertest';
import bcrypt from 'bcryptjs';
import app from '../src/app';
import { User, UserRole, UserStatus } from '../src/modules/users/models/User';
import { NGO, NgoStatus } from '../src/modules/ngos/models/NGO';
import { Campaign, CampaignStatus } from '../src/modules/campaigns/models/Campaign';

describe('Admin Complete Operational & Moderation Suite', () => {
  let adminToken: string;
  let adminUser: any;
  let testUser: any;
  let testNgo: any;
  let testCampaign: any;

  beforeAll(async () => {
    const salt = await bcrypt.genSalt(10);

    // 1. Create Super Admin
    const adminPassHash = await bcrypt.hash('AdminPassword123!', salt);
    adminUser = await User.create({
      name: 'Super Admin Test',
      email: `admin_${Date.now()}@noblenet.org`,
      passwordHash: adminPassHash,
      role: UserRole.SUPER_ADMIN,
      status: UserStatus.ACTIVE,
      emailVerified: true,
    });

    const adminLoginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: adminUser.email, password: 'AdminPassword123!' });
    adminToken = adminLoginRes.body.data.accessToken;

    // 2. Create Normal User
    const donorPassHash = await bcrypt.hash('DonorPassword123!', salt);
    testUser = await User.create({
      name: 'Donor Test User',
      email: `donor_${Date.now()}@noblenet.org`,
      passwordHash: donorPassHash,
      role: UserRole.USER,
      status: UserStatus.ACTIVE,
      emailVerified: false,
    });

    // 3. Create NGO User & NGO
    const ngoPassHash = await bcrypt.hash('NgoPassword123!', salt);
    const ngoUser = await User.create({
      name: 'NGO Rep Test',
      email: `ngo_${Date.now()}@noblenet.org`,
      passwordHash: ngoPassHash,
      role: UserRole.NGO,
      status: UserStatus.ACTIVE,
      emailVerified: false,
    });

    testNgo = await NGO.create({
      userId: ngoUser._id,
      organizationName: 'Life Care Foundation',
      registrationNumber: `REG-${Date.now()}`,
      description: 'Medical & emergency relief non-profit',
      address: 'New Delhi, India',
      contactEmail: ngoUser.email,
      contactPhone: '+919876543210',
      status: NgoStatus.PENDING,
    });

    // 4. Create Campaign
    testCampaign = await Campaign.create({
      ngoId: testNgo._id,
      title: 'Emergency Medical Drive',
      description: 'Procuring medicines for rural clinics',
      category: 'Healthcare',
      goalAmount: 50000,
      raisedAmount: 5000,
      status: CampaignStatus.ACTIVE,
      startDate: new Date(),
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      images: ['https://example.com/image.jpg'],
    });
  });

  afterAll(async () => {
    await Campaign.deleteMany({ _id: testCampaign?._id });
    await NGO.deleteMany({ _id: testNgo?._id });
    await User.deleteMany({ email: { $regex: /@noblenet\.org$/ } });
  });

  it('1. GET /api/v1/admin/stats returns platform telemetry (200)', async () => {
    const res = await request(app)
      .get('/api/v1/admin/stats')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.users).toBeDefined();
    expect(res.body.data.ngos).toBeDefined();
    expect(res.body.data.campaigns).toBeDefined();
  });

  it('2. GET /api/v1/admin/users lists users with role filters (200)', async () => {
    const res = await request(app)
      .get('/api/v1/admin/users?role=USER')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    const found = res.body.data.some((u: any) => u.email === testUser.email);
    expect(found).toBe(true);
  });

  it('3. PATCH /api/v1/admin/users/:id/status suspends user account (200)', async () => {
    const res = await request(app)
      .patch(`/api/v1/admin/users/${testUser._id}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: UserStatus.SUSPENDED });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    // Verify login is now blocked with 403
    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: testUser.email,
        password: 'DonorPassword123!',
      });
    expect(loginRes.status).toBe(403);
    expect(loginRes.body.errorCode).toBe('ACCOUNT_SUSPENDED');
  });

  it('4. PATCH /api/v1/admin/users/:id/status reactivates user account (200)', async () => {
    const res = await request(app)
      .patch(`/api/v1/admin/users/${testUser._id}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: UserStatus.ACTIVE });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    // Verify login now succeeds
    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: testUser.email,
        password: 'DonorPassword123!',
      });
    expect(loginRes.status).toBe(200);
  });

  it('5. PATCH /api/v1/admin/ngos/:id/review verifies NGO (200)', async () => {
    const res = await request(app)
      .patch(`/api/v1/admin/ngos/${testNgo._id}/review`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        status: NgoStatus.VERIFIED,
        verificationNotes: 'Darpan portal and 80G verified by audit team',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe(NgoStatus.VERIFIED);
  });

  it('6. PATCH /api/v1/admin/campaigns/:id/moderate pauses active campaign (200)', async () => {
    const res = await request(app)
      .patch(`/api/v1/admin/campaigns/${testCampaign._id}/moderate`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        status: CampaignStatus.PAUSED,
        reason: 'Temporary audit check',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe(CampaignStatus.PAUSED);
  });

  it('7. GET /api/v1/admin/donations lists donations ledger (200)', async () => {
    const res = await request(app)
      .get('/api/v1/admin/donations')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it('8. Super Admin actions generate immutable audit log records (200)', async () => {
    const res = await request(app)
      .get('/api/v1/admin/audit-logs')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
  });
});
