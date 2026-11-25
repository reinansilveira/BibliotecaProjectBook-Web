import { HttpErrorResponse } from '@angular/common/http';
import { computed } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { click, fill, text } from '../../../testing/dom';
import { AccountApi } from '../../core/api/library-api';
import { AuthService } from '../../core/auth/auth.service';
import { Notifier } from '../../core/notifications/notifier';
import { ConfirmEmailPage, ForgotPasswordPage, ResetPasswordPage } from './account-recovery';

describe('account recovery pages', () => {
  const accountApi = {
    forgotPassword: vi.fn().mockReturnValue(of(undefined)),
    resetPassword: vi.fn().mockReturnValue(of(undefined)),
    confirmEmail: vi.fn(),
  };
  const notifier = { success: vi.fn(), error: vi.fn() };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: AccountApi, useValue: accountApi },
        { provide: Notifier, useValue: notifier },
        { provide: AuthService, useValue: { isAuthenticated: computed(() => false) } },
      ],
    });
  });

  it('sends the reset link and always confirms it was sent', async () => {
    const fixture = TestBed.createComponent(ForgotPasswordPage);
    await fixture.whenStable();

    fill(fixture, 'input[type=email]', 'ana@email.com');
    click(fixture, 'button[type=submit]');
    await fixture.whenStable();

    expect(accountApi.forgotPassword).toHaveBeenCalledWith('ana@email.com');
    expect(text(fixture)).toContain('If an account exists for that email');
  });

  it('saves the new password with the token from the email', async () => {
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    const fixture = TestBed.createComponent(ResetPasswordPage);
    fixture.componentRef.setInput('token', 'token-1');
    await fixture.whenStable();

    fill(fixture, 'input[type=password]', 'new-secret');
    click(fixture, 'button[type=submit]');

    expect(accountApi.resetPassword).toHaveBeenCalledWith('token-1', 'new-secret');
    expect(navigate).toHaveBeenCalledWith(['/login']);
  });

  it('explains a missing reset token', async () => {
    const fixture = TestBed.createComponent(ResetPasswordPage);
    await fixture.whenStable();

    expect(text(fixture)).toContain('This link is invalid or has expired.');
  });

  it('confirms the email address', async () => {
    accountApi.confirmEmail.mockReturnValue(of(undefined));
    const fixture = TestBed.createComponent(ConfirmEmailPage);
    fixture.componentRef.setInput('token', 'token-2');
    await fixture.whenStable();

    expect(accountApi.confirmEmail).toHaveBeenCalledWith('token-2');
    expect(text(fixture)).toContain('Email confirmed');
  });

  it('explains why the email could not be confirmed', async () => {
    accountApi.confirmEmail.mockReturnValue(
      throwError(
        () =>
          new HttpErrorResponse({
            status: 422,
            error: { detail: 'This link is invalid or has expired.' },
          }),
      ),
    );
    const fixture = TestBed.createComponent(ConfirmEmailPage);
    fixture.componentRef.setInput('token', 'old');
    await fixture.whenStable();

    expect(text(fixture)).toContain('We could not confirm your email');
    expect(text(fixture)).toContain('This link is invalid or has expired.');
  });
});
