export interface CreateOrderResult {
  orderId: string;
  amount: number; // in INR
  amountInPaise: number; // in paise
  currency: string;
  gateway: string;
  keyId?: string;
}

export interface VerifyPaymentData {
  orderId: string;
  paymentId: string;
  signature: string;
  amountInPaise?: number;
}

export interface PaymentProvider {
  createOrder(amount: number, currency: string, receiptId: string): Promise<CreateOrderResult>;
  verifyPayment(data: VerifyPaymentData): Promise<boolean>;
  verifyWebhookSignature(rawBody: Buffer, signature: string): boolean;
  refundPayment(paymentId: string, amountInPaise?: number): Promise<{ success: boolean; refundId: string }>;
  fetchPayment(paymentId: string): Promise<{ id: string; status: string; amount: number; currency: string } | null>;
}
