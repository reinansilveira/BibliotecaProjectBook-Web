import { Component, inject, input, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { Router, RouterLink } from '@angular/router';
import { AccountApi } from '../../core/api/library-api';
import { AuthService } from '../../core/auth/auth.service';
import { errorMessage } from '../../core/http/error-message';
import { I18n } from '../../core/i18n/i18n.service';
import { TranslatePipe } from '../../core/i18n/pipes';
import { Notifier } from '../../core/notifications/notifier';

const FORM_IMPORTS = [
  ReactiveFormsModule,
  RouterLink,
  MatButtonModule,
  MatFormFieldModule,
  MatIconModule,
  MatInputModule,
  TranslatePipe,
];

@Component({
  selector: 'app-forgot-password-page',
  imports: FORM_IMPORTS,
  template: `
    <section class="narrow-auth">
      <div class="card surface">
        <span class="mark"><mat-icon>lock_reset</mat-icon></span>
        <h1>{{ 'Forgot your password?' | t }}</h1>
        @if (sent()) {
          <p class="lead" role="status">
            {{
              'If an account exists for that email, we sent a link to choose a new password. It is valid for one hour.'
                | t
            }}
          </p>
          <a mat-flat-button routerLink="/login">{{ 'Back to sign in' | t }}</a>
        } @else {
          <p class="lead">{{ 'Enter your email and we will send you a reset link.' | t }}</p>
          <form class="form-grid" [formGroup]="form" (ngSubmit)="submit()">
            <mat-form-field appearance="outline">
              <mat-label>{{ 'Email' | t }}</mat-label>
              <input matInput type="email" formControlName="email" autocomplete="email" />
              <mat-error>{{ 'Enter a valid email.' | t }}</mat-error>
            </mat-form-field>
            <button mat-flat-button class="submit" type="submit" [disabled]="busy()">
              {{ 'Send reset link' | t }}
            </button>
          </form>
          <a class="link back" routerLink="/login">{{ 'Back to sign in' | t }}</a>
        }
      </div>
    </section>
  `,
})
export class ForgotPasswordPage {
  private readonly accountApi = inject(AccountApi);
  private readonly notifier = inject(Notifier);

  protected readonly busy = signal(false);
  protected readonly sent = signal(false);
  protected readonly form = inject(FormBuilder).nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
  });

  protected submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.busy.set(true);
    this.accountApi.forgotPassword(this.form.getRawValue().email).subscribe({
      next: () => this.sent.set(true),
      error: (error: unknown) => {
        this.busy.set(false);
        this.notifier.error(error);
      },
    });
  }
}

@Component({
  selector: 'app-reset-password-page',
  imports: FORM_IMPORTS,
  template: `
    <section class="narrow-auth">
      <div class="card surface">
        <span class="mark"><mat-icon>password</mat-icon></span>
        <h1>{{ 'Choose a new password' | t }}</h1>
        @if (!token()) {
          <p class="lead">{{ 'This link is invalid or has expired.' | t }}</p>
          <a mat-flat-button routerLink="/forgot-password">{{ 'Request a new link' | t }}</a>
        } @else {
          <form class="form-grid" [formGroup]="form" (ngSubmit)="submit()">
            <mat-form-field appearance="outline">
              <mat-label>{{ 'New password' | t }}</mat-label>
              <input
                matInput
                type="password"
                formControlName="password"
                autocomplete="new-password"
              />
              <mat-hint>{{ 'At least 6 characters' | t }}</mat-hint>
              <mat-error>{{ 'Use at least 6 characters.' | t }}</mat-error>
            </mat-form-field>
            <button mat-flat-button class="submit" type="submit" [disabled]="busy()">
              {{ 'Save new password' | t }}
            </button>
          </form>
        }
      </div>
    </section>
  `,
})
export class ResetPasswordPage {
  private readonly accountApi = inject(AccountApi);
  private readonly notifier = inject(Notifier);
  private readonly router = inject(Router);
  private readonly i18n = inject(I18n);

  readonly token = input<string>();

  protected readonly busy = signal(false);
  protected readonly form = inject(FormBuilder).nonNullable.group({
    password: ['', [Validators.required, Validators.minLength(6)]],
  });

  protected submit(): void {
    const token = this.token();

    if (!token || this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.busy.set(true);
    this.accountApi.resetPassword(token, this.form.getRawValue().password).subscribe({
      next: () => {
        this.notifier.success(this.i18n.t('Password changed. Sign in with the new one.'));
        void this.router.navigate(['/login']);
      },
      error: (error: unknown) => {
        this.busy.set(false);
        this.notifier.error(error);
      },
    });
  }
}

type ConfirmationState = 'working' | 'done' | 'failed';

@Component({
  selector: 'app-confirm-email-page',
  imports: FORM_IMPORTS,
  template: `
    <section class="narrow-auth">
      <div class="card surface">
        @switch (state()) {
          @case ('working') {
            <span class="mark"><mat-icon>mark_email_unread</mat-icon></span>
            <h1>{{ 'Confirming your email…' | t }}</h1>
          }
          @case ('done') {
            <span class="mark ok"><mat-icon>mark_email_read</mat-icon></span>
            <h1>{{ 'Email confirmed' | t }}</h1>
            <p class="lead">{{ 'Thanks! Your email address is confirmed.' | t }}</p>
            <a mat-flat-button routerLink="/books">{{ 'Browse the catalog' | t }}</a>
          }
          @case ('failed') {
            <span class="mark warn"><mat-icon>error</mat-icon></span>
            <h1>{{ 'We could not confirm your email' | t }}</h1>
            <p class="lead">{{ message() | t }}</p>
            @if (auth.isAuthenticated()) {
              <a mat-flat-button routerLink="/profile">{{ 'Send a new link' | t }}</a>
            } @else {
              <a mat-flat-button routerLink="/login">{{ 'Sign in' | t }}</a>
            }
          }
        }
      </div>
    </section>
  `,
})
export class ConfirmEmailPage implements OnInit {
  private readonly accountApi = inject(AccountApi);
  protected readonly auth = inject(AuthService);

  readonly token = input<string>();

  protected readonly state = signal<ConfirmationState>('working');
  protected readonly message = signal('This link is invalid or has expired.');

  ngOnInit(): void {
    const token = this.token();

    if (!token) {
      this.state.set('failed');
      return;
    }

    this.accountApi.confirmEmail(token).subscribe({
      next: () => this.state.set('done'),
      error: (error: unknown) => {
        this.message.set(errorMessage(error));
        this.state.set('failed');
      },
    });
  }
}
