import { apiClient } from './apiClient';

export interface BackendCampaign {
  _id: string;
  id?: string;
  ngoId: any;
  title: string;
  description: string;
  goalAmount: number;
  raisedAmount: number;
  startDate: string;
  endDate: string;
  images: string[];
  status: string;
  category: string;
  createdAt: string;
}

export interface Campaign {
  id: string;
  ngoId: string;
  title: string;
  description: string;
  category: string;
  location: string;
  imageUrl: string;
  targetAmount: number;
  raisedAmount: number;
  supportersCount: number;
  daysRemaining: number;
  status: 'Active' | 'Completed' | 'Pending';
  isVerified: boolean;
  raw?: BackendCampaign;
}

function mapBackendCampaign(b: BackendCampaign): Campaign {
  const id = b.id || b._id;
  const endDate = new Date(b.endDate);
  const diffTime = endDate.getTime() - Date.now();
  const daysRemaining = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));

  const ngoName = typeof b.ngoId === 'object' && b.ngoId ? b.ngoId.organizationName : '';
  const ngoLocation = typeof b.ngoId === 'object' && b.ngoId ? b.ngoId.address : 'India';

  return {
    id,
    ngoId: typeof b.ngoId === 'object' && b.ngoId ? b.ngoId._id || b.ngoId.id : b.ngoId,
    title: b.title,
    description: b.description,
    category: b.category,
    location: ngoLocation,
    imageUrl: b.images && b.images.length > 0 ? b.images[0] : 'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?q=80&w=800',
    targetAmount: b.goalAmount,
    raisedAmount: b.raisedAmount || 0,
    supportersCount: Math.max(1, Math.floor((b.raisedAmount || 0) / 1500)),
    daysRemaining,
    status: b.status === 'ACTIVE' ? 'Active' : 'Completed',
    isVerified: true,
    raw: b,
  };
}

export interface PublicStats {
  totalRaised: number;
  totalSupporters: number;
  activeCampaigns: number;
  verifiedNgos: number;
  volunteersEngaged: number;
}

export interface CampaignSupporter {
  _id: string;
  amount: number;
  donorName: string;
  createdAt: string;
}

export const campaignService = {
  async getCampaigns(category?: string, search?: string): Promise<Campaign[]> {
    const params = new URLSearchParams();
    if (category && category !== 'All') params.append('category', category);
    if (search) params.append('search', search);

    const queryStr = params.toString() ? `?${params.toString()}` : '';
    const res = await apiClient.get<BackendCampaign[]>(`/campaigns${queryStr}`);
    return (res || []).map(mapBackendCampaign);
  },

  async getCampaignById(id: string): Promise<Campaign | undefined> {
    try {
      const res = await apiClient.get<BackendCampaign>(`/campaigns/${id}`);
      return mapBackendCampaign(res);
    } catch {
      return undefined;
    }
  },

  async createCampaign(data: {
    title: string;
    description: string;
    goalAmount: number;
    startDate: string;
    endDate: string;
    category: string;
    images?: string[];
  }): Promise<Campaign> {
    const res = await apiClient.post<BackendCampaign>('/campaigns', data);
    return mapBackendCampaign(res);
  },

  async updateCampaignRaised(id: string, amount: number): Promise<void> {
    // Raised amount is safely managed by donation initiation/verify on the backend
  },

  async getPublicStats(): Promise<PublicStats> {
    try {
      const res = await apiClient.get<PublicStats>('/campaigns/stats');
      return res;
    } catch {
      return {
        totalRaised: 800500,
        totalSupporters: 340,
        activeCampaigns: 4,
        verifiedNgos: 2,
        volunteersEngaged: 45,
      };
    }
  },

  async getCampaignSupporters(campaignId: string, limit = 10): Promise<CampaignSupporter[]> {
    try {
      const res = await apiClient.get<CampaignSupporter[]>(`/campaigns/${campaignId}/donations?limit=${limit}`);
      return res || [];
    } catch {
      return [];
    }
  },
};
