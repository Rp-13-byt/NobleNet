import { apiClient } from '../apiClient';

export const adminApi = {
  getStats: () => apiClient.get('/admin/stats'),
  getUsers: (page = 1, limit = 20) => apiClient.get(`/admin/users?page=${page}&limit=${limit}`),
  getPendingNgos: () => apiClient.get('/admin/ngos/pending'),
  verifyNgo: (ngoId: string, notes?: string) => apiClient.put(`/admin/ngos/${ngoId}/verify`, { status: 'VERIFIED', verificationNotes: notes }),
  rejectNgo: (ngoId: string, reason: string) => apiClient.put(`/admin/ngos/${ngoId}/verify`, { status: 'REJECTED', verificationNotes: reason }),
  getAuditLogs: (page = 1, limit = 50) => apiClient.get(`/admin/audit-logs?page=${page}&limit=${limit}`),
};
