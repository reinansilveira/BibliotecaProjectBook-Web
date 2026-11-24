import { computed, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { text } from '../../testing/dom';
import { AuthService, Session } from '../core/auth/auth.service';
import { Shell } from './shell';

describe('Shell', () => {
  const session = signal<Session | null>(null);

  beforeEach(() => {
    session.set(null);
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        {
          provide: AuthService,
          useValue: {
            session,
            isAdmin: computed(() => session()?.role === 'Admin'),
            logout: vi.fn(),
          },
        },
      ],
    });
  });

  it('offers sign in and sign up to visitors', async () => {
    const fixture = TestBed.createComponent(Shell);
    await fixture.whenStable();

    expect(text(fixture)).toContain('Sign in');
    expect(text(fixture)).toContain('Create account');
  });

  it('shows the initials and the admin link for admins', async () => {
    session.set({
      memberId: 'member-1',
      name: 'Ana Maria Smith',
      role: 'Admin',
      accessToken: 'token',
    });
    const fixture = TestBed.createComponent(Shell);
    await fixture.whenStable();

    expect(text(fixture)).toContain('AM');
    expect(text(fixture)).toContain('Admin');
    expect(text(fixture)).toContain('My loans');
  });

  it('searches the catalog from the header', async () => {
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    const fixture = TestBed.createComponent(Shell);
    await fixture.whenStable();
    const element = fixture.nativeElement as HTMLElement;
    const input = element.querySelector<HTMLInputElement>('input[name=search]')!;

    input.value = '  tolkien ';
    element.querySelector('form')!.dispatchEvent(new Event('submit'));

    expect(navigate).toHaveBeenCalledWith(['/books'], { queryParams: { search: 'tolkien' } });
  });
});
