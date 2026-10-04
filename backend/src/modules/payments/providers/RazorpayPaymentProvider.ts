import { PaymentProvider, CreateOrderResult, VerifyPaymentData } from './PaymentProvider';
import { env } from '../../../config/env';
import crypto from 'crypto';

export class RazorpayPaymentProvider implements PaymentProvider {
  private keyId: string;
  private keySecret: string;
  private webhookSecret: string;

  constructor() {
    this.keyId = env.RAZORPAY_KEY_ID || '';
    this.keySecret = env.RAZORPAY_KEY_SECRET || '';
    this.webhookSecret = env.RAZORPAY_WEBHOOK_SECRET || '';
  }

  async createOrder(amount: number, currency = 'INR', receiptId: string): Promise<CreateOrderResult> {
    const amountInPaise = Math.round(amount * 100);
    const auth = Buffer.from(`${this.keyId}:${this.keySecret}`).toString('base64');

    const response = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: amountInPaise,
        currency,
        receipt: receiptId,
        payment_capture: 1, // Auto-capture upon successful authorization
      }),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error?.description || 'Razorpay order creation failed at gateway');
    }

    const data = await response.json();
    return {
      orderId: data.id,
      amount,
      amountInPaise,
      currency,
      gateway: 'razorpay',
      keyId: this.keyId,
    };
  }

  async verifyPayment(data: VerifyPaymentData): Promise<boolean> {
    if (!data.orderId || !data.paymentId || !data.signature || !this.keySecret) {
      return false;
    }

    // Razorpay standard client checkout signature: HMAC-SHA256(order_id + "|" + payment_id, secret)
    const payload = `${data.orderId}|${data.paymentId}`;
    const expectedSignature = crypto
      .createHmac('sha256', this.keySecret)
      .update(payload)
      .digest('hex');

    try {
      return crypto.timingSafeEqual(
        Buffer.from(expectedSignature, 'utf8'),
        Buffer.from(data.signature, 'utf8')
      );
    } catch {
      return false;
    }
  }

  verifyWebhookSignature(rawBody: Buffer, signature: string): boolean {
    if (!signature || !this.webhookSecret || !rawBody) return false;

    // Razorpay webhook signature: HMAC-SHA256(rawBody, webhookSecret)
    const expectedSignature = crypto
      .createHmac('sha256', this.webhookSecret)
      .update(rawBody)
      .digest('hex');

    try {
      return crypto.timingSafeEqual(
        Buffer.from(expectedSignature, 'utf8'),
        Buffer.from(signature, 'utf8')
      );
    } catch {
      return false;
    }
  }

  async refundPayment(paymentId: string, amountInPaise?: number): Promise<{ success: boolean; refundId: string }> {
    const auth = Buffer.from(`${this.keyId}:${this.keySecret}`).toString('base64');
    const body: Record<string, any> = {};
    if (amountInPaise) body.amount = amountInPaise;

    const response = await fetch(`https://api.razorpay.com/v1/payments/${paymentId}/refund`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error?.description || 'Razorpay refund failed');
    }

    const data = await response.json();
    return { success: true, refundId: data.id };
  }

  async fetchPayment(paymentId: string): Promise<{ id: string; status: string; amount: number; currency: string } | null> {
    const auth = Buffer.from(`${this.keyId}:${this.keySecret}`).toString('base64');
    const response = await fetch(`https://api.razorpay.com/v1/payments/${paymentId}`, {
      method: 'GET',
      headers: { 'Authorization': `Basic ${auth}` },
    });

    if (!response.ok) return null;
    const data = await response.json();
    return {
      id: data.id,
      status: data.status, // 'captured', 'failed', 'authorized', etc.
      amount: data.amount, // in paise
      currency: data.currency,
    };
  }
}
