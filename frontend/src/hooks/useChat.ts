import { useCallback, useEffect } from 'react';
import { socketService } from '../lib/socket';
import { useChatStore } from '../store/chatStore';
import { useAuthStore } from '../store/authStore';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../lib/api';
import type { CreateMessagePayload, Message } from '../types';

export const useChat = () => {
  const token = useAuthStore((state) => state.token);
  const {
    activeConversationId,
    messages,
    typingUsers,
    setMessages,
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

      // Convert payload to Message type
      const message: Message = {
        id: `temp-${Date.now()}`,
        conversationId: activeConversationId,
        senderId: useAuthStore.getState().user?.id || '',
        content,
        type,
        mediaUrl: payload.mediaUrl,
        timestamp: new Date(),
        status: 'sent',
        readBy: [],
      };

      socketService.sendMessage(message);
    },
    [activeConversationId, token]
  );

  const { isLoading, data } = useQuery({
    queryKey: ['messages', activeConversationId],
    queryFn: () => {
      if (!activeConversationId || !token) return [];
      return apiClient.get(`/chat/${activeConversationId}/messages`, token);
    },
    enabled: !!activeConversationId && !!token,
    staleTime: 1000 * 5,
  });

  // Update store when messages are loaded
  useEffect(() => {
    if (data && activeConversationId) {
      setMessages(activeConversationId, data);
    }
  }, [data, activeConversationId, setMessages]);

  const sendTyping = useCallback(
    (isTyping: boolean) => {
      if (!activeConversationId) return;
      socketService.sendTyping(activeConversationId, isTyping);
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
