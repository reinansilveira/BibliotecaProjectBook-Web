declare const API_BASE_URL: string | undefined;

const baseUrl = typeof API_BASE_URL === 'string' ? API_BASE_URL.replace(/\/+$/, '') : '';

export const API_URL = `${baseUrl}/api`;
