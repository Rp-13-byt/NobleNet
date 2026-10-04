import { apiClient } from '../apiClient';

export const userApi = {
  getProfile: () => apiClient.get('/auth/me'),
  updateProfile: (data: any) => apiClient.put('/users/profile', data),
};
