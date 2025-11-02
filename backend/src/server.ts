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
  origin: [
    'http://localhost:3001', // Frontend production port
    'http://localhost:5173', // Vite dev server
    'http://localhost:3000'  // Alternative frontend port
  ],
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const io = new SocketIOServer(httpServer, {
  cors: {
    origin: [
      'http://localhost:3001', // Frontend production port
      'http://localhost:5173', // Vite dev server
      'http://localhost:3000'  // Alternative frontend port
    ],
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

// Initialize RabbitMQ with retries (non-blocking)
const initializeRabbitMQ = async (maxRetries = 5, delayMs = 2000) => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      await connectRabbitMQ();
      await startMessageConsumer();
      await startNotificationConsumer();
      console.log('✅ RabbitMQ services initialized');
      return;
    } catch (error) {
      console.warn(`⚠️  Attempt ${i + 1}/${maxRetries} failed to connect to RabbitMQ, retrying in ${delayMs}ms...`);
      if (i < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
    }
  }
  console.warn('❌ Failed to initialize RabbitMQ after retries, continuing without message queue...');
};

// Start server first, initialize RabbitMQ in background
const PORT = parseInt(process.env.PORT || '3000', 10);

httpServer.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});

// Initialize RabbitMQ asynchronously
initializeRabbitMQ().catch(err => {
  console.error('Error during RabbitMQ initialization:', err);
});

process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully...');
  httpServer.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});
