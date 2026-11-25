import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_URL } from './api-url';
import {
  AppNotification,
  AuditEntry,
  AuditQuery,
  BookFormat,
  Fine,
  FineStatus,
  PagedResult,
  Reservation,
  Review,
  ReviewRequest,
} from './models';
import { toQueryParams } from './query-params';

@Injectable({ providedIn: 'root' })
export class ReservationsApi {
  private readonly http = inject(HttpClient);

  create(bookId: string, memberId: string, format: BookFormat): Observable<Reservation> {
    return this.http.post<Reservation>(`${API_URL}/reservations`, { bookId, memberId, format });
  }

  cancel(id: string): Observable<void> {
    return this.http.delete<void>(`${API_URL}/reservations/${id}`);
  }
}

@Injectable({ providedIn: 'root' })
export class ReviewsApi {
  private readonly http = inject(HttpClient);

  list(bookId: string, page: number, pageSize: number): Observable<PagedResult<Review>> {
    return this.http.get<PagedResult<Review>>(`${API_URL}/books/${bookId}/reviews`, {
      params: toQueryParams({ page, pageSize }),
    });
  }

  mine(bookId: string): Observable<Review | null> {
    return this.http.get<Review | null>(`${API_URL}/books/${bookId}/reviews/mine`);
  }

  save(bookId: string, review: ReviewRequest): Observable<Review> {
    return this.http.put<Review>(`${API_URL}/books/${bookId}/reviews/mine`, review);
  }

  delete(bookId: string): Observable<void> {
    return this.http.delete<void>(`${API_URL}/books/${bookId}/reviews/mine`);
  }
}

@Injectable({ providedIn: 'root' })
export class FinesApi {
  private readonly http = inject(HttpClient);

  list(status: FineStatus | null, page: number, pageSize: number): Observable<PagedResult<Fine>> {
    return this.http.get<PagedResult<Fine>>(`${API_URL}/fines`, {
      params: toQueryParams({ status, page, pageSize }),
    });
  }

  pay(id: string): Observable<Fine> {
    return this.http.post<Fine>(`${API_URL}/fines/${id}/pay`, null);
  }

  waive(id: string): Observable<Fine> {
    return this.http.post<Fine>(`${API_URL}/fines/${id}/waive`, null);
  }
}

@Injectable({ providedIn: 'root' })
export class NotificationsApi {
  private readonly http = inject(HttpClient);

  list(
    unreadOnly: boolean,
    page: number,
    pageSize: number,
  ): Observable<PagedResult<AppNotification>> {
    return this.http.get<PagedResult<AppNotification>>(`${API_URL}/notifications`, {
      params: toQueryParams({ unreadOnly: unreadOnly || null, page, pageSize }),
    });
  }

  unreadCount(): Observable<{ unread: number }> {
    return this.http.get<{ unread: number }>(`${API_URL}/notifications/unread-count`);
  }

  markRead(id: string): Observable<void> {
    return this.http.post<void>(`${API_URL}/notifications/${id}/read`, null);
  }

  markAllRead(): Observable<void> {
    return this.http.post<void>(`${API_URL}/notifications/read-all`, null);
  }
}

@Injectable({ providedIn: 'root' })
export class AuditApi {
  private readonly http = inject(HttpClient);

  list(query: AuditQuery): Observable<PagedResult<AuditEntry>> {
    return this.http.get<PagedResult<AuditEntry>>(`${API_URL}/audit`, {
      params: toQueryParams({ ...query }),
    });
  }
}

@Injectable({ providedIn: 'root' })
export class AccountApi {
  private readonly http = inject(HttpClient);

  forgotPassword(email: string): Observable<void> {
    return this.http.post<void>(`${API_URL}/auth/forgot-password`, { email });
  }

  resetPassword(token: string, newPassword: string): Observable<void> {
    return this.http.post<void>(`${API_URL}/auth/reset-password`, { token, newPassword });
  }

  confirmEmail(token: string): Observable<void> {
    return this.http.post<void>(`${API_URL}/auth/confirm-email`, { token });
  }

  resendConfirmation(): Observable<void> {
    return this.http.post<void>(`${API_URL}/auth/resend-confirmation`, null);
  }

  changePassword(currentPassword: string, newPassword: string): Observable<void> {
    return this.http.post<void>(`${API_URL}/auth/change-password`, {
      currentPassword,
      newPassword,
    });
  }
}
