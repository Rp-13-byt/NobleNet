import { apiClient } from './apiClient';

export interface User {
  id: string;
  _id?: string;
  name: string;
  email: string;
  role: 'USER' | 'NGO' | 'SUPER_ADMIN';
  avatarUrl?: string;
  profileImage?: string;
  ngoId?: string;
  city?: string;
  state?: string;
  isVerified?: boolean;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

export const authService = {
  async login(email: string, password: string): Promise<AuthResponse> {
    const data = await apiClient.post<AuthResponse>('/auth/login', { email, password });
    return {
      ...data,
      user: {
        ...data.user,
        id: data.user.id || (data.user as any)._id,
      },
    };
  },

  async register(name: string, email: string, password: string, role: 'USER' | 'NGO'): Promise<AuthResponse> {
    const data = await apiClient.post<AuthResponse>('/auth/register', { name, email, password, role });
    return {
      ...data,
      user: {
        ...data.user,
        id: data.user.id || (data.user as any)._id,
      },
    };
  },

  async getMe(): Promise<{ user: User }> {
    const data = await apiClient.get<{ user: User }>('/auth/me');
    return {
      user: {
        ...data.user,
        id: data.user.id || (data.user as any)._id,
      },
    };
  },

  async refreshToken(refreshToken: string): Promise<{ accessToken: string; refreshToken: string }> {
    return apiClient.post<{ accessToken: string; refreshToken: string }>('/auth/refresh', { refreshToken });
  },
};
