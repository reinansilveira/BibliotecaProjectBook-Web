import { HttpErrorResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { click, fill, text } from '../../../testing/dom';
import { AuthService } from '../../core/auth/auth.service';
import { Notifier } from '../../core/notifications/notifier';
import { LoginPage } from './login-page';

describe('LoginPage', () => {
  const login = vi.fn();
  const notifier = { error: vi.fn(), success: vi.fn() };

  beforeEach(() => {
    login.mockReset();
    notifier.error.mockReset();
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: { login } },
        { provide: Notifier, useValue: notifier },
      ],
    });
  });

  async function render(inputs: Record<string, string> = {}) {
    const fixture = TestBed.createComponent(LoginPage);
    Object.entries(inputs).forEach(([name, value]) => fixture.componentRef.setInput(name, value));
    await fixture.whenStable();

    return fixture;
  }

  it('does not submit an empty form', async () => {
    const fixture = await render();

    click(fixture, 'button[type=submit]');

    expect(login).not.toHaveBeenCalled();
  });

  it('signs in and goes back to the requested page', async () => {
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(true);
    login.mockReturnValue(of({}));
    const fixture = await render({ returnUrl: '/my-loans' });

    fill(fixture, 'input[type=email]', 'ana@email.com');
    fill(fixture, 'input[type=password]', 'secret');
    click(fixture, 'button[type=submit]');

    expect(login).toHaveBeenCalledWith({ email: 'ana@email.com', password: 'secret' });
    expect(navigate).toHaveBeenCalledWith('/my-loans');
  });

  it('shows the error when the credentials are wrong', async () => {
    const error = new HttpErrorResponse({ status: 401 });
    login.mockReturnValue(throwError(() => error));
    const fixture = await render();

    fill(fixture, 'input[type=email]', 'ana@email.com');
    fill(fixture, 'input[type=password]', 'wrong');
    click(fixture, 'button[type=submit]');

    expect(notifier.error).toHaveBeenCalledWith(error);
  });

  it('tells the user when the session expired', async () => {
    const fixture = await render({ expired: 'true' });

    expect(text(fixture)).toContain('Your session expired');
  });
});
