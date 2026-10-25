import { apiClient } from '../apiClient';

export const ngoApi = {
  getAll: (page = 1, limit = 20, search?: string) => {
    const params = new URLSearchParams({ page: page.toString(), limit: limit.toString() });
    if (search) params.append('search', search);
    return apiClient.get(`/ngos?${params.toString()}`);
  },

  getById: (id: string) => {
    return apiClient.get(`/ngos/${id}`);
  },

  getMyProfile: () => {
    return apiClient.get('/ngos/profile');
  },

  register: (data: any) => {
    return apiClient.post('/ngos/register', data);
  },
};
