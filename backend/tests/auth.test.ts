import request from 'supertest';
import app from '../src/app';
import { User, UserRole, UserStatus } from '../src/modules/users/models/User';

describe('Auth Subsystem & RBAC Tests', () => {
  const uniqueEmail = `test_${Date.now()}@noblenet.org`;
  let userToken: string;
  let refreshToken: string;
  let userId: string;

  afterAll(async () => {
    await User.deleteMany({ email: { $regex: /@noblenet\.org$/ } });
  });

  it('1. Should register a new user successfully (201)', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({
        name: 'Test Donor',
        email: uniqueEmail,
        password: 'Password@123',
        role: UserRole.USER,
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.email).toBe(uniqueEmail);
    expect(res.body.data.accessToken).toBeDefined();
    userId = res.body.data.user.id || res.body.data.user._id;
  });

  it('2. Should reject duplicate email registration with 409', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({
        name: 'Duplicate Donor',
        email: uniqueEmail,
        password: 'Password@123',
        role: UserRole.USER,
      });

    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
  });

  it('3. Should login with valid credentials (200)', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: uniqueEmail,
        password: 'Password@123',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.accessToken).toBeDefined();
    expect(res.body.data.refreshToken).toBeDefined();
    userToken = res.body.data.accessToken;
    refreshToken = res.body.data.refreshToken;
  });

  it('4. Should reject login with invalid password (401)', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: uniqueEmail,
        password: 'WrongPassword!',
      });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('5. Should refresh tokens via /api/v1/auth/refresh (200)', async () => {
    const res = await request(app)
      .post('/api/v1/auth/refresh')
      .send({ refreshToken });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.accessToken).toBeDefined();
  });

  it('6. Should block suspended user from logging in (403)', async () => {
    await User.findByIdAndUpdate(userId, { status: UserStatus.SUSPENDED });

    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: uniqueEmail,
        password: 'Password@123',
      });

    expect(res.status).toBe(403);
    expect(res.body.message).toMatch(/suspended/i);

    await User.findByIdAndUpdate(userId, { status: UserStatus.ACTIVE });
  });

  it('7. Should enforce RBAC: USER cannot access Admin endpoints (403)', async () => {
    const res = await request(app)
      .get('/api/v1/admin/users')
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });
});
