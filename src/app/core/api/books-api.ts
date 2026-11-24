import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable, shareReplay, tap } from 'rxjs';
import { API_URL } from './api-url';
import { Book, BookRequest, PagedResult, PageQuery } from './models';
import { toQueryParams } from './query-params';

@Injectable({ providedIn: 'root' })
export class BooksApi {
  private readonly http = inject(HttpClient);
  private readonly cache = new Map<string, Observable<Book>>();

  list(query: PageQuery): Observable<PagedResult<Book>> {
    return this.http.get<PagedResult<Book>>(`${API_URL}/books`, {
      params: toQueryParams({ ...query }),
    });
  }

  get(id: string): Observable<Book> {
    const cached = this.cache.get(id);

    if (cached) {
      return cached;
    }

    const request = this.http.get<Book>(`${API_URL}/books/${id}`).pipe(shareReplay(1));
    this.cache.set(id, request);

    return request;
  }

  create(book: BookRequest): Observable<Book> {
    return this.http.post<Book>(`${API_URL}/books`, book);
  }

  update(id: string, book: BookRequest): Observable<Book> {
    return this.http
      .put<Book>(`${API_URL}/books/${id}`, book)
      .pipe(tap(() => this.cache.delete(id)));
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${API_URL}/books/${id}`).pipe(tap(() => this.cache.delete(id)));
  }
}
