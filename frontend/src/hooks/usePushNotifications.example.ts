/**
 * Ejemplo de Integración de Push Notifications en Frontend
 * 
 * Este archivo muestra cómo integrar notificaciones push con el servicio
 * de notificaciones push del backend.
 * 
 * En producción usar Firebase Cloud Messaging (FCM) o similar
 */

import { useEffect, useState } from 'react';

// ============================================
// Ejemplo 1: Solicitar permiso de notificaciones
// ============================================

export const requestNotificationPermission = async (): Promise<string | null> => {
  if (!('Notification' in window)) {
    console.log('Este navegador no soporta notificaciones');
    return null;
  }

  if (Notification.permission === 'granted') {
    console.log('✅ Notificaciones ya permitidas');
    return 'granted';
  }

  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    console.log(`✅ Permiso de notificaciones: ${permission}`);
    return permission;
  }

  console.log('❌ Usuario rechazó notificaciones');
  return null;
};

// ============================================
// Ejemplo 2: Registrar Service Worker para Push
// ============================================

export const registerServiceWorkerForPush = async (): Promise<void> => {
  if ('serviceWorker' in navigator) {
    try {
      // Crear un service worker simple
      const swCode = `
        self.addEventListener('push', (event) => {
          const data = event.data?.json() ?? {};
          const title = data.title || 'Nuevo mensaje';
          const options = {
            body: data.body,
            icon: '/app-icon.png',
            badge: '/badge-icon.png',
            tag: data.tag || 'default',
            data: data.data || {}
          };
          
          self.registration.showNotification(title, options);
        });

        self.addEventListener('notificationclick', (event) => {
          event.notification.close();
          
          // Abrir la conversación cuando se haga click
          const data = event.notification.data;
          event.waitUntil(
            clients.matchAll({ type: 'window' }).then((windowClients) => {
              for (let i = 0; i < windowClients.length; i++) {
                const client = windowClients[i];
                if (client.url === '/' && 'focus' in client) {
                  return client.focus();
                }
              }
              return clients.openWindow('/chat');
            })
          );
        });
      `;

      // Registrar el service worker
      await navigator.serviceWorker.register(
        new URL('data:application/javascript;base64,' + btoa(swCode), import.meta.url)
      );
      
      console.log('✅ Service Worker registrado para Push Notifications');
    } catch (error) {
      console.error('Error registrando Service Worker:', error);
    }
  }
};

// ============================================
// Ejemplo 3: Obtener Push Subscription
// ============================================

export const getPushSubscription = async (): Promise<PushSubscription | null> => {
  if ('serviceWorker' in navigator && 'PushManager' in window) {
    try {
      const reg = await navigator.serviceWorker.ready;
      const subscription = await reg.pushManager.getSubscription();
      
      if (subscription) {
        console.log('✅ Push Subscription existente encontrada');
        return subscription;
      }

      // Crear nueva suscripción
      const vapidKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;
      
      const newSubscription = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: vapidKey
      });

      console.log('✅ Nouvelle Push Subscription creada');
      return newSubscription;
    } catch (error) {
      console.error('Error obteniendo Push Subscription:', error);
      return null;
    }
  }
  return null;
};

// ============================================
// Ejemplo 4: Enviar Device Token al Backend
// ============================================

export const registerDeviceWithBackend = async (
  token: string,
  userId: string,
  apiToken: string
): Promise<boolean> => {
  try {
    const response = await fetch('http://localhost:3000/api/notifications/device/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiToken}`
      },
      body: JSON.stringify({
        userId,
        deviceToken: token
      })
    });

    if (response.ok) {
      console.log('✅ Device registrado en el backend');
      return true;
    }

    throw new Error('Error al registrar device');
  } catch (error) {
    console.error('Error registrando device:', error);
    return false;
  }
};

// ============================================
// Ejemplo 5: Hook React para Push Notifications
// ============================================

/**
 * Hook para inicializar notificaciones push
 * 
 * Uso:
 * const { isSupported, isEnabled, error } = usePushNotifications();
 */
export const usePushNotifications = () => {
  const [isSupported, setIsSupported] = useState(false);
  const [isEnabled, setIsEnabled] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Verificar soporte
    const supported = 'Notification' in window && 'serviceWorker' in navigator;
    setIsSupported(supported);

    if (!supported) return;

    const initializePush = async () => {
      try {
        // 1. Solicitar permisos
        const permission = await requestNotificationPermission();
        if (permission !== 'granted') {
          setError('Permisos de notificación no otorgados');
          return;
        }

        // 2. Registrar Service Worker
        await registerServiceWorkerForPush();

        // 3. Obtener suscripción
        const subscription = await getPushSubscription();
        if (!subscription) {
          setError('No se pudo crear suscripción push');
          return;
        }

        // 4. Obtener token del usuario (desde localStorage o context)
        const authStore = JSON.parse(localStorage.getItem('auth-store') || '{}');
        const { userId, token } = authStore.state || {};

        if (!userId || !token) {
          setError('Usuario no autenticado');
          return;
        }

        // 5. Registrar en backend
        const subscriptionString = JSON.stringify(subscription);
        const registered = await registerDeviceWithBackend(
          subscriptionString,
          userId,
          token
        );

        if (registered) {
          setIsEnabled(true);
        }
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Error desconocido';
        setError(errorMsg);
        console.error('Error inicializando push notifications:', err);
      }
    };

    initializePush();
  }, []);

  return { isSupported, isEnabled, error };
};

// ============================================
// Ejemplo 6: Integrar en App Principal
// ============================================

/**
 * En tu App.tsx o main component:
 * 
 * ```tsx
 * import { usePushNotifications } from './hooks/usePushNotifications';
 * 
 * function App() {
 *   const { isSupported, isEnabled, error } = usePushNotifications();
 *   
 *   return (
 *     <div>
 *       {error && <div className="error">{error}</div>}
 *       {isEnabled && <div className="success">Notificaciones habilitadas</div>}
 *     </div>
 *   );
 * }
 * ```
 */

// ============================================
// Ejemplo 7: Mock de Notificaciones Locales
// ============================================

/**
 * Para testing sin servidor, mostrar notificaciones locales
 */
export const showMockNotification = (
  title: string,
  options?: NotificationOptions
): Notification | null => {
  if (Notification.permission === 'granted') {
    return new Notification(title, {
      icon: '/app-icon.png',
      badge: '/badge-icon.png',
      ...options
    });
  }
  return null;
};

// ============================================
// Ejemplo 8: Configuración en .env
// ============================================

/**
 * .env archivo:
 * 
 * # Push Notifications (VAPID keys generados con firebase)
 * VITE_VAPID_PUBLIC_KEY=xxxxxxxx
 * VITE_API_ENDPOINT=http://localhost:3000
 * 
 * Generar VAPID keys:
 * npm install -g firebase-tools
 * firebase projects:list
 * firebase login
 * 
 * O usar web-push:
 * npm install -g web-push
 * web-push generate-vapid-keys
 */

// ============================================
// Ejemplo 9: Verificar Estado de Notificaciones
// ============================================

export const getNotificationStatus = () => {
  return {
    permission: Notification.permission,
    supported: 'Notification' in window,
    serviceWorkerSupported: 'serviceWorker' in navigator,
    pushManagerSupported: 'PushManager' in window,
    serviceWorkerRegistrations:
      'serviceWorker' in navigator
        ? navigator.serviceWorker.getRegistrations().then(r => r.length)
        : Promise.resolve(0)
  };
};

// ============================================
// Ejemplo 10: Limpiar Notificaciones
// ============================================

export const clearNotifications = async (): Promise<void> => {
  if ('serviceWorker' in navigator && 'getRegistrations' in navigator.serviceWorker) {
    const registrations = await navigator.serviceWorker.getRegistrations();
    
    for (const registration of registrations) {
      const notifications = await registration.getNotifications();
      
      for (const notification of notifications) {
        notification.close();
      }
    }
    
    console.log('✅ Notificaciones limpiadas');
  }
};
