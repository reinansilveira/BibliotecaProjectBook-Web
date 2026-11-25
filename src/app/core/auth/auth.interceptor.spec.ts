import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { TokenResponse } from '../api/models';
import { authInterceptor } from './auth.interceptor';
import { AuthService } from './auth.service';

const session = (accessToken: string, refreshToken: string): TokenResponse => ({
  accessToken,
  accessTokenExpiresAt: '2026-01-01T00:15:00Z',
  refreshToken,
  refreshTokenExpiresAt: '2026-01-08T00:00:00Z',
  memberId: 'member-1',
  name: 'Ana Smith',
  role: 'Member',
});

describe('authInterceptor', () => {
  let client: HttpClient;
  let http: HttpTestingController;
  let auth: AuthService;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
        provideRouter([]),
      ],
    });

    client = TestBed.inject(HttpClient);
    http = TestBed.inject(HttpTestingController);
    auth = TestBed.inject(AuthService);
    vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
  });

  afterEach(() => http.verify());

  function signIn(): void {
    auth.login({ email: 'ana@email.com', password: 'secret' }).subscribe();
    http.expectOne('/api/v1/auth/login').flush(session('access-1', 'refresh-1'));
  }

  it('sends the access token as a bearer header', () => {
    signIn();

    client.get('/api/v1/auth/me').subscribe();

    expect(http.expectOne('/api/v1/auth/me').request.headers.get('Authorization')).toBe(
      'Bearer access-1',
    );
  });

  it('does not send a token to public authentication endpoints', () => {
    signIn();

    client.post('/api/v1/auth/refresh', {}).subscribe();

    expect(http.expectOne('/api/v1/auth/refresh').request.headers.has('Authorization')).toBe(false);
  });

  it('refreshes the session and retries the request after a 401', () => {
    signIn();
    let body: unknown;

    client.get('/api/v1/auth/me').subscribe((response) => (body = response));
    http.expectOne('/api/v1/auth/me').flush(null, { status: 401, statusText: 'Unauthorized' });
    http.expectOne('/api/v1/auth/refresh').flush(session('access-2', 'refresh-2'));

    const retry = http.expectOne('/api/v1/auth/me');
    expect(retry.request.headers.get('Authorization')).toBe('Bearer access-2');
    retry.flush({ name: 'Ana Smith' });

    expect(body).toEqual({ name: 'Ana Smith' });
  });

  it('ends the session when the refresh also fails', () => {
    signIn();
    let failed = false;

    client.get('/api/v1/auth/me').subscribe({ error: () => (failed = true) });
    http.expectOne('/api/v1/auth/me').flush(null, { status: 401, statusText: 'Unauthorized' });
    http.expectOne('/api/v1/auth/refresh').flush(null, { status: 401, statusText: 'Unauthorized' });

    expect(failed).toBe(true);
    expect(auth.isAuthenticated()).toBe(false);
  });

  it('does not try to refresh for anonymous visitors', () => {
    let status = 0;

    client
      .get('/api/v1/members')
      .subscribe({ error: (error: { status: number }) => (status = error.status) });
    http.expectOne('/api/v1/members').flush(null, { status: 401, statusText: 'Unauthorized' });

    expect(status).toBe(401);
    http.expectNone('/api/v1/auth/refresh');
  });
});
