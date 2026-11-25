import { inject, Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { errorMessage } from '../http/error-message';
import { I18n } from '../i18n/i18n.service';

@Injectable({ providedIn: 'root' })
export class Notifier {
  private readonly snackBar = inject(MatSnackBar);
  private readonly i18n = inject(I18n);

  success(message: string): void {
    this.snackBar.open(message, this.i18n.t('OK'), { duration: 4000 });
  }

  error(error: unknown): void {
    this.snackBar.open(this.i18n.t(errorMessage(error)), this.i18n.t('Dismiss'), {
      duration: 6000,
      politeness: 'assertive',
    });
  }
}
