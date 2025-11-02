import { Server as SocketIOServer, Socket } from 'socket.io';
import { authenticate } from '../shared/middleware/auth.js';
import { publishMessage } from '../shared/services/rabbitmq.js';

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

    socket.join(`user:${userId}`);

    io.emit('user:online', { userId, timestamp: Date.now() });

    socket.on('message:send', async (data: { conversationId: string; content: string }) => {
      try {
        await publishMessage('chat', 'message.new', {
          conversationId: data.conversationId,
          userId,
          content: data.content,
          timestamp: Date.now()
        });

        socket.to(`conversation:${data.conversationId}`).emit('message:received', {
          conversationId: data.conversationId,
          userId,
          content: data.content,
          timestamp: Date.now()
        });
      } catch (error) {
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    socket.on('typing:start', (data: { conversationId: string }) => {
      socket.to(`conversation:${data.conversationId}`).emit('user:typing', { userId });
    });

    socket.on('typing:stop', (data: { conversationId: string }) => {
      socket.to(`conversation:${data.conversationId}`).emit('user:stopped-typing', { userId });
    });

    socket.on('conversation:join', (data: { conversationId: string }) => {
      socket.join(`conversation:${data.conversationId}`);
      socket.to(`conversation:${data.conversationId}`).emit('user:joined', { userId });
    });

    socket.on('conversation:leave', (data: { conversationId: string }) => {
      socket.leave(`conversation:${data.conversationId}`);
      socket.to(`conversation:${data.conversationId}`).emit('user:left', { userId });
    });

    socket.on('disconnect', () => {
      console.log(`❌ User ${userId} disconnected`);
      io.emit('user:offline', { userId, timestamp: Date.now() });
    });
  });
};
