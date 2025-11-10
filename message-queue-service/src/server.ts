import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

import { connectRabbitMQ, closeRabbitMQ } from './services/rabbitmq';
import {
  startMessageConsumer,
  startNotificationConsumer,
  resetConsumers
} from './services/messageConsumer';
import healthRouter from './routes/health';
import { createRateLimiter } from './middleware/rateLimiter';
import { createCircuitBreaker } from './middleware/circuitBreaker';

dotenv.config();

const app: Express = express();
const PORT = parseInt(process.env.PORT || '3001', 10);
const INSTANCE_ID = process.env.INSTANCE || `mqs-${PORT}`;

// Initialize middlewares
const rateLimiter = createRateLimiter({
  windowMs: 60000,
  maxRequests: 1000,
  maxMessagesPerSecond: 100
});

const rabbitmqCircuitBreaker = createCircuitBreaker('RabbitMQ');

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate limiting middleware
app.use((req: Request, res: Response, next) => {
  const clientId = req.ip || 'unknown';
  if (!rateLimiter.checkLimit(clientId)) {
    return res.status(429).json({
      error: 'Too many requests',
      message: 'Rate limit exceeded'
    });
  }
  next();
});

// Logging middleware
app.use((req: Request, res: Response, next) => {
  console.log(`[${INSTANCE_ID}] ${req.method} ${req.path}`);
  next();
});

// Routes
app.use('/api/health', healthRouter);

app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    instance: INSTANCE_ID,
    uptime: process.uptime()
  });
});

app.get('/metrics', async (req: Request, res: Response) => {
  res.set('Content-Type', 'text/plain');
  res.send(`
# HELP mqs_instance_info Message Queue Service instance info
# TYPE mqs_instance_info gauge
mqs_instance_info{instance="${INSTANCE_ID}"} 1

# HELP mqs_uptime_seconds Service uptime in seconds
# TYPE mqs_uptime_seconds gauge
mqs_uptime_seconds ${process.uptime()}

# HELP mqs_memory_usage_bytes Memory usage in bytes
# TYPE mqs_memory_usage_bytes gauge
mqs_memory_usage_bytes ${process.memoryUsage().heapUsed}

# HELP mqs_memory_total_bytes Total memory in bytes
# TYPE mqs_memory_total_bytes gauge
mqs_memory_total_bytes ${process.memoryUsage().heapTotal}
  `);
});

// Error handling middleware
app.use((err: Error, req: Request, res: Response) => {
  console.error(`[${INSTANCE_ID}] Error:`, err);
  res.status(500).json({
    error: 'Internal server error',
    message: err.message,
    instance: INSTANCE_ID
  });
});

// Initialize RabbitMQ with retries
const initializeRabbitMQ = async (maxRetries = 5, delayMs = 2000) => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      await rabbitmqCircuitBreaker.execute(async () => {
        await connectRabbitMQ();
      });

      // Only start consumers after successful connection
      try {
        await startMessageConsumer();
        await startNotificationConsumer();
      } catch (consumerError) {
        console.error('Error starting consumers:', consumerError);
        throw consumerError;
      }

      console.log(`[${INSTANCE_ID}] ✅ RabbitMQ services initialized successfully`);
      return;
    } catch (error) {
      console.warn(
        `[${INSTANCE_ID}] ⚠️  Attempt ${i + 1}/${maxRetries} failed to connect to RabbitMQ, retrying in ${delayMs}ms...`,
        error
      );
      
      // Reset consumers on failure to avoid duplicate initialization
      if (i < maxRetries - 1) {
        resetConsumers();
        await closeRabbitMQ();
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
    }
  }
  console.warn(
    `[${INSTANCE_ID}] ❌ Failed to initialize RabbitMQ after retries, continuing without message queue...`
  );
};

// Start server
const server = app.listen(PORT, () => {
  console.log(`[${INSTANCE_ID}] ✅ Message Queue Service running on port ${PORT}`);
});

// Initialize RabbitMQ asynchronously
initializeRabbitMQ().catch(err => {
  console.error(`[${INSTANCE_ID}] Error during RabbitMQ initialization:`, err);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log(`[${INSTANCE_ID}] SIGTERM received, shutting down gracefully...`);
  await closeRabbitMQ();
  server.close(() => {
    console.log(`[${INSTANCE_ID}] Server closed`);
    process.exit(0);
  });
});

process.on('SIGINT', async () => {
  console.log(`[${INSTANCE_ID}] SIGINT received, shutting down gracefully...`);
  await closeRabbitMQ();
  server.close(() => {
    console.log(`[${INSTANCE_ID}] Server closed`);
    process.exit(0);
  });
});

export default app;
