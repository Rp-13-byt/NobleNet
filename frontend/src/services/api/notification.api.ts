import { apiClient } from '../apiClient';

export const notificationApi = {
  getAll: () => apiClient.get('/notifications'),
  markAsRead: (id: string) => apiClient.put(`/notifications/${id}/read`, {}),
};
