export function formatDate(date: Date | string | number): string {
  const dateObj = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date;
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const dateOnly = new Date(dateObj.getFullYear(), dateObj.getMonth(), dateObj.getDate());

  if (dateOnly.getTime() === today.getTime()) {
    return dateObj.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
  }

  if (dateOnly.getTime() === yesterday.getTime()) {
    return 'Ayer';
  }

  return dateObj.toLocaleDateString('es-ES', { month: 'short', day: 'numeric' });
}

export function formatTime(date: Date | string | number): string {
  const dateObj = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date;
  return dateObj.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
}

export function truncateText(text: string, length: number): string {
  return text.length > length ? `${text.slice(0, length)}...` : text;
}

const AVATAR_HUES = [250, 30, 145, 300, 20, 200];

export function colorForName(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash * 31 + name.charCodeAt(i)) % 1000;
  }
  const hue = AVATAR_HUES[hash % AVATAR_HUES.length];
  return `oklch(0.62 0.13 ${hue})`;
}

export function initialsForName(name: string): string {
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] || '') + (parts[1]?.[0] || '')).toUpperCase();
}
