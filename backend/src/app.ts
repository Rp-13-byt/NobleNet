import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import mongoose from 'mongoose';
import { env } from './config/env';
import { errorHandler } from './core/middleware/errorHandler';
import { correlationIdMiddleware } from './core/middleware/correlationId';
import { authenticate, authorize } from './core/middleware/authenticate';
import { UserRole } from './modules/users/models/User';

// Route imports
import authRoutes from './modules/auth/routes/auth.routes';
import ngoRoutes from './modules/ngos/routes/ngo.routes';
import campaignRoutes from './modules/campaigns/routes/campaign.routes';
import wishlistRoutes from './modules/wishlists/routes/wishlist.routes';
import donationRoutes from './modules/donations/routes/donation.routes';
import paymentRoutes from './modules/payments/routes/payment.routes';
import volunteerRoutes from './modules/volunteering/routes/volunteer.routes';
import impactRoutes from './modules/impact/routes/impact.routes';
import reviewRoutes from './modules/reviews/routes/review.routes';
import notificationRoutes from './modules/notifications/routes/notification.routes';
import adminRoutes from './modules/admin/routes/admin.routes';
import dashboardRoutes from './modules/dashboard/routes/dashboard.routes';
import { DashboardController } from './modules/dashboard/controllers/dashboard.controller';

const app = express();

// Security Middlewares
app.use(helmet());
app.use(
  cors({
    origin: env.CLIENT_URL || '*',
    credentials: true,
  })
);

// Correlation ID
app.use(correlationIdMiddleware);

// Tiered Rate Limiters
const isTest = process.env.NODE_ENV === 'test';

const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200,
  skip: () => isTest,
  message: { success: false, message: 'Too many requests, please try again later.', error: { code: 'RATE_LIMIT_EXCEEDED' } },
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  skip: () => isTest,
  message: { success: false, message: 'Too many authentication attempts, please try again later.', error: { code: 'AUTH_RATE_LIMIT' } },
});

const paymentLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 50,
  skip: () => isTest,
  message: { success: false, message: 'Too many payment requests, please try again later.', error: { code: 'PAYMENT_RATE_LIMIT' } },
});

app.use(generalLimiter);

// Express body parsers
app.use(
  express.json({
    limit: '2mb',
    verify: (req: any, _res, buf) => {
      req.rawBody = buf;
    },
  })
);
app.use(express.urlencoded({ extended: true, limit: '2mb' }));

// Health & Readiness Probes
app.get('/health', (req: Request, res: Response) => {
  const isMongoReady = mongoose.connection.readyState === 1;
  res.status(isMongoReady ? 200 : 503).json({
    success: isMongoReady,
    status: isMongoReady ? 'healthy' : 'degraded',
    message: isMongoReady ? 'API and database are healthy' : 'Database connection error',
    database: {
      status: isMongoReady ? 'connected' : 'disconnected',
      ready: isMongoReady,
    },
    timestamp: new Date().toISOString(),
  });
});

app.get('/ready', (req: Request, res: Response) => {
  const isMongoReady = mongoose.connection.readyState === 1;
  if (!isMongoReady) {
    return res.status(503).json({
      success: false,
      message: 'Service unavailable: MongoDB is not connected',
      status: { mongo: isMongoReady },
    });
  }

  res.status(200).json({
    success: true,
    message: 'All core subsystems ready',
    status: { mongo: true },
  });
});

// Mount API Routes
app.use('/api/v1/auth', authLimiter, authRoutes);
app.use('/api/v1/ngos', ngoRoutes);
app.use('/api/v1/campaigns', campaignRoutes);
app.use('/api/v1/wishlists', wishlistRoutes);
app.use('/api/v1/donations', paymentLimiter, donationRoutes);
app.use('/api/v1/payments', paymentLimiter, paymentRoutes);
app.use('/api/v1/volunteering', volunteerRoutes);
app.use('/api/v1/impact', impactRoutes);
app.use('/api/v1/reviews', reviewRoutes);
app.use('/api/v1/notifications', notificationRoutes);
app.use('/api/v1/admin', adminRoutes);

// Dedicated Dashboard Endpoints
app.use('/api/v1/dashboard', dashboardRoutes);
app.use('/api/v1/ngo/dashboard', authenticate, authorize(UserRole.NGO), DashboardController.getNgoDashboard);
app.use('/api/v1/admin/dashboard', authenticate, authorize(UserRole.SUPER_ADMIN), DashboardController.getAdminDashboard);
app.use('/api/v1/user/dashboard', authenticate, DashboardController.getUserDashboard);

// Global Error Handler
app.use(errorHandler);

export default app;
