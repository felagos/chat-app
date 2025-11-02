import logger from './logger';

interface RateLimitConfig {
  windowMs?: number;
  maxRequests?: number;
  maxMessagesPerSecond?: number;
}

export class RateLimiter {
  private requests: Map<string, number[]> = new Map();
  private windowMs: number;
  private maxRequests: number;
  private maxMessagesPerSecond: number;

  constructor(config: RateLimitConfig = {}) {
    this.windowMs = config.windowMs || 60000; // 1 minuto
    this.maxRequests = config.maxRequests || 1000;
    this.maxMessagesPerSecond = config.maxMessagesPerSecond || 100;
  }

  checkLimit(identifier: string): boolean {
    const now = Date.now();
    const windowStart = now - this.windowMs;

    if (!this.requests.has(identifier)) {
      this.requests.set(identifier, []);
    }

    const timestamps = this.requests.get(identifier) || [];
    const recentRequests = timestamps.filter(ts => ts > windowStart);

    if (recentRequests.length >= this.maxRequests) {
      logger.warn(`Rate limit exceeded for ${identifier}`);
      return false;
    }

    recentRequests.push(now);
    this.requests.set(identifier, recentRequests);

    return true;
  }

  checkMessageRate(identifier: string): boolean {
    const now = Date.now();
    const windowStart = now - 1000; // 1 segundo

    if (!this.requests.has(identifier)) {
      this.requests.set(identifier, []);
    }

    const timestamps = this.requests.get(identifier) || [];
    const recentMessages = timestamps.filter(ts => ts > windowStart);

    if (recentMessages.length >= this.maxMessagesPerSecond) {
      logger.warn(`Message rate limit exceeded for ${identifier}`);
      return false;
    }

    recentMessages.push(now);
    this.requests.set(identifier, recentMessages);

    return true;
  }

  reset(identifier?: string): void {
    if (identifier) {
      this.requests.delete(identifier);
    } else {
      this.requests.clear();
    }
  }
}

export const createRateLimiter = (config?: RateLimitConfig) => {
  return new RateLimiter(config);
};
