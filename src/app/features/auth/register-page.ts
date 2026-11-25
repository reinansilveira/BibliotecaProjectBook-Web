import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { Router, RouterLink } from '@angular/router';
import { switchMap } from 'rxjs';
import { AuthService } from '../../core/auth/auth.service';
import { I18n } from '../../core/i18n/i18n.service';
import { TranslatePipe } from '../../core/i18n/pipes';
import { Notifier } from '../../core/notifications/notifier';
import { AuthShowcase } from './auth-showcase';

@Component({
  selector: 'app-register-page',
  imports: [
    AuthShowcase,
    ReactiveFormsModule,
    RouterLink,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    TranslatePipe,
  ],
  templateUrl: './register-page.html',
  styleUrl: './auth-card.scss',
})
export class RegisterPage {
  private readonly auth = inject(AuthService);
  private readonly notifier = inject(Notifier);
  private readonly router = inject(Router);
  private readonly i18n = inject(I18n);

  protected readonly submitting = signal(false);
  protected readonly revealed = signal(false);
  protected readonly today = new Date().toISOString().slice(0, 10);

  protected readonly form = inject(FormBuilder).nonNullable.group({
    name: ['', [Validators.required, Validators.maxLength(150)]],
    email: ['', [Validators.required, Validators.email]],
    phone: ['', [Validators.required, Validators.maxLength(20)]],
    birthDate: ['', Validators.required],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });

  protected submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const request = this.form.getRawValue();

    this.submitting.set(true);
    this.auth
      .register(request)
      .pipe(switchMap(() => this.auth.login({ email: request.email, password: request.password })))
      .subscribe({
        next: (session) => {
          this.notifier.success(
            this.i18n.t('Welcome, {name}! Your account is ready.', { name: session.name }),
          );
          void this.router.navigate(['/books']);
        },
        error: (error: unknown) => {
          this.submitting.set(false);
          this.notifier.error(error);
        },
      });
  }
}
