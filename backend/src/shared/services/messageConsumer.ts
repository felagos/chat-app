import { consumeMessages, publishMessage } from './rabbitmq';
import prisma from '../../config/prisma';

export const startMessageConsumer = async (): Promise<void> => {
  await consumeMessages('messages.queue', async (msg) => {
    try {
      if (!msg) return;

      const data = JSON.parse(msg.content.toString());

      // Save message to database
      const message = await prisma.message.create({
        data: {
          content: data.content,
          conversationId: data.conversationId,
          userId: data.userId,
          status: 'delivered'
        }
      });

      console.log(`📨 Message saved: ${message.id}`);

      // Publish notification
      await publishMessage('chat', 'notification.send', {
        type: 'message',
        conversationId: data.conversationId,
        messageId: message.id
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
      console.log('🔔 Notification:', data);

      // Process notification (send email, push notification, etc)
    } catch (error) {
      console.error('Error processing notification:', error);
    }
  });
};
