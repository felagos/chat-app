import * as prometheus from 'prom-client';

// HTTP Request Metrics
export const httpRequestDuration = new prometheus.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.01, 0.05, 0.1, 0.5, 1, 2, 5]
});

export const httpRequestsTotal = new prometheus.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code']
});

// RabbitMQ Metrics
export const messagesPublished = new prometheus.Counter({
  name: 'messages_published_total',
  help: 'Total number of messages published',
  labelNames: ['exchange', 'routing_key']
});

export const messagesConsumed = new prometheus.Counter({
  name: 'messages_consumed_total',
  help: 'Total number of messages consumed',
  labelNames: ['queue']
});

export const messageQueueErrors = new prometheus.Counter({
  name: 'message_queue_errors_total',
  help: 'Total number of message queue errors',
  labelNames: ['error_type', 'queue']
});

export const rabbitMQConnectionStatus = new prometheus.Gauge({
  name: 'rabbitmq_connection_status',
  help: 'RabbitMQ connection status (1 = connected, 0 = disconnected)'
});

// Process Metrics
export const defaultMetrics = prometheus.collectDefaultMetrics;

// Middleware para registrar métricas HTTP
export const metricsMiddleware = (req: any, res: any, next: any) => {
  const start = Date.now();

  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000;
    const route = req.route?.path || req.path || 'unknown';
    
    httpRequestDuration.labels(req.method, route, res.statusCode).observe(duration);
    httpRequestsTotal.labels(req.method, route, res.statusCode).inc();
  });

  next();
};

// Endpoint para Prometheus
export const getMetrics = async () => {
  return await prometheus.register.metrics();
};
