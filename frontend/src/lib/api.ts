import { QueryClient } from '@tanstack/react-query';
import { ENV } from './env';
import { useAuthStore } from '../store/authStore';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      gcTime: 1000 * 60 * 10,
      retry: 1,
    },
    mutations: {
      retry: 1,
    },
  },
});

const API_URL = ENV.API_URL;

const NO_INTERCEPT_ENDPOINTS = ['/auth/login', '/auth/register', '/auth/refresh'];

type FetchOptions = {
  token?: string;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  body?: unknown;
  headers?: Record<string, string>;
};

let refreshPromise: Promise<string | null> | null = null;

export function getRefreshedToken(): Promise<string | null> {
  if (!refreshPromise) {
    refreshPromise = (async () => {
      const refreshToken = useAuthStore.getState().refreshToken;
      if (!refreshToken) return null;

      try {
        const data = await fetchApi('/auth/refresh', { method: 'POST', body: { refreshToken } });
        useAuthStore.getState().setTokens(data.token, data.refreshToken);
        return data.token as string;
      } catch {
        useAuthStore.getState().logout();
        return null;
      }
    })().finally(() => {
      refreshPromise = null;
    });
  }

  return refreshPromise;
}

async function fetchApi(endpoint: string, options: FetchOptions = {}, isRetry = false) {
  const { token, method = 'GET', body, headers = {} } = options;

  const defaultHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    ...headers,
  };

  if (token) {
    defaultHeaders['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    method,
    headers: defaultHeaders,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (response.status === 401 && token && !isRetry && !NO_INTERCEPT_ENDPOINTS.includes(endpoint)) {
    const newToken = await getRefreshedToken();
    if (newToken) {
      return fetchApi(endpoint, { ...options, token: newToken }, true);
    }
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(error.error || error.message || `HTTP Error: ${response.status}`);
  }

  if (response.status === 204 || response.headers.get('content-length') === '0') {
    return null;
  }

  return response.json();
}

export const apiClient = {
  get: (endpoint: string, token?: string) =>
    fetchApi(endpoint, { token, method: 'GET' }),

  post: (endpoint: string, body: unknown, token?: string) =>
    fetchApi(endpoint, { token, method: 'POST', body }),

  put: (endpoint: string, body: unknown, token?: string) =>
    fetchApi(endpoint, { token, method: 'PUT', body }),

  delete: (endpoint: string, token?: string) =>
    fetchApi(endpoint, { token, method: 'DELETE' }),

  patch: (endpoint: string, body: unknown, token?: string) =>
    fetchApi(endpoint, { token, method: 'PATCH', body }),
};
