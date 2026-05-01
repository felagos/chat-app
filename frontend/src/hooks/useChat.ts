import { useCallback, useEffect, useRef } from 'react';
import { socketService } from '../lib/socket';
import { useChatStore } from '../store/chatStore';
import { useAuthStore } from '../store/authStore';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../lib/api';

export const useChat = () => {
  const token = useAuthStore((state) => state.token);
  const user = useAuthStore((state) => state.user);
  const {
    activeConversationId,
    messages,
    typingUsers,
    setMessages,
    addMessage,
  } = useChatStore();

  const prevConversationId = useRef<string | null>(null);

  // Join/leave conversation rooms when active conversation changes
  useEffect(() => {
    if (prevConversationId.current && prevConversationId.current !== activeConversationId) {
      socketService.leaveConversation(prevConversationId.current);
    }
    if (activeConversationId) {
      socketService.joinConversation(activeConversationId);
    }
    prevConversationId.current = activeConversationId;
  }, [activeConversationId]);

  const currentMessages = activeConversationId
    ? messages[activeConversationId] || []
    : [];

  const sendMessage = useCallback(
    (content: string) => {
      if (!activeConversationId || !token || !user) return;

      socketService.sendMessage(activeConversationId, content);

      // Add sender's own message to local store immediately
      addMessage({
        id: `local-${Date.now()}`,
        conversationId: activeConversationId,
        userId: user.id,
        content,
        status: 'sent',
        createdAt: new Date().toISOString(),
      });
    },
    [activeConversationId, token, user, addMessage]
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
