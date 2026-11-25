import { HttpErrorResponse, HttpInterceptorFn, HttpRequest } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, switchMap, throwError } from 'rxjs';
import { AuthService } from './auth.service';

const PUBLIC_AUTH_ENDPOINTS = [
  '/auth/login',
  '/auth/register',
  '/auth/refresh',
  '/auth/logout',
  '/auth/forgot-password',
  '/auth/reset-password',
  '/auth/confirm-email',
];

export const authInterceptor: HttpInterceptorFn = (request, next) => {
  const auth = inject(AuthService);

  if (isPublicAuthEndpoint(request)) {
    return next(request);
  }

  return next(withAccessToken(request, auth.accessToken())).pipe(
    catchError((error: unknown) => {
      if (!isUnauthorized(error) || !auth.isAuthenticated()) {
        return throwError(() => error);
      }

      return auth.refresh().pipe(
        catchError((refreshError: unknown) => {
          auth.expireSession();

          return throwError(() => refreshError);
        }),
        switchMap((session) => next(withAccessToken(request, session.accessToken))),
      );
    }),
  );
};

function isPublicAuthEndpoint(request: HttpRequest<unknown>): boolean {
  return PUBLIC_AUTH_ENDPOINTS.some((endpoint) => request.url.endsWith(endpoint));
}

function isUnauthorized(error: unknown): boolean {
  return error instanceof HttpErrorResponse && error.status === 401;
}

function withAccessToken(request: HttpRequest<unknown>, accessToken: string | null) {
  if (!accessToken) {
    return request;
  }

  return request.clone({ setHeaders: { Authorization: `Bearer ${accessToken}` } });
}
