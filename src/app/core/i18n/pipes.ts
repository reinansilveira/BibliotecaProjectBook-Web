import { formatDate, formatNumber } from '@angular/common';
import { inject, Pipe, PipeTransform } from '@angular/core';
import { I18n, TranslationParams } from './i18n.service';

@Pipe({ name: 't', pure: false })
export class TranslatePipe implements PipeTransform {
  private readonly i18n = inject(I18n);

  transform(text: string, params?: TranslationParams): string {
    return this.i18n.t(text, params);
  }
}

@Pipe({ name: 'localDate', pure: false })
export class LocalDatePipe implements PipeTransform {
  private readonly i18n = inject(I18n);

  transform(value: string | null | undefined, format = 'mediumDate'): string | null {
    if (!value) {
      return null;
    }

    return formatDate(value, format, this.i18n.locale());
  }
}

@Pipe({ name: 'localNumber', pure: false })
export class LocalNumberPipe implements PipeTransform {
  private readonly i18n = inject(I18n);

  transform(value: number | null | undefined, digitsInfo?: string): string | null {
    if (value === null || value === undefined) {
      return null;
    }

    return formatNumber(value, this.i18n.locale(), digitsInfo);
  }
}

export const I18N_PIPES = [TranslatePipe, LocalDatePipe, LocalNumberPipe] as const;
