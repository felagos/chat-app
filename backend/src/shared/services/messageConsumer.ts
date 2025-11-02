import { consumeMessages, publishMessage } from './rabbitmq';
import prisma from '../../config/prisma';
import { isUserActive, sendMultiChannelNotification } from './pushNotification';

export const startMessageConsumer = async (): Promise<void> => {
  await consumeMessages('messages.queue', async (msg) => {
    try {
      if (!msg) return;

      const data = JSON.parse(msg.content.toString());

      // Crear mensaje en la base de datos
      const message = await prisma.message.create({
        data: {
          content: data.content,
          conversationId: data.conversationId,
          userId: data.userId,
          status: 'delivered'
        }
      });

      console.log(`📨 Message saved: ${message.id}`);

      // Obtener información de la conversación para identificar destinatarios
      const conversation = await prisma.conversation.findUnique({
        where: { id: data.conversationId },
        include: {
          participants: true
        }
      });

      if (conversation) {
        // Identificar destinatarios (todos excepto el remitente)
        const recipients = conversation.participants.filter(
          (p) => p.id !== data.userId
        );

        // Verificar sesiones activas y enviar notificaciones
        for (const recipient of recipients) {
          const isActive = isUserActive(recipient.id);
          
          if (!isActive) {
            console.log(`\n📲 User ${recipient.id} is inactive, sending notifications...`);
            
            // Obtener datos del remitente para la notificación
            const sender = await prisma.user.findUnique({
              where: { id: data.userId }
            });

            if (sender) {
              await sendMultiChannelNotification(
                recipient.id,
                recipient.username,
                recipient.email,
                null, // phoneNumber (si está disponible en modelo)
                sender.username,
                data.content.substring(0, 50) // Preview del mensaje
              );
            }
          } else {
            console.log(`ℹ️  User ${recipient.id} is active, skipping notifications`);
          }
        }
      }

      // Publicar notificación para emisión en tiempo real
      await publishMessage('chat', 'notification.send', {
        type: 'message',
        conversationId: data.conversationId,
        messageId: message.id,
        senderId: data.userId
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

    } catch (error) {
      console.error('Error processing notification:', error);
    }
  });
};
