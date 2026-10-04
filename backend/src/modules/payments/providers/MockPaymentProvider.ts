import { PaymentProvider, CreateOrderResult, VerifyPaymentData } from './PaymentProvider';
import crypto from 'crypto';

export type MockOutcome = 'SUCCESS' | 'FAILED' | 'PENDING';

export class MockPaymentProvider implements PaymentProvider {
  public outcome: MockOutcome = 'SUCCESS';

  setOutcome(outcome: MockOutcome) {
    this.outcome = outcome;
  }

  async createOrder(amount: number, currency = 'INR', receiptId: string): Promise<CreateOrderResult> {
    await new Promise(r => setTimeout(r, 20));
    const orderId = `mock_order_${crypto.randomBytes(10).toString('hex')}`;
    return {
      orderId,
      amount,
      amountInPaise: Math.round(amount * 100),
      currency,
      gateway: 'mock',
      keyId: 'mock_public_key',
    };
  }

  async verifyPayment(data: VerifyPaymentData): Promise<boolean> {
    await new Promise(r => setTimeout(r, 20));
    if (this.outcome === 'FAILED' || this.outcome === 'PENDING') return false;

    // Reject invalid signatures deterministically
    if (!data.signature || data.signature.startsWith('invalid_')) {
      return false;
    }
    return true;
  }

  verifyWebhookSignature(rawBody: Buffer, signature: string): boolean {
    if (!signature || signature.startsWith('invalid_') || signature === 'invalid_webhook_sig' || !rawBody) {
      return false;
    }
    return true;
  }

  async refundPayment(paymentId: string, amountInPaise?: number): Promise<{ success: boolean; refundId: string }> {
    await new Promise(r => setTimeout(r, 20));
    if (this.outcome === 'FAILED') {
      return { success: false, refundId: '' };
    }
    return {
      success: true,
      refundId: `mock_rfnd_${crypto.randomBytes(8).toString('hex')}`,
    };
  }

  async fetchPayment(paymentId: string): Promise<{ id: string; status: string; amount: number; currency: string } | null> {
    return {
      id: paymentId,
      status: this.outcome === 'SUCCESS' ? 'captured' : 'failed',
      amount: 50000, // 500 INR in paise
      currency: 'INR',
    };
  }
}
