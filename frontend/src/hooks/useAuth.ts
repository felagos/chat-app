import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../lib/api';
import { useAuthStore } from '../store/authStore';
import { useMutation } from '@tanstack/react-query';
import type { AuthResponse } from '../types';

export const useAuth = () => {
  const navigate = useNavigate();
  const { user, token, login, logout } = useAuthStore();

  const loginMutation = useMutation({
    mutationFn: async (credentials: { email: string; password: string }) => {
      return apiClient.post('/auth/login', credentials);
    },
    onSuccess: (data: AuthResponse) => {
      login(data.token, data.user);
      navigate('/chat');
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (data: {
      username: string;
      email: string;
      password: string;
    }) => {
      return apiClient.post('/auth/register', data);
    },
    onSuccess: (data: AuthResponse) => {
      login(data.token, data.user);
      navigate('/chat');
    },
  });

  const handleLogin = useCallback(
    (email: string, password: string) => {
      loginMutation.mutate({ email, password });
    },
    [loginMutation]
  );

  const handleRegister = useCallback(
    (username: string, email: string, password: string) => {
      registerMutation.mutate({ username, email, password });
    },
    [registerMutation]
  );

  const handleLogout = useCallback(() => {
    logout();
  }, [logout]);

  return {
    user,
    token,
    isAuthenticated: !!token,
    isLoading: loginMutation.isPending || registerMutation.isPending,
    error: loginMutation.error || registerMutation.error,
    login: handleLogin,
    register: handleRegister,
    logout: handleLogout,
  };
};
