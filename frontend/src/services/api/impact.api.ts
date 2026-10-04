import { apiClient } from '../apiClient';

export const impactApi = {
  getByNgo: (ngoId: string) => apiClient.get(`/impact/ngo/${ngoId}`),
  create: (data: any) => apiClient.post('/impact', data),
};
