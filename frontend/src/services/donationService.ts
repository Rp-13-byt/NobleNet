import { apiClient } from './apiClient';

export interface DonationInitiateResponse {
  donationId: string;
  orderId: string;
  amount: number;
  currency: string;
  keyId?: string;
}

export interface MyDonation {
  _id: string;
  campaignId: {
    _id: string;
    title: string;
  };
  amount: number;
  currency: string;
  paymentStatus: string;
  transactionReference: string;
  createdAt: string;
}

export const donationService = {
  async initiate(campaignId: string, amount: number, anonymous = false): Promise<DonationInitiateResponse> {
    return apiClient.post<DonationInitiateResponse>('/donations', { campaignId, amount, anonymous });
  },

  async verify(orderIdOrDonationId: string, paymentId: string, signature: string): Promise<any> {
    return apiClient.post('/payments/verify', {
      orderId: orderIdOrDonationId,
      donationId: orderIdOrDonationId,
      paymentId,
      signature,
    });
  },

  async getStatus(donationId: string): Promise<{ donationStatus: string; paymentStatus: string; receiptAvailable: boolean; receiptId?: string }> {
    return apiClient.get(`/donations/${donationId}/status`);
  },

  async getMyDonations(): Promise<MyDonation[]> {
    const res = await apiClient.get<{ data: MyDonation[]; meta: any }>('/donations/my');
    return res?.data || [];
  },
};
