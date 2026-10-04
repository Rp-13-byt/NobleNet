import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { authService, User } from '@/services/authService';
import { queryClient } from '@/lib/queryClient';
import { disconnectSocket, reconnectSocketWithAuth } from '@/services/socketClient';

export type Role = 'USER' | 'NGO' | 'SUPER_ADMIN';
export type { User };

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (user: User, accessToken?: string, refreshToken?: string) => void;
  loginWithCredentials: (email: string, password: string) => Promise<void>;
  registerWithCredentials: (name: string, email: string, password: string, role: 'USER' | 'NGO') => Promise<void>;
  logout: () => void;
  setDemoRole: (role: Role | null) => Promise<void>;
}

const DEMO_CREDENTIALS: Record<Role, { email: string; pass: string; fallbackUser: User }> = {
  USER: {
    email: 'priya@example.com',
    pass: 'Password123!',
    fallbackUser: { id: '', name: '', email: '', role: 'USER' },
  },
  NGO: {
    email: 'contact@hopefoundation.org',
    pass: 'Password123!',
    fallbackUser: { id: '', name: '', email: '', role: 'NGO' },
  },
  SUPER_ADMIN: {
    email: 'admin@noblenet.org',
    pass: 'Password123!',
    fallbackUser: { id: '', name: '', email: '', role: 'SUPER_ADMIN' },
  },
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      login: (user, accessToken = '', refreshToken = '') => {
        set({
          user,
          accessToken: accessToken || get().accessToken,
          refreshToken: refreshToken || get().refreshToken,
          isAuthenticated: true,
          error: null,
        });
        try {
          reconnectSocketWithAuth();
        } catch {}
      },

      loginWithCredentials: async (email, password) => {
        set({ isLoading: true, error: null });
        try {
          const res = await authService.login(email, password);
          set({
            user: res.user,
            accessToken: res.accessToken,
            refreshToken: res.refreshToken,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });
          try {
            reconnectSocketWithAuth();
          } catch {}
        } catch (err: any) {
          set({ isLoading: false, error: err.message || 'Login failed' });
          throw err;
        }
      },

      registerWithCredentials: async (name, email, password, role) => {
        set({ isLoading: true, error: null });
        try {
          const res = await authService.register(name, email, password, role);
          set({
            user: res.user,
            accessToken: res.accessToken,
            refreshToken: res.refreshToken,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });
          try {
            reconnectSocketWithAuth();
          } catch {}
        } catch (err: any) {
          set({ isLoading: false, error: err.message || 'Registration failed' });
          throw err;
        }
      },

      logout: () => {
        try {
          queryClient.clear();
        } catch {}
        try {
          disconnectSocket();
        } catch {}
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false,
          error: null,
        });
      },

      setDemoRole: async (role) => {
        if (!role) {
          try {
            queryClient.clear();
          } catch {}
          try {
            disconnectSocket();
          } catch {}
          set({
            user: null,
            accessToken: null,
            refreshToken: null,
            isAuthenticated: false,
            error: null,
          });
          return;
        }

        const creds = DEMO_CREDENTIALS[role];
        set({ isLoading: true, error: null });

        try {
          // Attempt real authentication against backend
          const res = await authService.login(creds.email, creds.pass);
          set({
            user: res.user,
            accessToken: res.accessToken,
            refreshToken: res.refreshToken,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });
          try {
            reconnectSocketWithAuth();
          } catch {}
        } catch (err: any) {
          // Never manufacture a session or role when the server cannot authenticate it.
          set({ isLoading: false, error: err.message || 'Demo sign-in failed' });
          throw err;
        }
      },
    }),
    {
      name: 'noblenet-auth-storage',
    }
  )
);
