import { consumeMessages, publishMessage } from './rabbitmq';

interface MessageHandlerCallback {
  (data: Record<string, unknown>): Promise<void>;
}

const messageHandlers: Map<string, MessageHandlerCallback> = new Map();

export const registerMessageHandler = (
  queueName: string,
  handler: MessageHandlerCallback
): void => {
  messageHandlers.set(queueName, handler);
};

export const startMessageConsumer = async (): Promise<void> => {
  await consumeMessages('messages.queue', async (msg) => {
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
};

export const startNotificationConsumer = async (): Promise<void> => {
  await consumeMessages('notifications.queue', async (msg) => {
    try {
      if (!msg) return;

      const data = JSON.parse(msg.content.toString());
      console.log('🔔 Notification received:', data);

      // Ejecutar handler registrado si existe
      const handler = messageHandlers.get('notifications.queue');
      if (handler) {
        await handler(data);
      }
    } catch (error) {
      console.error('Error processing notification:', error);
    }
  });
};

export const startCustomConsumer = async (
  queueName: string,
  handler: MessageHandlerCallback
): Promise<void> => {
  await consumeMessages(queueName, async (msg) => {
    try {
      if (!msg) return;

      const data = JSON.parse(msg.content.toString());
      await handler(data);
    } catch (error) {
      console.error(`Error processing message from ${queueName}:`, error);
    }
  });
};
