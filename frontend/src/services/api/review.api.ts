import { apiClient } from '../apiClient';

export const reviewApi = {
  getByNgo: (ngoId: string) => apiClient.get(`/reviews/ngo/${ngoId}`),
  create: (data: { ngoId: string; rating: number; comment: string; campaignId?: string }) => apiClient.post('/reviews', data),
};
