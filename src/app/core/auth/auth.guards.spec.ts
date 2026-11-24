import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import {
  ActivatedRouteSnapshot,
  provideRouter,
  RouterStateSnapshot,
  UrlTree,
} from '@angular/router';
import { adminGuard, authGuard, guestGuard } from './auth.guards';
import { AuthService } from './auth.service';

describe('auth guards', () => {
  const authenticated = signal(false);
  const admin = signal(false);
  const route = {} as ActivatedRouteSnapshot;
  const state = { url: '/my-loans' } as RouterStateSnapshot;

  beforeEach(() => {
    authenticated.set(false);
    admin.set(false);
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: { isAuthenticated: authenticated, isAdmin: admin } },
      ],
    });
  });

  const run = (guard: typeof authGuard) => TestBed.runInInjectionContext(() => guard(route, state));

  it('sends anonymous visitors to the login page with a return url', () => {
    const result = run(authGuard) as UrlTree;

    expect(result.toString()).toBe('/login?returnUrl=%2Fmy-loans');
  });

  it('lets signed-in members through', () => {
    authenticated.set(true);

    expect(run(authGuard)).toBe(true);
  });

  it('keeps members out of the admin area', () => {
    authenticated.set(true);

    expect((run(adminGuard) as UrlTree).toString()).toBe('/books');
  });

  it('lets admins into the admin area', () => {
    authenticated.set(true);
    admin.set(true);

    expect(run(adminGuard)).toBe(true);
  });

  it('sends signed-in members away from the login page', () => {
    authenticated.set(true);

    expect((run(guestGuard) as UrlTree).toString()).toBe('/books');
  });
});
