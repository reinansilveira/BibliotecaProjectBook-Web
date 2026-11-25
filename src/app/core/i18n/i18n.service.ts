import { DOCUMENT, registerLocaleData } from '@angular/common';
import localePt from '@angular/common/locales/pt';
import { computed, inject, Injectable, signal } from '@angular/core';
import { PT_BR } from './pt-br';

export type Language = 'en' | 'pt-BR';

export type TranslationParams = Record<string, string | number | null | undefined>;

export interface LanguageOption {
  code: Language;
  label: string;
  short: string;
}

export const LANGUAGES: LanguageOption[] = [
  { code: 'en', label: 'English', short: 'EN' },
  { code: 'pt-BR', label: 'Português (Brasil)', short: 'PT' },
];

const TRANSLATIONS: Record<Language, ReadonlyMap<string, string>> = {
  en: new Map(),
  'pt-BR': PT_BR,
};

const LOCALES: Record<Language, string> = { en: 'en-US', 'pt-BR': 'pt-BR' };

const STORAGE_KEY = 'library.language';

registerLocaleData(localePt, 'pt-BR');

export function interpolate(template: string, params?: TranslationParams): string {
  if (!params) {
    return template;
  }

  return template.replace(/\{(\w+)\}/g, (placeholder, name: string) =>
    name in params ? String(params[name] ?? '') : placeholder,
  );
}

@Injectable({ providedIn: 'root' })
export class I18n {
  private readonly document = inject(DOCUMENT);

  readonly language = signal<Language>(this.initialLanguage());
  readonly locale = computed(() => LOCALES[this.language()]);
  readonly option = computed(
    () => LANGUAGES.find((language) => language.code === this.language()) ?? LANGUAGES[0],
  );

  constructor() {
    this.apply(this.language());
  }

  use(language: Language): void {
    this.language.set(language);
    this.apply(language);
    this.store(language);
  }

  t(text: string, params?: TranslationParams): string {
    return interpolate(TRANSLATIONS[this.language()].get(text) ?? text, params);
  }

  plural(count: number, one: string, other: string): string {
    return this.t(count === 1 ? one : other, { count });
  }

  private apply(language: Language): void {
    this.document.documentElement.lang = language;
  }

  private initialLanguage(): Language {
    const stored = this.read();

    if (stored === 'en' || stored === 'pt-BR') {
      return stored;
    }

    const browser = this.document.defaultView?.navigator.language ?? 'en';

    return browser.toLowerCase().startsWith('pt') ? 'pt-BR' : 'en';
  }

  private read(): string | null {
    try {
      return this.document.defaultView?.localStorage.getItem(STORAGE_KEY) ?? null;
    } catch {
      return null;
    }
  }

  private store(language: Language): void {
    try {
      this.document.defaultView?.localStorage.setItem(STORAGE_KEY, language);
    } catch {
      return;
    }
  }
}
