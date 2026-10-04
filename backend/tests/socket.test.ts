import http from 'http';
import { AddressInfo } from 'net';
import jwt from 'jsonwebtoken';
import { io as Client, Socket as ClientSocket } from 'socket.io-client';
import app from '../src/app';
import { SocketService } from '../src/core/socket/socket.service';
import { UserRole } from '../src/modules/users/models/User';
import { eventEmitter, AppEvents } from '../src/events/EventEmitter';
import { env } from '../src/config/env';

describe('Real-Time Socket.IO Synchronization Tests', () => {
  let server: http.Server;
  let port: number;
  let clientSocket: ClientSocket;
  const testUserId = '65f000000000000000000001';
  let validToken: string;

  beforeAll((done) => {
    validToken = jwt.sign({ id: testUserId, role: UserRole.USER }, env.JWT_ACCESS_SECRET, {
      expiresIn: '1h',
    });
    server = http.createServer(app);
    SocketService.init(server);

    server.listen(0, () => {
      port = (server.address() as AddressInfo).port;
      done();
    });
  });

  afterAll((done) => {
    if (clientSocket && clientSocket.connected) {
      clientSocket.disconnect();
    }
    server.close(done);
  });

  it('1. Should successfully authenticate and connect client with valid JWT', (done) => {
    clientSocket = Client(`http://localhost:${port}`, {
      auth: { token: validToken },
      transports: ['websocket'],
    });

    clientSocket.on('connect', () => {
      expect(clientSocket.connected).toBe(true);
      done();
    });

    clientSocket.on('connect_error', (err) => {
      done(err);
    });
  });

  it('2. Should broadcast and receive campaign.updated domain event', (done) => {
    clientSocket.on('campaign.updated', (payload) => {
      expect(payload.campaignId).toBe('camp_123');
      expect(payload.raisedAmount).toBe(15000);
      done();
    });

    // Simulate domain event emission
    eventEmitter.emit(AppEvents.CAMPAIGN_UPDATED, {
      campaignId: 'camp_123',
      raisedAmount: 15000,
      targetAmount: 50000,
    });
  });

  it('3. Should receive targeted notification.created event in user room', (done) => {
    clientSocket.on('notification.created', (payload) => {
      expect(payload.userId.toString()).toBe(testUserId);
      expect(payload.title).toBe('Donation Confirmed');
      done();
    });

    // Target the connected user
    eventEmitter.emit(AppEvents.DONATION_SUCCESSFUL, {
      donationId: 'don_789',
      userId: testUserId,
      campaignId: 'camp_123',
      amount: 2500,
      campaignTitle: 'Winter Blanket Drive',
    });
  });
});
