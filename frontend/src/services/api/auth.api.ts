import { apiClient } from '../apiClient';

export const authApi = {
  login: (email: string, pass: string) => apiClient.post('/auth/login', { email, password: pass }),
  register: (name: string, email: string, pass: string, role: string) => apiClient.post('/auth/register', { name, email, password: pass, role }),
  me: () => apiClient.get('/auth/me'),
  logout: () => apiClient.post('/auth/logout', {}),
};
