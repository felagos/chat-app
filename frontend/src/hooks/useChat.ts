import { useCallback, useEffect } from 'react';
import { socketService } from '../lib/socket';
import { useChatStore } from '../store/chatStore';
import { useAuthStore } from '../store/authStore';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../lib/api';

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
    (content: string) => {
      if (!activeConversationId || !token) return;

      // Send message via socket
      socketService.sendMessage(activeConversationId, content);
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
      if (isTyping) {
        socketService.startTyping(activeConversationId);
      } else {
        socketService.stopTyping(activeConversationId);
      }
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
