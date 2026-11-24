import { DOCUMENT } from '@angular/common';
import { inject, Injectable, signal } from '@angular/core';

export type ThemeMode = 'light' | 'dark';

const STORAGE_KEY = 'library.theme';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly document = inject(DOCUMENT);

  readonly mode = signal<ThemeMode>(this.initialMode());

  constructor() {
    this.apply(this.mode());
  }

  toggle(): void {
    const next: ThemeMode = this.mode() === 'dark' ? 'light' : 'dark';

    this.mode.set(next);
    this.apply(next);
    this.store(next);
  }

  private apply(mode: ThemeMode): void {
    this.document.documentElement.dataset['theme'] = mode;
  }

  private initialMode(): ThemeMode {
    const stored = this.read();

    if (stored === 'light' || stored === 'dark') {
      return stored;
    }

    const view = this.document.defaultView;
    const prefersDark = view?.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false;

    return prefersDark ? 'dark' : 'light';
  }

  private read(): string | null {
    try {
      return this.document.defaultView?.localStorage.getItem(STORAGE_KEY) ?? null;
    } catch {
      return null;
    }
  }

  private store(mode: ThemeMode): void {
    try {
      this.document.defaultView?.localStorage.setItem(STORAGE_KEY, mode);
    } catch {
      return;
    }
  }
}
