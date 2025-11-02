import { useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { useChatStore } from '../store/chatStore';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../lib/api';

export const useLoadConversations = () => {
  const token = useAuthStore((state) => state.token);
  const { setConversations } = useChatStore();

  const { data, isLoading } = useQuery({
    queryKey: ['conversations'],
    queryFn: () => {
      if (!token) return [];
      return apiClient.get('/chat', token);
    },
    enabled: !!token,
    staleTime: 1000 * 60, // 1 minute
  });

  // Update store when conversations are loaded
  useEffect(() => {
    if (data && Array.isArray(data)) {
      setConversations(data);
    }
  }, [data, setConversations]);

  return { isLoading };
};
