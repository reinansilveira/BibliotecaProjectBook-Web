import { Component, inject, input, isDevMode, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import { Notifier } from '../../core/notifications/notifier';
import { AuthShowcase } from './auth-showcase';

@Component({
  selector: 'app-login-page',
  imports: [
    AuthShowcase,
    ReactiveFormsModule,
    RouterLink,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
  ],
  templateUrl: './login-page.html',
  styleUrl: './auth-card.scss',
})
export class LoginPage {
  private readonly auth = inject(AuthService);
  private readonly notifier = inject(Notifier);
  private readonly router = inject(Router);

  readonly returnUrl = input<string>();
  readonly expired = input<string>();

  protected readonly showDemoHint = isDevMode();
  protected readonly submitting = signal(false);
  protected readonly revealed = signal(false);

  protected readonly form = inject(FormBuilder).nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
  });

  protected useDemoAccount(): void {
    this.form.setValue({ email: 'admin@library.local', password: 'Admin@123' });
  }

  protected submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.submitting.set(true);
    this.auth.login(this.form.getRawValue()).subscribe({
      next: () => void this.router.navigateByUrl(this.returnUrl() || '/books'),
      error: (error: unknown) => {
        this.submitting.set(false);
        this.notifier.error(error);
      },
    });
  }
}
