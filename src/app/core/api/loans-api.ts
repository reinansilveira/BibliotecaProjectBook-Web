import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_URL } from './api-url';
import { Loan } from './models';

@Injectable({ providedIn: 'root' })
export class LoansApi {
  private readonly http = inject(HttpClient);

  borrow(bookId: string, memberId: string): Observable<Loan> {
    return this.http.post<Loan>(`${API_URL}/loans`, { bookId, memberId });
  }

  return(loanId: string): Observable<Loan> {
    return this.http.post<Loan>(`${API_URL}/loans/${loanId}/return`, null);
  }
}
