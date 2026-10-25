import { apiClient } from '../apiClient';

export interface CreateOrderPayload {
  donationId: string;
}

export interface CreateOrderResponse {
  donationId: string;
  orderId: string;
  amount: number;
  amountInPaise: number;
  currency: string;
  gateway: string;
  keyId?: string;
}

export interface VerifyPaymentPayload {
  donationId?: string;
  orderId: string;
  paymentId: string;
  signature: string;
  amountInPaise?: number;
}

export interface PaymentStatusResponse {
  donation: {
    id: string;
    status: string;
    amount: number;
    currency: string;
    campaignTitle: string;
    createdAt: string;
  };
  payment: {
    id?: string;
    status: string;
    gateway: string;
    orderId?: string;
    paymentId?: string;
    refundedAmount?: number;
    paidAt?: string;
    failureReason?: string;
  };
  receipt: {
    available: boolean;
    id?: string;
    receiptNumber?: string;
  };
}

export const paymentApi = {
  createOrder: (payload: CreateOrderPayload, idempotencyKey?: string): Promise<CreateOrderResponse> => {
    const headers: Record<string, string> = {};
    if (idempotencyKey) headers['Idempotency-Key'] = idempotencyKey;
    return apiClient.post<CreateOrderResponse>('/payments/order', payload, { headers });
  },

  verify: (data: VerifyPaymentPayload, idempotencyKey?: string) => {
    const headers: Record<string, string> = {};
    if (idempotencyKey) headers['Idempotency-Key'] = idempotencyKey;
    return apiClient.post('/payments/verify', data, { headers });
  },

  getStatus: (donationId: string): Promise<PaymentStatusResponse> => {
    return apiClient.get<PaymentStatusResponse>(`/donations/${donationId}/status`);
  },

  getReceipt: (donationId: string) => {
    return apiClient.get(`/donations/${donationId}/receipt`);
  },

  refund: (paymentId: string, amount?: number, reason?: string) => {
    return apiClient.post(`/admin/payments/${paymentId}/refund`, { amount, reason });
  },
};
