import { apiClient } from './apiClient';

export interface BackendNgo {
  _id: string;
  id?: string;
  userId: any;
  organizationName: string;
  registrationNumber: string;
  description: string;
  address: string;
  contactEmail: string;
  contactPhone: string;
  website?: string;
  documents?: string[];
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  verificationNotes?: string;
  createdAt: string;
}

export interface NGO {
  id: string;
  name: string;
  mission: string;
  about: string;
  location: string;
  logoUrl: string;
  coverUrl: string;
  isVerified: boolean;
  rating: number;
  establishedYear: number;
  categories: string[];
  contactEmail: string;
  contactPhone: string;
  website?: string;
  registrationNumber: string;
  stats: {
    activeCampaigns: number;
    totalImpact: string;
    volunteersEngaged: number;
  };
  raw?: BackendNgo;
}

function mapBackendNgo(b: BackendNgo): NGO {
  const id = b.id || b._id;
  const isVerified = b.status === 'APPROVED';

  return {
    id,
    name: b.organizationName,
    mission: b.description.slice(0, 100) + '...',
    about: b.description,
    location: b.address,
    logoUrl: 'https://images.unsplash.com/photo-1599305445671-ac291c95aaa9?w=200&h=200&fit=crop',
    coverUrl: 'https://images.unsplash.com/photo-1577896851231-70ef18881754?q=80&w=1200&auto=format&fit=crop',
    isVerified,
    rating: 4.9,
    establishedYear: 2018,
    categories: ['Community Impact', 'Social Welfare'],
    contactEmail: b.contactEmail,
    contactPhone: b.contactPhone,
    website: b.website,
    registrationNumber: b.registrationNumber,
    stats: {
      activeCampaigns: 2,
      totalImpact: '10,000+ Beneficiaries',
      volunteersEngaged: 150,
    },
    raw: b,
  };
}

export const ngoService = {
  async getNgos(search?: string): Promise<NGO[]> {
    const params = new URLSearchParams();
    if (search) params.append('search', search);

    const queryStr = params.toString() ? `?${params.toString()}` : '';
    const res = await apiClient.get<{ data: BackendNgo[]; meta: any } | BackendNgo[]>(`/ngos${queryStr}`);
    const items = Array.isArray(res) ? res : res?.data || [];
    return items.map(mapBackendNgo);
  },

  async getNgoById(id: string): Promise<NGO | undefined> {
    try {
      const res = await apiClient.get<BackendNgo>(`/ngos/${id}`);
      return mapBackendNgo(res);
    } catch {
      return undefined;
    }
  },

  async getProfile(): Promise<BackendNgo> {
    return apiClient.get<BackendNgo>('/ngos/profile');
  },

  async getMyNgoProfile(): Promise<BackendNgo> {
    return apiClient.get<BackendNgo>('/ngos/profile');
  },

  async register(data: {
    organizationName: string;
    registrationNumber: string;
    description: string;
    address: string;
    contactEmail: string;
    contactPhone: string;
    website?: string;
    documents?: string[];
  }): Promise<BackendNgo> {
    return apiClient.post<BackendNgo>('/ngos/register', data);
  },
};
