/**
 * Servicio Mock de Notificaciones Push
 * En producción, integrar con:
 * - Firebase Cloud Messaging (FCM)
 * - Apple Push Notification (APN)
 * - Amazon SNS
 */

interface PushNotification {
  userId: string;
  title: string;
  body: string;
  data: Record<string, string>;
  icon?: string;
  badge?: string;
  tag?: string;
}

interface PushResponse {
  success: boolean;
  messageId?: string;
  error?: string;
}

// Mock de dispositivos registrados (en producción usar base de datos)
const registeredDevices = new Map<string, string[]>();

// Mock de usuario activo (en producción usar Redis)
const activeUsers = new Map<string, { socketId: string; timestamp: number }>();

/**
 * Registrar dispositivo para notificaciones push
 */
export const registerDevice = (userId: string, deviceToken: string): void => {
  try {
    const devices = registeredDevices.get(userId) || [];
    if (!devices.includes(deviceToken)) {
      devices.push(deviceToken);
      registeredDevices.set(userId, devices);
      console.log(`✅ Device registered for user ${userId}: ${deviceToken}`);
    }
  } catch (error) {
    console.error('Error registering device:', error);
  }
};

/**
 * Marcar usuario como activo en sesión
 */
export const markUserAsActive = (userId: string, socketId: string): void => {
  try {
    activeUsers.set(userId, {
      socketId,
      timestamp: Date.now()
    });
    console.log(`✅ User ${userId} marked as active`);
  } catch (error) {
    console.error('Error marking user as active:', error);
  }
};

/**
 * Marcar usuario como inactivo
 */
export const markUserAsInactive = (userId: string): void => {
  try {
    activeUsers.delete(userId);
    console.log(`❌ User ${userId} marked as inactive`);
  } catch (error) {
    console.error('Error marking user as inactive:', error);
  }
};

/**
 * Verificar si usuario tiene sesión activa
 */
export const isUserActive = (userId: string): boolean => {
  const userSession = activeUsers.get(userId);
  if (!userSession) return false;

  // Considerar sesión activa si fue actualizada hace menos de 5 minutos
  const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
  return userSession.timestamp > fiveMinutesAgo;
};

/**
 * Obtener información de sesión activa del usuario
 */
export const getUserSession = (userId: string) => {
  return activeUsers.get(userId);
};

/**
 * Enviar notificación push mock
 * En producción, esto enviaría a Firebase Cloud Messaging, APN, etc.
 */
export const sendPushNotification = async (
  notification: PushNotification
): Promise<PushResponse> => {
  try {
    // Verificar si el usuario tiene dispositivos registrados
    const devices = registeredDevices.get(notification.userId);
    if (!devices || devices.length === 0) {
      console.log(`⚠️  No devices registered for user ${notification.userId}`);
      return {
        success: false,
        error: 'No devices registered for this user'
      };
    }

    // En producción, enviar a cada dispositivo
    console.log(`📱 Sending push notification to user ${notification.userId}`);
    console.log(`   Title: ${notification.title}`);
    console.log(`   Body: ${notification.body}`);
    console.log(`   Data: ${JSON.stringify(notification.data)}`);
    console.log(`   Devices: ${devices.length}`);

    // Mock: simular respuesta exitosa
    const messageId = `msg_${Date.now()}`;
    
    return {
      success: true,
      messageId
    };
  } catch (error) {
    console.error('Error sending push notification:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};

/**
 * Enviar notificación por email mock
 * En producción, usar servicio como SendGrid, Mailgun, etc.
 */
export const sendEmailNotification = async (
  toEmail: string,
  userName: string,
  senderName: string,
  messagePreview: string
): Promise<PushResponse> => {
  try {
    // En desarrollo, simular envío
    console.log(`📧 Sending email notification`);
    console.log(`   To: ${toEmail}`);
    console.log(`   From: ${senderName}`);
    console.log(`   Message: ${messagePreview}`);

    // Simular envío con Nodemailer (comentado para no requerir configuración SMTP)
    // const transporter = nodemailer.createTransport({
    //   host: process.env.SMTP_HOST,
    //   port: parseInt(process.env.SMTP_PORT || '587'),
    //   secure: process.env.SMTP_SECURE === 'true',
    //   auth: {
    //     user: process.env.SMTP_USER,
    //     pass: process.env.SMTP_PASSWORD
    //   }
    // });

    // const mailOptions = {
    //   from: process.env.SMTP_FROM || 'noreply@chatapp.com',
    //   to: toEmail,
    //   subject: `Nueva mensaje de ${senderName}`,
    //   html: `
    //     <h2>Tienes un nuevo mensaje</h2>
    //     <p><strong>${senderName}</strong> te envió:</p>
    //     <p>"${messagePreview}"</p>
    //     <p><a href="${process.env.FRONTEND_URL}/chat">Ver en Chat App</a></p>
    //   `
    // };

    // await transporter.sendMail(mailOptions);

    const messageId = `email_${Date.now()}`;
    
    return {
      success: true,
      messageId
    };
  } catch (error) {
    console.error('Error sending email notification:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};

/**
 * Enviar notificación SMS mock
 * En producción, usar servicio como Twilio
 */
export const sendSMSNotification = async (
  phoneNumber: string,
  senderName: string,
  messagePreview: string
): Promise<PushResponse> => {
  try {
    console.log(`📱 Sending SMS notification`);
    console.log(`   To: ${phoneNumber}`);
    console.log(`   From: ${senderName}`);
    console.log(`   Message: ${messagePreview}`);

    // En producción:
    // const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
    // await client.messages.create({
    //   body: `${senderName}: ${messagePreview}`,
    //   from: process.env.TWILIO_PHONE_NUMBER,
    //   to: phoneNumber
    // });

    const messageId = `sms_${Date.now()}`;
    
    return {
      success: true,
      messageId
    };
  } catch (error) {
    console.error('Error sending SMS notification:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};

/**
 * Enviar notificación multicanal cuando usuario está inactivo
 */
export const sendMultiChannelNotification = async (
  userId: string,
  userName: string,
  email: string,
  phoneNumber: string | null,
  senderName: string,
  messagePreview: string
): Promise<void> => {
  try {
    // Verificar si usuario está activo
    if (isUserActive(userId)) {
      console.log(`ℹ️  User ${userId} is active, skipping notifications`);
      return;
    }

    console.log(`\n🔔 User ${userId} is inactive, sending notifications...`);

    // Enviar notificación push
    await sendPushNotification({
      userId,
      title: `Nuevo mensaje de ${senderName}`,
      body: messagePreview,
      data: {
        userId,
        senderName,
        action: 'open_chat'
      }
    });

    // Enviar email
    await sendEmailNotification(
      email,
      userName,
      senderName,
      messagePreview
    );

    // Enviar SMS si teléfono disponible
    if (phoneNumber) {
      await sendSMSNotification(
        phoneNumber,
        senderName,
        messagePreview
      );
    }
  } catch (error) {
    console.error('Error sending multi-channel notification:', error);
  }
};

/**
 * Obtener estadísticas de notificaciones
 */
export const getNotificationStats = () => {
  return {
    activeUsers: activeUsers.size,
    registeredDevices: Array.from(registeredDevices.entries()).reduce(
      (sum, [, devices]) => sum + devices.length,
      0
    ),
    activeUsersList: Array.from(activeUsers.keys()),
    registeredDevicesByUser: Object.fromEntries(registeredDevices)
  };
};

/**
 * Limpiar sesiones expiradas
 */
export const cleanupExpiredSessions = (): number => {
  let cleaned = 0;
  const thirtyMinutesAgo = Date.now() - 30 * 60 * 1000;

  for (const [userId, session] of activeUsers.entries()) {
    if (session.timestamp < thirtyMinutesAgo) {
      activeUsers.delete(userId);
      cleaned++;
    }
  }

  if (cleaned > 0) {
    console.log(`🧹 Cleaned up ${cleaned} expired sessions`);
  }

  return cleaned;
};

/**
 * Ejecutar limpieza de sesiones cada 5 minutos
 */
export const startSessionCleanupInterval = (): NodeJS.Timeout => {
  return setInterval(() => {
    cleanupExpiredSessions();
  }, 5 * 60 * 1000);
};
