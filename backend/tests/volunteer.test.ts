import mongoose from 'mongoose';
import request from 'supertest';
import bcrypt from 'bcryptjs';
import app from '../src/app';
import { VolunteerOpportunity, OpportunityStatus } from '../src/modules/volunteering/models/VolunteerOpportunity';
import { VolunteerApplication } from '../src/modules/volunteering/models/VolunteerApplication';
import { User, UserRole } from '../src/modules/users/models/User';

describe('Volunteer Subsystem & Compound Unique Constraints', () => {
  let userToken: string;
  let userId: string;
  let opportunityId: string;
  const ngoId = new mongoose.Types.ObjectId();

  beforeAll(async () => {
    await VolunteerApplication.init();

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash('Password@123', salt);

    const user = await User.create({
      name: 'Volunteer User',
      email: `vol_${Date.now()}@noblenet.org`,
      passwordHash,
      role: UserRole.USER,
    });
    userId = user._id.toString();

    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: user.email, password: 'Password@123' });
    userToken = res.body.data.accessToken;

    const opp = await VolunteerOpportunity.create({
      ngoId,
      title: 'Teaching Kids',
      description: 'Teach basic math and English',
      category: 'Education',
      location: 'Community Center',
      eventDate: new Date(),
      startTime: '10:00 AM',
      endTime: '01:00 PM',
      requiredSkills: ['Teaching'],
      requiredVolunteers: 5,
      status: OpportunityStatus.OPEN,
    });
    opportunityId = opp._id.toString();
  });

  afterAll(async () => {
    await VolunteerApplication.deleteMany({ userId });
    await VolunteerOpportunity.deleteMany({ ngoId });
    await User.findByIdAndDelete(userId);
  });

  it('1. Should submit volunteer application successfully (201)', async () => {
    const res = await request(app)
      .post(`/api/v1/volunteering/${opportunityId}/apply`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        skills: ['Teaching'],
        availability: 'Weekends',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
  });

  it('2. Should reject duplicate volunteer application with 409', async () => {
    const res = await request(app)
      .post(`/api/v1/volunteering/${opportunityId}/apply`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        skills: ['Teaching'],
        availability: 'Weekends',
      });

    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
  });
});
