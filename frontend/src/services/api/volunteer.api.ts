import { apiClient } from '../apiClient';

export const volunteerApi = {
  getOpportunities: (category?: string, location?: string) => {
    const params = new URLSearchParams();
    if (category) params.append('category', category);
    if (location) params.append('location', location);
    return apiClient.get(`/volunteering?${params.toString()}`);
  },

  getById: (id: string) => {
    return apiClient.get(`/volunteering/${id}`);
  },

  apply: (opportunityId: string, data: any) => {
    return apiClient.post(`/volunteering/${opportunityId}/apply`, data);
  },

  getMyApplications: () => {
    return apiClient.get('/volunteering/applications/my');
  },

  getNgoApplications: () => {
    return apiClient.get('/volunteering/applications/ngo');
  },

  updateStatus: (applicationId: string, status: 'APPROVED' | 'REJECTED') => {
    return apiClient.put(`/volunteering/applications/${applicationId}/status`, { status });
  },
};
