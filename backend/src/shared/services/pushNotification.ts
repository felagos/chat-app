// Mock de usuario activo (en producción usar Redis)
const activeUsers = new Map<string, { socketId: string; timestamp: number }>();

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
