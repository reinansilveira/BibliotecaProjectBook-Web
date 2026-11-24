import { Injectable } from '@angular/core';

const REFRESH_TOKEN_KEY = 'library.refresh-token';

@Injectable({ providedIn: 'root' })
export class TokenStorage {
  read(): string | null {
    try {
      return localStorage.getItem(REFRESH_TOKEN_KEY);
    } catch {
      return null;
    }
  }

  write(refreshToken: string): void {
    try {
      localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
    } catch {
      return;
    }
  }

  clear(): void {
    try {
      localStorage.removeItem(REFRESH_TOKEN_KEY);
    } catch {
      return;
    }
  }
}
