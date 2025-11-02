import { io, Socket } from 'socket.io-client';
import { ENV } from './env';
import { WebSocketEvent } from '../types/websocket';
import type { WebSocketPayloads } from '../types/websocket';

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

    this.socket.on(WebSocketEvent.CONNECT, () => {
      console.log('✅ WebSocket conectado');
    });

    this.socket.on(WebSocketEvent.DISCONNECT, () => {
      console.log('❌ WebSocket desconectado');
    });

    this.socket.on(WebSocketEvent.CONNECT_ERROR, (error: Error) => {
      console.error('❌ Error de conexión:', error);
    });

    return this.socket;
  }

  disconnect(): void {
    this.socket?.disconnect();
    this.socket = null;
  }

  emit<K extends keyof WebSocketPayloads>(event: K, data: WebSocketPayloads[K]): void {
    this.socket?.emit(event, data);
  }

  // Send message to backend
  sendMessage(conversationId: string, content: string): void {
    this.socket?.emit(WebSocketEvent.MESSAGE_SEND, { conversationId, content });
  }

  // Start typing notification
  startTyping(conversationId: string): void {
    this.socket?.emit(WebSocketEvent.TYPING_START, { conversationId });
  }

  // Stop typing notification
  stopTyping(conversationId: string): void {
    this.socket?.emit(WebSocketEvent.TYPING_STOP, { conversationId });
  }

  on<K extends keyof WebSocketPayloads>(event: K, callback: (data: WebSocketPayloads[K]) => void): void {
    this.socket?.on(event as string, (data: unknown) => {
      callback(data as WebSocketPayloads[K]);
    });
  }

  // Listener for user typing
  onUserTyping(callback: (data: WebSocketPayloads[typeof WebSocketEvent.USER_TYPING]) => void): void {
    this.socket?.on(WebSocketEvent.USER_TYPING, callback);
  }

  // Listener for user stopped typing
  onUserStoppedTyping(callback: (data: WebSocketPayloads[typeof WebSocketEvent.USER_STOPPED_TYPING]) => void): void {
    this.socket?.on(WebSocketEvent.USER_STOPPED_TYPING, callback);
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
