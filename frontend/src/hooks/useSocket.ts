import { useEffect } from 'react';
import { socketService } from '../lib/socket';
import { useAuthStore } from '../store/authStore';
import { useChatStore } from '../store/chatStore';
import { WebSocketEvent } from '../types/websocket';
import type { Message, Conversation } from '../types';

export const useSocket = () => {
  const token = useAuthStore((state) => state.token);
  const userId = useAuthStore((state) => state.user?.id);
  const { addMessage, addConversation, setTyping, setUserOnline, setUserOffline } = useChatStore();

  useEffect(() => {
    if (!token || !userId) return;

    socketService.connect(token, userId);

    // Listen for new messages
    socketService.on(WebSocketEvent.MESSAGE_RECEIVED, (message: Message) => {
      addMessage(message);
    });

    // Listen for new conversations
    socketService.onConversationCreated((data) => {
      const conversation: Conversation = {
        id: data.id,
        type: data.type,
        participants: data.participants,
        name: data.name,
        avatar: data.avatar,
        unreadCount: 0,
        createdAt: new Date(data.createdAt),
      };
      addConversation(conversation);
    });

    // Listen for user typing
    socketService.onUserTyping((data: { userId: string; conversationId: string }) => {
      setTyping(data.conversationId, data.userId, true);
    });

    // Listen for user stopped typing
    socketService.onUserStoppedTyping((data: { userId: string; conversationId: string }) => {
      setTyping(data.conversationId, data.userId, false);
    });

    // Listen for user online/offline status
    socketService.on(WebSocketEvent.USER_ONLINE, ({ userId }: { userId: string }) => {
      setUserOnline(userId);
    });

    socketService.on(WebSocketEvent.USER_OFFLINE, ({ userId }: { userId: string }) => {
      setUserOffline(userId);
    });

    return () => {
      socketService.disconnect();
    };
  }, [token, userId, addMessage, addConversation, setTyping]);

  return socketService;
};
