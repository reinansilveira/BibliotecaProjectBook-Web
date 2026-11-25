import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_URL } from './api-url';
import { Dashboard, MaintenanceResult, MonthlyOverdue, MostBorrowedBook } from './models';
import { toQueryParams } from './query-params';

export type ReportExport = 'loans' | 'most-borrowed-books' | 'overdue-by-month';

@Injectable({ providedIn: 'root' })
export class ReportsApi {
  private readonly http = inject(HttpClient);

  dashboard(): Observable<Dashboard> {
    return this.http.get<Dashboard>(`${API_URL}/reports/dashboard`);
  }

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

  export(report: ReportExport, filters: Record<string, string | number | null>): Observable<Blob> {
    return this.http.get(`${API_URL}/reports/${report}/export`, {
      params: toQueryParams(filters),
      responseType: 'blob',
    });
  }

  runMaintenance(): Observable<MaintenanceResult> {
    return this.http.post<MaintenanceResult>(`${API_URL}/maintenance/run`, null);
  }
}
