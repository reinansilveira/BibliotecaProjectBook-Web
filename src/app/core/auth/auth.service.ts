import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { computed, inject, Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { finalize, firstValueFrom, map, Observable, shareReplay, throwError } from 'rxjs';
import { API_URL } from '../api/api-url';
import { LoginRequest, Member, RegisterMemberRequest, Role, TokenResponse } from '../api/models';
import { TokenStorage } from './token-storage';

const TEMPORARY_STATUSES = [0, 429, 502, 503, 504];

function isTemporaryFailure(error: unknown): boolean {
  return error instanceof HttpErrorResponse && TEMPORARY_STATUSES.includes(error.status);
}

export interface Session {
  memberId: string;
  name: string;
  role: Role;
  accessToken: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly storage = inject(TokenStorage);
  private readonly sessionState = signal<Session | null>(null);
  private refreshInFlight: Observable<Session> | null = null;

  readonly session = this.sessionState.asReadonly();
  readonly isAuthenticated = computed(() => this.sessionState() !== null);
  readonly isAdmin = computed(() => this.sessionState()?.role === 'Admin');
  readonly accessToken = computed(() => this.sessionState()?.accessToken ?? null);

  login(request: LoginRequest): Observable<Session> {
    return this.http
      .post<TokenResponse>(`${API_URL}/auth/login`, request)
      .pipe(map((response) => this.startSession(response)));
  }

  register(request: RegisterMemberRequest): Observable<Member> {
    return this.http.post<Member>(`${API_URL}/auth/register`, request);
  }

  refresh(): Observable<Session> {
    if (this.refreshInFlight) {
      return this.refreshInFlight;
    }

    const refreshToken = this.storage.read();

    if (!refreshToken) {
      return throwError(() => new Error('There is no session to refresh.'));
    }

    this.refreshInFlight = this.http
      .post<TokenResponse>(`${API_URL}/auth/refresh`, { refreshToken })
      .pipe(
        map((response) => this.startSession(response)),
        finalize(() => (this.refreshInFlight = null)),
        shareReplay(1),
      );

    return this.refreshInFlight;
  }

  async restoreSession(): Promise<void> {
    if (!this.storage.read()) {
      return;
    }

    try {
      await firstValueFrom(this.refresh());
    } catch (error: unknown) {
      if (isTemporaryFailure(error)) {
        return;
      }

      this.clearSession();
    }
  }

  logout(): void {
    const refreshToken = this.storage.read();

    this.clearSession();
    void this.router.navigate(['/login']);

    if (!refreshToken) {
      return;
    }

    this.http
      .post(`${API_URL}/auth/logout`, { refreshToken })
      .subscribe({ error: () => undefined });
  }

  expireSession(): void {
    this.clearSession();
    void this.router.navigate(['/login'], { queryParams: { expired: true } });
  }

  private startSession(response: TokenResponse): Session {
    this.storage.write(response.refreshToken);

    const session: Session = {
      memberId: response.memberId,
      name: response.name,
      role: response.role,
      accessToken: response.accessToken,
    };

    this.sessionState.set(session);

    return session;
  }

  private clearSession(): void {
    this.storage.clear();
    this.sessionState.set(null);
  }
}
