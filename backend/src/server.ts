import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';

import { setupSocketIO } from './gateway/socket.js';
import { connectRabbitMQ } from './shared/services/rabbitmq.js';
import { startMessageConsumer, startNotificationConsumer } from './shared/services/messageConsumer.js';
import authRoutes from './modules/auth/routes.js';
import chatRoutes from './modules/chat/routes.js';
import { errorHandler } from './shared/middleware/errorHandler.js';

dotenv.config();

const app = express();
const httpServer = createServer(app);

app.use(cors({
  origin: process.env.SOCKET_IO_CORS || 'http://localhost:3001',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const io = new SocketIOServer(httpServer, {
  cors: {
    origin: process.env.SOCKET_IO_CORS || 'http://localhost:3001',
    credentials: true
  }
});

setupSocketIO(io);

app.use('/api/auth', authRoutes);
app.use('/api/chat', chatRoutes);

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.use(errorHandler);

await connectRabbitMQ();

await startMessageConsumer();
await startNotificationConsumer();

const PORT = parseInt(process.env.PORT || '3000', 10);

httpServer.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});

process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully...');
  httpServer.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});
