const MESSAGE_QUEUE_SERVICE_URL =
  process.env.MESSAGE_QUEUE_SERVICE_URL || 'http://localhost:3001';

const TIMEOUT_MS = 5000;
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000;

interface RequestOptions {
  timeout?: number;
  retries?: number;
}

const sleep = (ms: number): Promise<void> => 
  new Promise(resolve => setTimeout(resolve, ms));

const fetchWithTimeout = (
  url: string,
  options: RequestInit & { timeout?: number }
): Promise<Response> => {
  const { timeout = TIMEOUT_MS, ...fetchOptions } = options;
  
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  
  return fetch(url, {
    ...fetchOptions,
    signal: controller.signal
  }).finally(() => clearTimeout(timeoutId));
};

const fetchWithRetry = async (
  url: string,
  options: RequestInit & RequestOptions
): Promise<Response> => {
  const { timeout = TIMEOUT_MS, retries = MAX_RETRIES, ...fetchOptions } = options;
  
  let lastError: Error | null = null;
  
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      console.log(`📡 [Attempt ${attempt}/${retries}] Connecting to ${url}`);
      
      const response = await fetchWithTimeout(url, {
        timeout,
        ...fetchOptions
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      console.log(`✅ Request successful on attempt ${attempt}`);
      return response;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      if (attempt < retries) {
        const delayMs = RETRY_DELAY_MS * attempt;
        console.warn(
          `⚠️  Attempt ${attempt} failed: ${lastError.message}. Retrying in ${delayMs}ms...`
        );
        await sleep(delayMs);
      }
    }
  }
  
  throw new Error(
    `Failed to connect to Message Queue Service after ${retries} attempts: ${lastError?.message}`
  );
};

export const publishMessage = async (
  exchangeName: string,
  routingKey: string,
  message: Record<string, unknown>
): Promise<void> => {
  try {
    console.log(`📨 Publishing message to ${exchangeName}.${routingKey}`);
    
    const response = await fetchWithRetry(
      `${MESSAGE_QUEUE_SERVICE_URL}/api/messages/publish`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          exchangeName,
          routingKey,
          message
        }),
        timeout: TIMEOUT_MS,
        retries: MAX_RETRIES
      }
    );

    const data = await response.json();
    console.log('✅ Message published successfully:', data);
  } catch (error) {
    console.error('❌ Error publishing message:', error);
    throw error;
  }
};

export const getQueueStatus = async (): Promise<Record<string, unknown>> => {
  try {
    const response = await fetchWithRetry(
      `${MESSAGE_QUEUE_SERVICE_URL}/api/health/status`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: TIMEOUT_MS,
        retries: MAX_RETRIES
      }
    );

    const data = await response.json();
    console.log('✅ Queue status retrieved:', data);
    return data as Record<string, unknown>;
  } catch (error) {
    console.error('❌ Error getting queue status:', error);
    throw error;
  }
};

export const checkMessageQueueServiceHealth = async (): Promise<boolean> => {
  try {
    const response = await fetchWithTimeout(
      `${MESSAGE_QUEUE_SERVICE_URL}/health`,
      {
        method: 'GET',
        timeout: 3000
      }
    );
    
    if (!response.ok) {
      console.warn(`⚠️  Message Queue Service health check failed: ${response.statusText}`);
      return false;
    }
    
    console.log('✅ Message Queue Service is healthy');
    return true;
  } catch (error) {
    console.warn('⚠️  Message Queue Service is unreachable:', error);
    return false;
  }
};
