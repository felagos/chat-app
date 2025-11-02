import { useEffect } from 'react';
import { socketService } from '../lib/socket';
import { useAuthStore } from '../store/authStore';
import { useChatStore } from '../store/chatStore';
import type { Message, Conversation } from '../types';

export const useSocket = () => {
  const token = useAuthStore((state) => state.token);
  const { addMessage, setTyping, addConversation } = useChatStore();

  useEffect(() => {
    if (!token) return;

    socketService.connect(token);

    socketService.on('new_message', (message: Message) => {
      addMessage(message);
    });

    socketService.on('message_delivered', (data: { messageId: string }) => {
      console.log('Mensaje entregado:', data.messageId);
    });

    socketService.on('typing', (data: { conversationId: string; userId: string; isTyping: boolean }) => {
      setTyping(data.conversationId, data.userId, data.isTyping);
    });

    socketService.on('presence_update', (data: { userId: string; status: string }) => {
      console.log('Actualización de presencia:', data);
    });

    socketService.on('conversation_created', (conversation: Conversation) => {
      addConversation(conversation);
    });

    return () => {
      socketService.disconnect();
    };
  }, [token, addMessage, setTyping, addConversation]);

  return socketService;
};
