import { io, Socket } from 'socket.io-client';
import { ENV } from './env';
import type { Message, Conversation } from '../types';

// Event payload types
export interface SocketEvents {
  new_message: Message;
  message_delivered: { messageId: string };
  typing_received: { conversationId: string; userId: string; isTyping: boolean };
  presence_update: { userId: string; status: string };
  conversation_created: Conversation;
}

class SocketService {
  private socket: Socket | null = null;

  connect(token: string, userId: string): Socket {
    this.socket = io(ENV.WS_URL, {
      auth: {
        token,
        userId,
      },
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
    });

    this.socket.on('connect', () => {
      console.log('✅ WebSocket conectado');
    });

    this.socket.on('disconnect', () => {
      console.log('❌ WebSocket desconectado');
    });

    this.socket.on('connect_error', (error: Error) => {
      console.error('❌ Error de conexión:', error);
    });

    return this.socket;
  }

  disconnect(): void {
    this.socket?.disconnect();
    this.socket = null;
  }

  emit<K extends keyof SocketEvents>(event: K, data: SocketEvents[K]): void {
    this.socket?.emit(event, data);
  }

  // Specific method for send_message which expects Message type
  sendMessage(message: Message): void {
    this.socket?.emit('send_message', message);
  }

  // Specific method for typing with different payload than received typing
  sendTyping(conversationId: string, isTyping: boolean): void {
    this.socket?.emit('typing', { conversationId, isTyping });
  }

  on<K extends keyof SocketEvents>(event: K, callback: (data: SocketEvents[K]) => void): void {
    this.socket?.on(event as string, (data: unknown) => {
      callback(data as SocketEvents[K]);
    });
  }

  // Specific listener for typing_received to avoid confusion
  onTyping(callback: (data: { conversationId: string; userId: string; isTyping: boolean }) => void): void {
    this.socket?.on('typing_received', callback);
  }

  off(event: string): void {
    this.socket?.off(event);
  }

  getSocket(): Socket | null {
    return this.socket;
  }

  isConnected(): boolean {
    return this.socket?.connected ?? false;
  }
}

export const socketService = new SocketService();
