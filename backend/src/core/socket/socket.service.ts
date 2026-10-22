import { Server as SocketIOServer, Socket } from 'socket.io';
import { Server as HttpServer } from 'http';
import jwt from 'jsonwebtoken';
import { env } from '../../config/env';
import { logger } from '../utils/logger';

export class SocketService {
  private static io: SocketIOServer | null = null;

  static init(httpServer: HttpServer): SocketIOServer {
    this.io = new SocketIOServer(httpServer, {
      cors: {
        origin: env.CLIENT_URL || '*',
        credentials: true,
      },
      pingTimeout: 30000,
      pingInterval: 25000,
    });

    this.io.use((socket: Socket, next) => {
      try {
        const token =
          socket.handshake.auth?.token ||
          socket.handshake.headers?.authorization?.replace('Bearer ', '') ||
          socket.handshake.query?.token;

        if (token && typeof token === 'string') {
          const secret = env.JWT_ACCESS_SECRET;
          const decoded = jwt.verify(token, secret) as any;
          (socket as any).user = decoded;
        }
        next();
      } catch (err: any) {
        // Allow unauthenticated connections for public live updates (e.g. campaign totals)
        next();
      }
    });

    this.io.on('connection', (socket: Socket) => {
      const user = (socket as any).user;
      const userId = user?.id || user?.userId;
      logger.info({ socketId: socket.id, userId }, '[SOCKET] Client connected');

      if (userId) {
        socket.join(`user:${userId}`);
      }
      if (user?.role) {
        socket.join(`role:${user.role}`);
      }

      socket.on('join', (room: string) => {
        if (!room || typeof room !== 'string') return;
        const trimmed = room.trim();

        // 1. Public rooms permitted for any client
        if (
          trimmed.startsWith('campaign:') ||
          trimmed.startsWith('wishlist:') ||
          trimmed === 'public'
        ) {
          socket.join(trimmed);
          return;
        }

        // 2. Private rooms require matching authenticated identity or SUPER_ADMIN
        if (user?.role === 'SUPER_ADMIN') {
          socket.join(trimmed);
          return;
        }

        if (userId && trimmed === `user:${userId}`) {
          socket.join(trimmed);
          return;
        }

        if (user?.role && trimmed === `role:${user.role}`) {
          socket.join(trimmed);
          return;
        }

        // Unauthorized room join attempt rejected
        logger.warn(
          { socketId: socket.id, userId: user?.id, attemptedRoom: trimmed },
          '[SOCKET] Unauthorized room join rejected'
        );
        socket.emit('error', { message: 'Unauthorized: Cannot join requested private room' });
      });

      socket.on('leave', (room: string) => {
        if (typeof room === 'string' && room.trim()) {
          socket.leave(room);
        }
      });

      socket.on('disconnect', () => {
        logger.info({ socketId: socket.id }, '[SOCKET] Client disconnected');
      });
    });

    logger.info('⚡ Socket.IO real-time server initialized');
    return this.io;
  }

  static getIO(): SocketIOServer {
    if (!this.io) {
      throw new Error('Socket.IO has not been initialized. Call SocketService.init() first.');
    }
    return this.io;
  }

  static emitToAll(event: string, payload: any) {
    if (this.io) {
      this.io.emit(event, payload);
    }
  }

  static emitToUser(userId: string, event: string, payload: any) {
    if (this.io) {
      this.io.to(`user:${userId}`).emit(event, payload);
    }
  }

  static emitToRole(role: string, event: string, payload: any) {
    if (this.io) {
      this.io.to(`role:${role}`).emit(event, payload);
    }
  }

  static emitToRoom(room: string, event: string, payload: any) {
    if (this.io) {
      this.io.to(room).emit(event, payload);
    }
  }
}
