import { QueryClient } from '@tanstack/react-query';
import { ENV } from './env';

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

type FetchOptions = {
  token?: string;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  body?: unknown;
  headers?: Record<string, string>;
};

async function fetchApi(endpoint: string, options: FetchOptions = {}) {
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

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Unknown error' }));
    throw new Error(error.message || `HTTP Error: ${response.status}`);
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
