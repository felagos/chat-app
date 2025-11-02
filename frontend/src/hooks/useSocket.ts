import { useEffect } from 'react';
import { socketService } from '../lib/socket';
import { useAuthStore } from '../store/authStore';
import { useChatStore } from '../store/chatStore';
import { WebSocketEvent } from '../types/websocket';
import type { Message } from '../types';

export const useSocket = () => {
  const token = useAuthStore((state) => state.token);
  const userId = useAuthStore((state) => state.user?.id);
  const { addMessage, setTyping } = useChatStore();

  useEffect(() => {
    if (!token || !userId) return;

    socketService.connect(token, userId);

    // Listen for new messages
    socketService.on(WebSocketEvent.MESSAGE_RECEIVED, (message: Message) => {
      addMessage(message);
    });

    // Listen for user typing
    socketService.onUserTyping((data: { userId: string; conversationId: string }) => {
      setTyping(data.conversationId, data.userId, true);
    });

    // Listen for user stopped typing
    socketService.onUserStoppedTyping((data: { userId: string; conversationId: string }) => {
      setTyping(data.conversationId, data.userId, false);
    });

    return () => {
      socketService.disconnect();
    };
  }, [token, userId, addMessage, setTyping]);

  return socketService;
};
