import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_URL } from './api-url';
import { Loan, Member, PagedResult, PageQuery, UpdateMemberRequest } from './models';
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
}
