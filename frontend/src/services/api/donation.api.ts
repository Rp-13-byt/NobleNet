import { apiClient } from '../apiClient';

export interface InitiateDonationPayload {
  campaignId: string;
  amount: number;
  anonymous?: boolean;
}

export interface InitiateDonationResponse {
  donationId: string;
  orderId: string;
  amount: number;
  currency: string;
  keyId?: string;
}

export const donationApi = {
  initiate: (payload: InitiateDonationPayload, idempotencyKey?: string): Promise<InitiateDonationResponse> => {
    const headers: Record<string, string> = {};
    if (idempotencyKey) headers['Idempotency-Key'] = idempotencyKey;
    return apiClient.post<InitiateDonationResponse>('/donations', payload, { headers });
  },

  getMyDonations: (page = 1, limit = 20) => {
    return apiClient.get(`/donations/my?page=${page}&limit=${limit}`);
  },

  getById: (id: string) => {
    return apiClient.get(`/donations/${id}`);
  },
};
