const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: {
    code: string;
    details?: any;
  };
}

class ApiError extends Error {
  code?: string;
  details?: any;
  status: number;

  constructor(message: string, status: number, code?: string, details?: any) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

/**
 * Safely retrieve access token from localStorage without creating a circular
 * dependency with Zustand's authStore.
 */
function getStoredAccessToken(): string | null {
  try {
    const raw = localStorage.getItem('noblenet-auth-storage');
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed?.state?.accessToken || null;
  } catch {
    return null;
  }
}

function getStoredRefreshToken(): string | null {
  try {
    const raw = localStorage.getItem('noblenet-auth-storage');
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed?.state?.refreshToken || null;
  } catch {
    return null;
  }
}

function updateStoredTokens(accessToken: string, refreshToken?: string) {
  try {
    const raw = localStorage.getItem('noblenet-auth-storage');
    if (!raw) return;
    const parsed = JSON.parse(raw);
    if (parsed?.state) {
      parsed.state.accessToken = accessToken;
      if (refreshToken) parsed.state.refreshToken = refreshToken;
      localStorage.setItem('noblenet-auth-storage', JSON.stringify(parsed));
    }
  } catch {
    // Ignore storage errors
  }
}

function clearStoredAuth() {
  try {
    const raw = localStorage.getItem('noblenet-auth-storage');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed?.state) {
        parsed.state.user = null;
        parsed.state.accessToken = null;
        parsed.state.refreshToken = null;
        parsed.state.isAuthenticated = false;
        localStorage.setItem('noblenet-auth-storage', JSON.stringify(parsed));
      }
    }
  } catch {
    localStorage.removeItem('noblenet-auth-storage');
  }
}

let isRefreshing = false;
let refreshSubscribers: Array<(token: string) => void> = [];

function subscribeTokenRefresh(cb: (token: string) => void) {
  refreshSubscribers.push(cb);
}

function onRefreshed(token: string) {
  refreshSubscribers.map((cb) => cb(token));
  refreshSubscribers = [];
}

export async function apiRequest<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  // Get current token safely from storage
  let token = getStoredAccessToken();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const config: RequestInit = {
    ...options,
    headers,
  };

  try {
    let response = await fetch(url, config);

    // If 401 Unauthorized occurs on an authenticated endpoint, try refreshing the token
    const isAuthEndpoint =
      endpoint.includes('/auth/login') ||
      endpoint.includes('/auth/register') ||
      endpoint.includes('/auth/refresh');

    if (response.status === 401 && !isAuthEndpoint) {
      const refreshToken = getStoredRefreshToken();

      if (refreshToken) {
        if (!isRefreshing) {
          isRefreshing = true;
          try {
            const refreshRes = await fetch(`${BASE_URL}/auth/refresh`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ refreshToken }),
            });

            const refreshData = await refreshRes.json();
            if (refreshRes.ok && refreshData.success && refreshData.data?.accessToken) {
              const newAccessToken = refreshData.data.accessToken;
              const newRefreshToken = refreshData.data.refreshToken;
              updateStoredTokens(newAccessToken, newRefreshToken);
              isRefreshing = false;
              onRefreshed(newAccessToken);
            } else {
              isRefreshing = false;
              clearStoredAuth();
              throw new ApiError('Your session has expired. Please log in again.', 401, 'SESSION_EXPIRED');
            }
          } catch (refreshErr) {
            isRefreshing = false;
            clearStoredAuth();
            throw new ApiError('Your session has expired. Please log in again.', 401, 'SESSION_EXPIRED');
          }
        }

        // Retry with refreshed token
        const retryToken = await new Promise<string>((resolve) => {
          subscribeTokenRefresh((newToken) => resolve(newToken));
        });

        headers['Authorization'] = `Bearer ${retryToken}`;
        response = await fetch(url, { ...options, headers });
      } else {
        clearStoredAuth();
        throw new ApiError('Please sign in to continue.', 401, 'NOT_AUTHENTICATED');
      }
    }

    const result: ApiResponse<T> = await response.json();

    if (!response.ok || !result.success) {
      const errorMessage = result.message || 'An error occurred while processing your request';
      throw new ApiError(errorMessage, response.status, result.error?.code, result.error?.details);
    }

    return result.data as T;
  } catch (error: any) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(error.message || 'Network error or server unreachable', 500);
  }
}

export const apiClient = {
  get: <T = any>(endpoint: string, options?: RequestInit) =>
    apiRequest<T>(endpoint, { ...options, method: 'GET' }),
  post: <T = any>(endpoint: string, body?: any, options?: RequestInit) =>
    apiRequest<T>(endpoint, {
      ...options,
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    }),
  put: <T = any>(endpoint: string, body?: any, options?: RequestInit) =>
    apiRequest<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
    }),
  patch: <T = any>(endpoint: string, body?: any, options?: RequestInit) =>
    apiRequest<T>(endpoint, {
      ...options,
      method: 'PATCH',
      body: body ? JSON.stringify(body) : undefined,
    }),
  delete: <T = any>(endpoint: string, options?: RequestInit) =>
    apiRequest<T>(endpoint, { ...options, method: 'DELETE' }),
};
