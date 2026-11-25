import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_URL } from './api-url';
import { BookFormat, Loan, ReadingLink } from './models';

@Injectable({ providedIn: 'root' })
export class LoansApi {
  private readonly http = inject(HttpClient);

  get(id: string): Observable<Loan> {
    return this.http.get<Loan>(`${API_URL}/loans/${id}`);
  }

  borrow(bookId: string, memberId: string, format: BookFormat): Observable<Loan> {
    return this.http.post<Loan>(`${API_URL}/loans`, { bookId, memberId, format });
  }

  return(loanId: string): Observable<Loan> {
    return this.http.post<Loan>(`${API_URL}/loans/${loanId}/return`, null);
  }

  renew(loanId: string): Observable<Loan> {
    return this.http.post<Loan>(`${API_URL}/loans/${loanId}/renew`, null);
  }

  readingLink(loanId: string): Observable<ReadingLink> {
    return this.http.post<ReadingLink>(`${API_URL}/loans/${loanId}/reading-link`, null);
  }

  saveProgress(loanId: string, location: string, percentage: number): Observable<Loan> {
    return this.http.put<Loan>(`${API_URL}/loans/${loanId}/progress`, { location, percentage });
  }
}
