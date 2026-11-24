import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { of } from 'rxjs';
import { click, fill } from '../../../testing/dom';
import { AuthService } from '../../core/auth/auth.service';
import { Notifier } from '../../core/notifications/notifier';
import { RegisterPage } from './register-page';

describe('RegisterPage', () => {
  it('creates the account, signs in and welcomes the member', async () => {
    const auth = {
      register: vi.fn().mockReturnValue(of({})),
      login: vi.fn().mockReturnValue(of({ name: 'Ana Smith' })),
    };
    const notifier = { success: vi.fn(), error: vi.fn() };
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: auth },
        { provide: Notifier, useValue: notifier },
      ],
    });
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    const fixture = TestBed.createComponent(RegisterPage);
    await fixture.whenStable();

    fill(fixture, 'input[formControlName=name]', 'Ana Smith');
    fill(fixture, 'input[formControlName=email]', 'ana@email.com');
    fill(fixture, 'input[formControlName=phone]', '555-0100');
    fill(fixture, 'input[formControlName=birthDate]', '1995-05-10');
    fill(fixture, 'input[formControlName=password]', 'Password@123');
    click(fixture, 'button[type=submit]');

    expect(auth.register).toHaveBeenCalledWith(expect.objectContaining({ email: 'ana@email.com' }));
    expect(auth.login).toHaveBeenCalledWith({ email: 'ana@email.com', password: 'Password@123' });
    expect(notifier.success).toHaveBeenCalledWith('Welcome, Ana Smith! Your account is ready.');
    expect(navigate).toHaveBeenCalledWith(['/books']);
  });
});
