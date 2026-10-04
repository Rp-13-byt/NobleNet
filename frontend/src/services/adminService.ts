import { apiClient } from './apiClient';

export interface AdminStats {
  users: { total: number };
  ngos: { total: number; pending: number; approved: number };
  campaigns: { total: number; active: number };
  donations: { totalAmount: number; count: number };
  volunteering: { opportunities: number; applications: number };
  items: { totalDonations: number };
}

export interface PendingNgo {
  _id: string;
  organizationName: string;
  registrationNumber: string;
  description: string;
  address: string;
  contactEmail: string;
  contactPhone: string;
  website?: string;
  documents?: string[];
  status: string;
  createdAt: string;
  userId?: {
    name: string;
    email: string;
  };
}

export interface AdminUser {
  _id: string;
  name: string;
  email: string;
  role: 'USER' | 'NGO' | 'SUPER_ADMIN';
  status: 'ACTIVE' | 'SUSPENDED';
  isVerified: boolean;
  createdAt: string;
  lastLoginAt?: string;
}

export interface AdminCampaign {
  _id: string;
  title: string;
  category: string;
  targetAmount: number;
  raisedAmount: number;
  status: 'ACTIVE' | 'PAUSED' | 'COMPLETED' | 'CANCELLED';
  ngoId?: {
    _id: string;
    organizationName: string;
  };
  createdAt: string;
}

export interface AdminDonation {
  _id: string;
  amount: number;
  currency: string;
  status: string;
  donorName?: string;
  donorEmail?: string;
  isAnonymous: boolean;
  userId?: {
    name: string;
    email: string;
  };
  campaignId?: {
    _id: string;
    title: string;
  };
  paymentId?: {
    _id: string;
    provider: string;
    providerPaymentId?: string;
    status: string;
    amount: number;
  };
  createdAt: string;
}

export interface AuditLog {
  _id: string;
  action: string;
  resource: string;
  resourceId?: string;
  details?: any;
  createdAt: string;
  userId?: {
    name: string;
    email: string;
    role: string;
  };
}

export const adminService = {
  async getStats(): Promise<AdminStats> {
    const res = await apiClient.get<any>('/admin/stats');
    return res.data || res;
  },

  async getPendingNgos(): Promise<PendingNgo[]> {
    const res = await apiClient.get<{ data: PendingNgo[]; meta: any }>('/admin/ngos/pending');
    return res?.data || [];
  },

  async getAllNgos(page = 1, limit = 20, status?: string, search?: string): Promise<{ data: any[]; meta: any }> {
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (status && status !== 'ALL') params.set('status', status);
    if (search) params.set('search', search);
    return apiClient.get(`/admin/ngos?${params.toString()}`);
  },

  async reviewNgo(ngoId: string, status: 'APPROVED' | 'REJECTED', verificationNotes: string): Promise<any> {
    return apiClient.patch(`/admin/ngos/${ngoId}/review`, { status, verificationNotes });
  },

  async getUsers(page = 1, limit = 20, role?: string, status?: string): Promise<{ data: AdminUser[]; meta: any }> {
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (role && role !== 'ALL') params.set('role', role);
    if (status && status !== 'ALL') params.set('status', status);
    return apiClient.get(`/admin/users?${params.toString()}`);
  },

  async updateUserStatus(userId: string, status: 'ACTIVE' | 'SUSPENDED'): Promise<any> {
    return apiClient.patch(`/admin/users/${userId}/status`, { status });
  },

  async getCampaigns(page = 1, limit = 20, status?: string, search?: string): Promise<{ data: AdminCampaign[]; meta: any }> {
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (status && status !== 'ALL') params.set('status', status);
    if (search) params.set('search', search);
    return apiClient.get(`/admin/campaigns?${params.toString()}`);
  },

  async moderateCampaign(campaignId: string, status: string, reason?: string): Promise<any> {
    return apiClient.patch(`/admin/campaigns/${campaignId}/moderate`, { status, reason });
  },

  async getDonations(page = 1, limit = 20, status?: string): Promise<{ data: AdminDonation[]; meta: any }> {
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (status && status !== 'ALL') params.set('status', status);
    return apiClient.get(`/admin/donations?${params.toString()}`);
  },

  async refundPayment(paymentId: string, reason?: string, amount?: number): Promise<any> {
    return apiClient.post(`/admin/payments/${paymentId}/refund`, { reason, amount });
  },

  async getAuditLogs(page = 1, limit = 50, action?: string, resource?: string): Promise<AuditLog[]> {
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (action) params.set('action', action);
    if (resource) params.set('resource', resource);
    const res = await apiClient.get<{ data: AuditLog[]; meta: any }>(`/admin/audit-logs?${params.toString()}`);
    return res?.data || [];
  },
};
