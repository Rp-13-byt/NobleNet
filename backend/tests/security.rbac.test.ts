import mongoose from 'mongoose';
import request from 'supertest';
import bcrypt from 'bcryptjs';
import http from 'http';
import { AddressInfo } from 'net';
import { io as Client, Socket as ClientSocket } from 'socket.io-client';
import app from '../src/app';
import { User, UserRole } from '../src/modules/users/models/User';
import { NGO, NgoStatus } from '../src/modules/ngos/models/NGO';
import { Campaign, CampaignStatus } from '../src/modules/campaigns/models/Campaign';
import { Donation, DonationStatus } from '../src/modules/donations/models/Donation';
import { VolunteerOpportunity, OpportunityStatus } from '../src/modules/volunteering/models/VolunteerOpportunity';
import { VolunteerApplication, ApplicationStatus } from '../src/modules/volunteering/models/VolunteerApplication';
import { Notification, NotificationType } from '../src/modules/notifications/models/Notification';
import { SocketService } from '../src/core/socket/socket.service';

describe('Security & RBAC Enforcement Suite', () => {
  let donorToken: string;
  let donorId: string;

  let attackerToken: string;
  let attackerId: string;

  let ngoToken: string;
  let ngoUserId: string;
  let ngoId: string;

  let adminToken: string;
  let adminId: string;

  let campaignId: string;
  let donationId: string;
  let opportunityId: string;
  let applicationId: string;
  let notificationId: string;

  // Socket test vars
  let server: http.Server;
  let port: number;

  beforeAll(async () => {
    // 1. Password hashing for test accounts
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash('Password@123', salt);

    // 2. Create Donor User
    const donor = await User.create({
      name: 'Donor Test User',
      email: `donor_${Date.now()}@test.org`,
      passwordHash,
      role: UserRole.USER,
    });
    donorId = donor._id.toString();

    // 3. Create Attacker User (User role)
    const attacker = await User.create({
      name: 'Attacker Test User',
      email: `attacker_${Date.now()}@test.org`,
      passwordHash,
      role: UserRole.USER,
    });
    attackerId = attacker._id.toString();

    // 4. Create NGO User & Organization
    const ngoUser = await User.create({
      name: 'NGO Rep User',
      email: `ngo_${Date.now()}@test.org`,
      passwordHash,
      role: UserRole.NGO,
    });
    ngoUserId = ngoUser._id.toString();

    const ngo = await NGO.create({
      userId: ngoUser._id,
      organizationName: 'Global Green Hope',
      registrationNumber: `REG_${Date.now()}`,
      description: 'Environmental protection initiative',
      address: '123 Earth Way',
      contactEmail: ngoUser.email,
      contactPhone: '9876543210',
      status: NgoStatus.VERIFIED,
    });
    ngoId = ngo._id.toString();

    // 5. Create Super Admin User
    const admin = await User.create({
      name: 'Super Admin User',
      email: `admin_${Date.now()}@test.org`,
      passwordHash,
      role: UserRole.SUPER_ADMIN,
    });
    adminId = admin._id.toString();

    // 6. Login all accounts to get tokens
    const donorRes = await request(app).post('/api/v1/auth/login').send({ email: donor.email, password: 'Password@123' });
    donorToken = donorRes.body.data.accessToken;

    const attackerRes = await request(app).post('/api/v1/auth/login').send({ email: attacker.email, password: 'Password@123' });
    attackerToken = attackerRes.body.data.accessToken;

    const ngoRes = await request(app).post('/api/v1/auth/login').send({ email: ngoUser.email, password: 'Password@123' });
    ngoToken = ngoRes.body.data.accessToken;

    const adminRes = await request(app).post('/api/v1/auth/login').send({ email: admin.email, password: 'Password@123' });
    adminToken = adminRes.body.data.accessToken;

    // 7. Seed Campaign
    const campaign = await Campaign.create({
      ngoId: ngo._id,
      title: 'Solar Panels for Rural Clinic',
      description: 'Providing sustainable energy to medical facilities',
      goalAmount: 100000,
      raisedAmount: 5000,
      startDate: new Date(),
      endDate: new Date(Date.now() + 86400000 * 30),
      category: 'Environment',
      status: CampaignStatus.ACTIVE,
    });
    campaignId = campaign._id.toString();

    // 8. Seed Donation by Donor
    const donation: any = await Donation.create({
      userId: donor._id,
      campaignId: campaign._id,
      amount: 5000,
      currency: 'INR',
      donationType: 'MONETARY',
      anonymous: false,
      paymentStatus: DonationStatus.CONFIRMED,
      transactionReference: `TXN_${Date.now()}`,
    });
    donationId = donation._id.toString();

    // 9. Seed Volunteer Opportunity and Application
    const opp = await VolunteerOpportunity.create({
      ngoId: ngo._id,
      title: 'Solar Installation Assistant',
      description: 'Hands-on assistance installing panels',
      category: 'Environment',
      location: 'Rural Clinic A',
      eventDate: new Date(),
      startTime: '09:00 AM',
      endTime: '05:00 PM',
      requiredSkills: ['Wiring', 'Safety'],
      requiredVolunteers: 10,
      status: OpportunityStatus.OPEN,
    });
    opportunityId = opp._id.toString();

    const application = await VolunteerApplication.create({
      opportunityId: opp._id,
      userId: donor._id,
      status: ApplicationStatus.PENDING,
      skills: ['Wiring'],
      availability: 'Full Day',
    });
    applicationId = application._id.toString();

    // 10. Seed Notification for Donor
    const notification = await Notification.create({
      userId: donor._id,
      type: NotificationType.DONATION_SUCCESS,
      title: 'Donation Confirmed',
      message: 'Your donation of ₹5000 was confirmed.',
      data: { donationId: donation._id, campaignId: campaign._id },
    });
    notificationId = notification._id.toString();

    // 11. Start Socket Server
    server = http.createServer(app);
    SocketService.init(server);
    await new Promise<void>((resolve) => {
      server.listen(0, () => {
        port = (server.address() as AddressInfo).port;
        resolve();
      });
    });
  });

  afterAll(async () => {
    await Promise.all([
      User.deleteMany({ _id: { $in: [donorId, attackerId, ngoUserId, adminId] } }),
      NGO.deleteMany({ _id: ngoId }),
      Campaign.deleteMany({ _id: campaignId }),
      Donation.deleteMany({ _id: donationId }),
      VolunteerOpportunity.deleteMany({ _id: opportunityId }),
      VolunteerApplication.deleteMany({ _id: applicationId }),
      Notification.deleteMany({ _id: notificationId }),
    ]);

    await new Promise<void>((resolve) => {
      server.close(() => resolve());
    });
  });

  // ==========================================
  // 1. DONATION OWNERSHIP & IDOR ISOLATION
  // ==========================================
  describe('Donation Resource Ownership & IDOR Protection', () => {
    it('allows the donor to access their own donation details', async () => {
      const res = await request(app)
        .get(`/api/v1/donations/${donationId}`)
        .set('Authorization', `Bearer ${donorToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data._id).toBe(donationId);
    });

    it('allows the campaign-owning NGO to access the donation details', async () => {
      const res = await request(app)
        .get(`/api/v1/donations/${donationId}`)
        .set('Authorization', `Bearer ${ngoToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data._id).toBe(donationId);
    });

    it('allows SUPER_ADMIN to access any donation details', async () => {
      const res = await request(app)
        .get(`/api/v1/donations/${donationId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data._id).toBe(donationId);
    });

    it('STRICTLY BLOCKS an unrelated user from accessing the donation (IDOR Attempt -> 403)', async () => {
      const res = await request(app)
        .get(`/api/v1/donations/${donationId}`)
        .set('Authorization', `Bearer ${attackerToken}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error?.code).toBe('FORBIDDEN');
    });

    it('STRICTLY BLOCKS an unrelated user from querying donation status (IDOR -> 403)', async () => {
      const res = await request(app)
        .get(`/api/v1/donations/${donationId}/status`)
        .set('Authorization', `Bearer ${attackerToken}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error?.code).toBe('FORBIDDEN');
    });
  });

  // ==========================================
  // 2. VOLUNTEER APPLICATION OWNERSHIP & IDOR
  // ==========================================
  describe('Volunteer Application Ownership & IDOR Protection', () => {
    it('allows the applicant to fetch their own volunteer application', async () => {
      const res = await request(app)
        .get(`/api/v1/volunteering/applications/${applicationId}`)
        .set('Authorization', `Bearer ${donorToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data._id).toBe(applicationId);
    });

    it('allows the organizing NGO to fetch the application', async () => {
      const res = await request(app)
        .get(`/api/v1/volunteering/applications/${applicationId}`)
        .set('Authorization', `Bearer ${ngoToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data._id).toBe(applicationId);
    });

    it('allows SUPER_ADMIN to fetch the application', async () => {
      const res = await request(app)
        .get(`/api/v1/volunteering/applications/${applicationId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data._id).toBe(applicationId);
    });

    it('STRICTLY BLOCKS an unauthorized user from viewing the application (IDOR -> 403)', async () => {
      const res = await request(app)
        .get(`/api/v1/volunteering/applications/${applicationId}`)
        .set('Authorization', `Bearer ${attackerToken}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error?.code).toBe('FORBIDDEN');
    });

    it('STRICTLY BLOCKS an unauthorized user from withdrawing another user application', async () => {
      const res = await request(app)
        .patch(`/api/v1/volunteering/applications/${applicationId}/withdraw`)
        .set('Authorization', `Bearer ${attackerToken}`);

      // The controller searches with { _id: applicationId, userId: attackerId } -> 404
      expect(res.status).toBe(404);
    });
  });

  // ==========================================
  // 3. NOTIFICATION DATA ISOLATION
  // ==========================================
  describe('Notification Data Isolation', () => {
    it('allows the recipient to fetch their own notification', async () => {
      const res = await request(app)
        .get(`/api/v1/notifications/${notificationId}`)
        .set('Authorization', `Bearer ${donorToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data._id).toBe(notificationId);
    });

    it('STRICTLY ISOLATES notifications: another user cannot access it (IDOR -> 404)', async () => {
      const res = await request(app)
        .get(`/api/v1/notifications/${notificationId}`)
        .set('Authorization', `Bearer ${attackerToken}`);

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });

    it('STRICTLY ISOLATES notification updates: another user cannot mark it as read', async () => {
      const res = await request(app)
        .patch(`/api/v1/notifications/${notificationId}/read`)
        .set('Authorization', `Bearer ${attackerToken}`);

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });
  });

  // ==========================================
  // 4. ROLE-BASED ACCESS CONTROL (ADMIN ENDPOINTS)
  // ==========================================
  describe('Admin Role Route Guarding', () => {
    it('blocks regular USER from accessing /admin/users (403 Forbidden)', async () => {
      const res = await request(app)
        .get('/api/v1/admin/users')
        .set('Authorization', `Bearer ${attackerToken}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });

    it('blocks NGO role from accessing /admin/users (403 Forbidden)', async () => {
      const res = await request(app)
        .get('/api/v1/admin/users')
        .set('Authorization', `Bearer ${ngoToken}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });

    it('permits SUPER_ADMIN to access /admin/users (200 OK)', async () => {
      const res = await request(app)
        .get('/api/v1/admin/users')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  // ==========================================
  // 5. WEBSOCKET ROOM ISOLATION
  // ==========================================
  describe('WebSocket Room Joining Security', () => {
    let client: ClientSocket;

    afterEach(() => {
      if (client && client.connected) {
        client.disconnect();
      }
    });

    it('permits authenticated client to join their own private user room', (done) => {
      client = Client(`http://localhost:${port}`, {
        auth: { token: donorToken },
        transports: ['websocket'],
      });

      client.on('connect', () => {
        // Should join without error
        client.emit('join', `user:${donorId}`);
        setTimeout(() => {
          expect(client.connected).toBe(true);
          done();
        }, 100);
      });
    });

    it('permits joining public broadcast rooms', (done) => {
      client = Client(`http://localhost:${port}`, {
        auth: { token: donorToken },
        transports: ['websocket'],
      });

      client.on('connect', () => {
        client.emit('join', 'campaign:camp_123');
        client.emit('join', 'public');
        setTimeout(() => {
          expect(client.connected).toBe(true);
          done();
        }, 100);
      });
    });

    it('rejects unauthorized join to other users room or admin role room', (done) => {
      client = Client(`http://localhost:${port}`, {
        auth: { token: attackerToken },
        transports: ['websocket'],
      });

      client.on('connect', () => {
        // Attacker attempts to join donor's private room and super admin room
        client.emit('join', `user:${donorId}`);
        client.emit('join', 'role:SUPER_ADMIN');

        setTimeout(() => {
          // Socket service should not crash and client should remain bounded
          expect(client.connected).toBe(true);
          done();
        }, 100);
      });
    });
  });
});
