import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { PaymentController } from '../controllers/payment.controller';
import { authenticate, authorize } from '../../../core/middleware/authenticate';

const router = Router();
const isTest = process.env.NODE_ENV === 'test';

// Gateway Abuse Protection: Max 15 order creation attempts per 5 minutes
const orderCreationLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 15,
  skip: () => isTest,
  message: {
    success: false,
    message: 'Too many payment order attempts. Please wait 5 minutes before trying again.',
    error: { code: 'ORDER_RATE_LIMIT_EXCEEDED' },
  },
});

router.post('/order', authenticate, orderCreationLimiter, PaymentController.createOrder);
router.post('/verify', authenticate, PaymentController.verify);
router.post('/webhook/razorpay', PaymentController.webhook);
router.post('/:paymentId/refund', authenticate, authorize('SUPER_ADMIN'), PaymentController.refund);

export default router;
