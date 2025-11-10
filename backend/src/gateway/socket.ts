import { Server as SocketIOServer, Socket } from 'socket.io';
import { publishMessage } from '../shared/services/rabbitmq';
import { WebSocketEvent } from '../shared/types/websocket';
import {
  markUserAsActive,
  markUserAsInactive
} from '../shared/services/pushNotification';

interface AuthenticatedSocket extends Socket {
  userId?: string;
}

export const setupSocketIO = (io: SocketIOServer): void => {
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) {
        return next(new Error('Authentication token missing'));
      }

      const userId = socket.handshake.auth.userId;
      if (!userId) {
        return next(new Error('UserId missing'));
      }

      (socket as AuthenticatedSocket).userId = userId;
      next();
    } catch (error) {
      next(new Error('Authentication failed'));
    }
  });

  io.on('connection', (socket: AuthenticatedSocket) => {
    const userId = socket.userId;
    console.log(`✅ User ${userId} connected via WebSocket`);

    markUserAsActive(userId!, socket.id);

    socket.join(`user:${userId}`);

    io.emit(WebSocketEvent.USER_ONLINE, { userId, timestamp: Date.now() });

    socket.on(WebSocketEvent.MESSAGE_SEND, async (data: { conversationId: string; content: string }) => {
      try {
        console.log(`📨 [${userId}] Sending message to conversation ${data.conversationId}`);
        
        await publishMessage('chat', 'message.new', {
          conversationId: data.conversationId,
          userId,
          content: data.content,
          timestamp: Date.now()
        });

        socket.to(`conversation:${data.conversationId}`).emit(WebSocketEvent.MESSAGE_RECEIVED, {
          conversationId: data.conversationId,
          userId,
          content: data.content,
          timestamp: Date.now()
        });
        
        console.log(`✅ [${userId}] Message sent successfully`);
      } catch (error) {
        console.error(`❌ [${userId}] Failed to send message:`, error);
        socket.emit(WebSocketEvent.ERROR, { 
          message: 'Failed to send message',
          details: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    });

    socket.on(WebSocketEvent.TYPING_START, (data: { conversationId: string }) => {
      socket.to(`conversation:${data.conversationId}`).emit(WebSocketEvent.USER_TYPING, { userId, conversationId: data.conversationId });
    });

    socket.on(WebSocketEvent.TYPING_STOP, (data: { conversationId: string }) => {
      socket.to(`conversation:${data.conversationId}`).emit(WebSocketEvent.USER_STOPPED_TYPING, { userId, conversationId: data.conversationId });
    });

    socket.on(WebSocketEvent.CONVERSATION_JOIN, (data: { conversationId: string }) => {
      socket.join(`conversation:${data.conversationId}`);
      socket.to(`conversation:${data.conversationId}`).emit(WebSocketEvent.USER_JOINED, { userId });
    });

    socket.on(WebSocketEvent.CONVERSATION_LEAVE, (data: { conversationId: string }) => {
      socket.leave(`conversation:${data.conversationId}`);
      socket.to(`conversation:${data.conversationId}`).emit(WebSocketEvent.USER_LEFT, { userId });
    });

    socket.on(WebSocketEvent.DISCONNECT, () => {
      console.log(`❌ User ${userId} disconnected`);
      // Marcar usuario como inactivo
      markUserAsInactive(userId!);
      io.emit(WebSocketEvent.USER_OFFLINE, { userId, timestamp: Date.now() });
    });
  });
};
