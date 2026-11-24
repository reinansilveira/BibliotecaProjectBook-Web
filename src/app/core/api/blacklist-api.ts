import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_URL } from './api-url';
import { BlacklistEntry, PagedResult } from './models';
import { toQueryParams } from './query-params';

@Injectable({ providedIn: 'root' })
export class BlacklistApi {
  private readonly http = inject(HttpClient);

  list(page: number, pageSize: number): Observable<PagedResult<BlacklistEntry>> {
    return this.http.get<PagedResult<BlacklistEntry>>(`${API_URL}/blacklist`, {
      params: toQueryParams({ page, pageSize }),
    });
  }

  refresh(): Observable<number> {
    return this.http.post<number>(`${API_URL}/blacklist/refresh`, null);
  }

  remove(memberId: string): Observable<void> {
    return this.http.delete<void>(`${API_URL}/blacklist/${memberId}`);
  }
}
