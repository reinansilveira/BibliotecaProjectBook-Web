import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_URL } from './api-url';
import { MonthlyOverdue, MostBorrowedBook } from './models';
import { toQueryParams } from './query-params';

@Injectable({ providedIn: 'root' })
export class ReportsApi {
  private readonly http = inject(HttpClient);

  mostBorrowedBooks(
    from: string | null,
    to: string | null,
    top: number,
  ): Observable<MostBorrowedBook[]> {
    return this.http.get<MostBorrowedBook[]>(`${API_URL}/reports/most-borrowed-books`, {
      params: toQueryParams({ from, to, top }),
    });
  }

  overdueByMonth(year: number): Observable<MonthlyOverdue[]> {
    return this.http.get<MonthlyOverdue[]>(`${API_URL}/reports/overdue-by-month`, {
      params: toQueryParams({ year }),
    });
  }
}
