import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { TokenResponse } from '../api/models';
import { AuthService } from './auth.service';
import { TokenStorage } from './token-storage';

const tokenResponse: TokenResponse = {
  accessToken: 'access-1',
  accessTokenExpiresAt: '2026-01-01T00:15:00Z',
  refreshToken: 'refresh-1',
  refreshTokenExpiresAt: '2026-01-08T00:00:00Z',
  memberId: 'member-1',
  name: 'Ana Smith',
  role: 'Admin',
};

describe('AuthService', () => {
  let service: AuthService;
  let http: HttpTestingController;
  let storage: TokenStorage;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    });

    service = TestBed.inject(AuthService);
    http = TestBed.inject(HttpTestingController);
    storage = TestBed.inject(TokenStorage);
  });

  afterEach(() => http.verify());

  it('starts a session and stores the refresh token after login', () => {
    service.login({ email: 'ana@email.com', password: 'secret' }).subscribe();
    http.expectOne('/api/v1/auth/login').flush(tokenResponse);

    expect(service.isAuthenticated()).toBe(true);
    expect(service.isAdmin()).toBe(true);
    expect(service.accessToken()).toBe('access-1');
    expect(storage.read()).toBe('refresh-1');
  });

  it('shares a single request between concurrent refresh calls', () => {
    storage.write('refresh-1');

    service.refresh().subscribe();
    service.refresh().subscribe();

    const request = http.expectOne('/api/v1/auth/refresh');
    expect(request.request.body).toEqual({ refreshToken: 'refresh-1' });
    request.flush({ ...tokenResponse, accessToken: 'access-2', refreshToken: 'refresh-2' });

    expect(service.accessToken()).toBe('access-2');
    expect(storage.read()).toBe('refresh-2');
  });

  it('fails to refresh when there is no stored session', () => {
    let failed = false;

    service.refresh().subscribe({ error: () => (failed = true) });

    expect(failed).toBe(true);
    http.expectNone('/api/v1/auth/refresh');
  });

  it('clears an invalid stored session when restoring', async () => {
    storage.write('expired-token');

    const restoring = service.restoreSession();
    http.expectOne('/api/v1/auth/refresh').flush(null, { status: 401, statusText: 'Unauthorized' });
    await restoring;

    expect(service.isAuthenticated()).toBe(false);
    expect(storage.read()).toBeNull();
  });

  it('keeps the stored session when the refresh is only throttled', async () => {
    storage.write('valid-token');

    const restoring = service.restoreSession();
    http
      .expectOne('/api/v1/auth/refresh')
      .flush(null, { status: 429, statusText: 'Too Many Requests' });
    await restoring;

    expect(service.isAuthenticated()).toBe(false);
    expect(storage.read()).toBe('valid-token');
  });

  it('revokes the refresh token and leaves on logout', () => {
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    service.login({ email: 'ana@email.com', password: 'secret' }).subscribe();
    http.expectOne('/api/v1/auth/login').flush(tokenResponse);

    service.logout();

    const request = http.expectOne('/api/v1/auth/logout');
    expect(request.request.body).toEqual({ refreshToken: 'refresh-1' });
    request.flush(null);
    expect(service.isAuthenticated()).toBe(false);
    expect(navigate).toHaveBeenCalledWith(['/login']);
  });
});
