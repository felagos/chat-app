import { consumeMessages, publishMessage } from './rabbitmq';

interface MessageHandlerCallback {
  (data: Record<string, unknown>): Promise<void>;
}

const messageHandlers: Map<string, MessageHandlerCallback> = new Map();

// Track initialized consumers to prevent duplicates
const initializedConsumers: Set<string> = new Set();

export const registerMessageHandler = (
  queueName: string,
  handler: MessageHandlerCallback
): void => {
  messageHandlers.set(queueName, handler);
};

export const startMessageConsumer = async (): Promise<void> => {
  const queueName = 'messages.queue';
  
  // Prevent duplicate consumer initialization
  if (initializedConsumers.has(queueName)) {
    console.warn(`⚠️  Consumer for queue "${queueName}" is already initialized`);
    return;
  }

  try {
    await consumeMessages(queueName, async (msg) => {
      try {
        if (!msg) return;

        const data = JSON.parse(msg.content.toString());
        console.log(`📨 Processing message from queue:`, data);

        // Publicar evento de procesamiento
        await publishMessage('chat', 'message.processed', {
          status: 'processed',
          messageId: data.messageId,
          timestamp: Date.now()
        });
      } catch (error) {
        console.error('Error processing message:', error);
      }
    });

    initializedConsumers.add(queueName);
    console.log(`✅ Message consumer for queue "${queueName}" started`);
  } catch (error) {
    console.error(`Error starting consumer for queue "${queueName}":`, error);
    throw error;
  }
};

export const startNotificationConsumer = async (): Promise<void> => {
  const queueName = 'notifications.queue';

  // Prevent duplicate consumer initialization
  if (initializedConsumers.has(queueName)) {
    console.warn(`⚠️  Consumer for queue "${queueName}" is already initialized`);
    return;
  }

  try {
    await consumeMessages(queueName, async (msg) => {
      try {
        if (!msg) return;

        const data = JSON.parse(msg.content.toString());
        console.log('🔔 Notification received:', data);

        // Ejecutar handler registrado si existe
        const handler = messageHandlers.get(queueName);
        if (handler) {
          await handler(data);
        }
      } catch (error) {
        console.error('Error processing notification:', error);
      }
    });

    initializedConsumers.add(queueName);
    console.log(`✅ Notification consumer for queue "${queueName}" started`);
  } catch (error) {
    console.error(`Error starting consumer for queue "${queueName}":`, error);
    throw error;
  }
};

export const startCustomConsumer = async (
  queueName: string,
  handler: MessageHandlerCallback
): Promise<void> => {
  // Prevent duplicate consumer initialization
  if (initializedConsumers.has(queueName)) {
    console.warn(`⚠️  Consumer for queue "${queueName}" is already initialized`);
    return;
  }

  try {
    await consumeMessages(queueName, async (msg) => {
      try {
        if (!msg) return;

        const data = JSON.parse(msg.content.toString());
        await handler(data);
      } catch (error) {
        console.error(`Error processing message from ${queueName}:`, error);
      }
    });

    initializedConsumers.add(queueName);
    console.log(`✅ Custom consumer for queue "${queueName}" started`);
  } catch (error) {
    console.error(`Error starting consumer for queue "${queueName}":`, error);
    throw error;
  }
};

export const resetConsumers = (): void => {
  initializedConsumers.clear();
  console.log('🔄 Consumers reset');
};
