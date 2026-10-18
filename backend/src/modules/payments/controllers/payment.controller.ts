import { Request, Response, NextFunction } from 'express';
import { PaymentService } from '../services/payment.service';

export class PaymentController {
  static async createOrder(req: Request, res: Response, next: NextFunction) {
    try {
      const { donationId } = req.body;
      const idempotencyKey = req.headers['idempotency-key'] as string;
      const result = await PaymentService.createOrder(donationId, idempotencyKey, req.user?.id);
      res.status(200).json({
        success: true,
        message: 'Payment order created successfully',
        data: result,
      });
    } catch (e) {
      next(e);
    }
  }

  static async verify(req: Request, res: Response, next: NextFunction) {
    try {
      const { donationId, orderId, paymentId, signature, razorpay_order_id, razorpay_payment_id, razorpay_signature, amountInPaise } = req.body;
      const finalOrderId = orderId || razorpay_order_id;
      const finalPaymentId = paymentId || razorpay_payment_id;
      const finalSignature = signature || razorpay_signature;
      const idempotencyKey = req.headers['idempotency-key'] as string;

      const result = await PaymentService.verify(
        donationId,
        finalOrderId,
        finalPaymentId,
        finalSignature,
        idempotencyKey,
        amountInPaise
      );

      res.status(200).json({
        success: true,
        message: result.alreadyProcessed ? 'Payment already captured' : 'Payment verified successfully',
        data: result,
      });
    } catch (e) {
      next(e);
    }
  }

  static async webhook(req: Request, res: Response, next: NextFunction) {
    try {
      const signature = (req.headers['x-razorpay-signature'] || req.headers['x-webhook-signature']) as string;
      const rawBody = (req as any).rawBody || Buffer.from(JSON.stringify(req.body));
      const result = await PaymentService.processWebhook(rawBody, signature, req.body);
      res.status(200).json({ success: true, ...result });
    } catch (e) {
      next(e);
    }
  }

  static async refund(req: Request, res: Response, next: NextFunction) {
    try {
      const paymentId = (req.params.paymentId || req.params.id) as string;
      const { amount, reason } = req.body;
      const result = await PaymentService.refund(paymentId, amount, reason, req.user?.id, req.user?.role);
      res.status(200).json({
        success: true,
        message: 'Refund processed successfully',
        data: result,
      });
    } catch (e) {
      next(e);
    }
  }
}
