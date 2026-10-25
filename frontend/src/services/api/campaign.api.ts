import { apiClient } from '../apiClient';

export const campaignApi = {
  getAll: (category?: string, search?: string, page = 1, limit = 20) => {
    const params = new URLSearchParams();
    if (category && category !== 'all') params.append('category', category);
    if (search) params.append('search', search);
    params.append('page', page.toString());
    params.append('limit', limit.toString());
    return apiClient.get(`/campaigns?${params.toString()}`);
  },

  getById: (id: string) => {
    return apiClient.get(`/campaigns/${id}`);
  },

  create: (data: any) => {
    return apiClient.post('/campaigns', data);
  },

  update: (id: string, data: any) => {
    return apiClient.put(`/campaigns/${id}`, data);
  },
};
