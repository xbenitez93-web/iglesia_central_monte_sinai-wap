import { AppNotification, ChurchConfig } from '../types';

export const isPushSupported = (): boolean => {
  return typeof window !== 'undefined' && 'Notification' in window;
};

export const getNotificationPermission = (): NotificationPermission => {
  if (!isPushSupported()) return 'denied';
  return Notification.permission;
};

export const requestNotificationPermission = async (): Promise<NotificationPermission> => {
  if (!isPushSupported()) {
    console.warn('Este navegador no soporta la API de Notificaciones Push.');
    return 'denied';
  }
  try {
    const permission = await Notification.requestPermission();
    return permission;
  } catch (error) {
    console.error('Error solicitando permisos de notificación:', error);
    return 'denied';
  }
};

export const playNotificationSound = () => {
  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioContext) {
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15); // A5

      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.35);
    }
  } catch (err) {
    // AudioContext blocked or not supported
  }
};

export const triggerNativePush = (
  title: string,
  body: string,
  options?: {
    tag?: string;
    icon?: string;
    badge?: string;
    data?: any;
    silent?: boolean;
  }
): boolean => {
  if (!isPushSupported()) return false;

  if (Notification.permission === 'granted') {
    try {
      const notif = new Notification(title, {
        body,
        icon: options?.icon || '/icon.png',
        badge: options?.badge || '/icon.png',
        tag: options?.tag || `eclesia-notif-${Date.now()}`,
        data: options?.data,
        silent: options?.silent || false,
      });

      if (!options?.silent) {
        playNotificationSound();
      }

      notif.onclick = function () {
        window.focus();
        this.close();
      };
      return true;
    } catch (e) {
      console.warn('Native notification instantiation error, trying service worker fallback:', e);
      if ('serviceWorker' in navigator && navigator.serviceWorker.ready) {
        navigator.serviceWorker.ready.then((registration) => {
          registration.showNotification(title, {
            body,
            icon: options?.icon || '/icon.png',
            tag: options?.tag || `eclesia-notif-${Date.now()}`,
            data: options?.data,
          });
        });
        return true;
      }
    }
  }
  return false;
};

export const updateAppBadge = (count: number) => {
  try {
    if ('setAppBadge' in navigator) {
      if (count > 0) {
        (navigator as any).setAppBadge(count).catch(() => {});
      } else {
        (navigator as any).clearAppBadge().catch(() => {});
      }
    }
  } catch (e) {
    // Badging API not available on this platform
  }

  // Also update document title for tab indication
  try {
    const baseTitle = 'Iglesia Central Monte Sinaí';
    if (count > 0) {
      document.title = `(${count}) 🔔 ${baseTitle}`;
    } else {
      document.title = baseTitle;
    }
  } catch (e) {}

  // Update favicon with red notification circle & number
  try {
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      // Draw base church badge
      ctx.fillStyle = '#4f46e5';
      ctx.beginPath();
      ctx.roundRect(4, 4, 56, 56, 14);
      ctx.fill();

      // Draw cross/church symbol
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(28, 14, 8, 36);
      ctx.fillRect(18, 24, 28, 8);

      if (count > 0) {
        // Red badge circle
        ctx.fillStyle = '#ef4444';
        ctx.beginPath();
        ctx.arc(48, 16, 14, 0, 2 * Math.PI);
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2.5;
        ctx.stroke();

        // Badge number text
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 16px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        const displayCount = count > 99 ? '99+' : `${count}`;
        ctx.fillText(displayCount, 48, 17);
      }

      let link: HTMLLinkElement | null = document.querySelector("link[rel*='icon']");
      if (!link) {
        link = document.createElement('link');
        link.type = 'image/x-icon';
        link.rel = 'shortcut icon';
        document.getElementsByTagName('head')[0].appendChild(link);
      }
      link.href = canvas.toDataURL('image/png');
    }
  } catch (e) {}
};

export const initialChurchNotifications: AppNotification[] = [];
