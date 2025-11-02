import { useCallback } from 'react';
import { socketService } from '../lib/socket';
import { useChatStore } from '../store/chatStore';
import { useAuthStore } from '../store/authStore';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../lib/api';
import type { CreateMessagePayload } from '../types';

export const useChat = () => {
  const token = useAuthStore((state) => state.token);
  const {
    activeConversationId,
    messages,
    typingUsers,
  } = useChatStore();

  const currentMessages = activeConversationId
    ? messages[activeConversationId] || []
    : [];

  const sendMessage = useCallback(
    (content: string, type: 'text' | 'image' | 'video' | 'file' = 'text') => {
      if (!activeConversationId || !token) return;

      const payload: CreateMessagePayload = {
        conversationId: activeConversationId,
        content,
        type,
      };

      socketService.emit('send_message', payload);
    },
    [activeConversationId, token]
  );

  const { isLoading } = useQuery({
    queryKey: ['messages', activeConversationId],
    queryFn: () => {
      if (!activeConversationId || !token) return [];
      return apiClient.get(`/conversations/${activeConversationId}/messages`, token);
    },
    enabled: !!activeConversationId && !!token,
    staleTime: 1000 * 5,
  });

  const sendTyping = useCallback(
    (isTyping: boolean) => {
      if (!activeConversationId) return;

      socketService.emit('typing', {
        conversationId: activeConversationId,
        isTyping,
      });
    },
    [activeConversationId]
  );

  const currentTypingUsers = activeConversationId
    ? typingUsers[activeConversationId] || []
    : [];

  return {
    messages: currentMessages,
    isLoading,
    sendMessage,
    sendTyping,
    typingUsers: currentTypingUsers,
  };
};
