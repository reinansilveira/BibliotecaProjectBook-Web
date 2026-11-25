declare const API_BASE_URL: string | undefined;

export const API_ORIGIN = typeof API_BASE_URL === 'string' ? API_BASE_URL.replace(/\/+$/, '') : '';

export const API_URL = `${API_ORIGIN}/api/v1`;

export const NOTIFICATIONS_HUB_URL = `${API_ORIGIN}/hubs/notifications`;

export function absoluteApiUrl(path: string): string {
  if (/^https?:\/\//.test(path)) {
    return path;
  }

  return `${API_ORIGIN}${path.startsWith('/') ? path : `/${path}`}`;
}
