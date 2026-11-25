import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_URL } from './api-url';
import {
  Book,
  Fine,
  FineStatus,
  Loan,
  Member,
  PagedResult,
  PageQuery,
  ReadingStats,
  Reservation,
  Standing,
  UpdateMemberRequest,
} from './models';
import { toQueryParams } from './query-params';

@Injectable({ providedIn: 'root' })
export class MembersApi {
  private readonly http = inject(HttpClient);

  me(): Observable<Member> {
    return this.http.get<Member>(`${API_URL}/auth/me`);
  }

  list(query: PageQuery): Observable<PagedResult<Member>> {
    return this.http.get<PagedResult<Member>>(`${API_URL}/members`, {
      params: toQueryParams({ ...query }),
    });
  }

  update(id: string, member: UpdateMemberRequest): Observable<Member> {
    return this.http.put<Member>(`${API_URL}/members/${id}`, member);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${API_URL}/members/${id}`);
  }

  loans(memberId: string, page: number, pageSize: number): Observable<PagedResult<Loan>> {
    return this.http.get<PagedResult<Loan>>(`${API_URL}/members/${memberId}/loans`, {
      params: toQueryParams({ page, pageSize }),
    });
  }

  reservations(memberId: string, openOnly = false): Observable<PagedResult<Reservation>> {
    return this.http.get<PagedResult<Reservation>>(`${API_URL}/members/${memberId}/reservations`, {
      params: toQueryParams({ openOnly: openOnly || null, page: 1, pageSize: 50 }),
    });
  }

  fines(memberId: string, status?: FineStatus): Observable<PagedResult<Fine>> {
    return this.http.get<PagedResult<Fine>>(`${API_URL}/members/${memberId}/fines`, {
      params: toQueryParams({ status, page: 1, pageSize: 50 }),
    });
  }

  standing(memberId: string): Observable<Standing> {
    return this.http.get<Standing>(`${API_URL}/members/${memberId}/standing`);
  }

  readingStats(memberId: string): Observable<ReadingStats> {
    return this.http.get<ReadingStats>(`${API_URL}/members/${memberId}/reading-stats`);
  }

  wishlist(memberId: string): Observable<Book[]> {
    return this.http.get<Book[]>(`${API_URL}/members/${memberId}/wishlist`);
  }

  addToWishlist(memberId: string, bookId: string): Observable<void> {
    return this.http.put<void>(`${API_URL}/members/${memberId}/wishlist/${bookId}`, null);
  }

  removeFromWishlist(memberId: string, bookId: string): Observable<void> {
    return this.http.delete<void>(`${API_URL}/members/${memberId}/wishlist/${bookId}`);
  }
}
