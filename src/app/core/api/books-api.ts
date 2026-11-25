import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable, shareReplay, tap } from 'rxjs';
import { API_URL } from './api-url';
import {
  Book,
  BookCopy,
  BookMetadata,
  BookQuery,
  BookRequest,
  BookSuggestion,
  CreateBookRequest,
  Genre,
  ImportBookRequest,
  PagedResult,
  Reservation,
} from './models';
import { toQueryParams } from './query-params';

@Injectable({ providedIn: 'root' })
export class BooksApi {
  private readonly http = inject(HttpClient);
  private readonly cache = new Map<string, Observable<Book>>();

  list(query: BookQuery): Observable<PagedResult<Book>> {
    return this.http.get<PagedResult<Book>>(`${API_URL}/books`, {
      params: toQueryParams({ ...query }),
    });
  }

  suggestions(query: string): Observable<BookSuggestion[]> {
    return this.http.get<BookSuggestion[]>(`${API_URL}/books/suggestions`, {
      params: toQueryParams({ query }),
    });
  }

  genres(): Observable<Genre[]> {
    return this.http.get<Genre[]>(`${API_URL}/books/genres`);
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

  refresh(id: string): Observable<Book> {
    this.cache.delete(id);

    return this.get(id);
  }

  alsoRead(id: string): Observable<Book[]> {
    return this.http.get<Book[]>(`${API_URL}/books/${id}/also-read`);
  }

  create(book: CreateBookRequest): Observable<Book> {
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

  lookup(isbn: string): Observable<BookMetadata> {
    return this.http.get<BookMetadata>(`${API_URL}/books/lookup`, {
      params: toQueryParams({ isbn }),
    });
  }

  import(request: ImportBookRequest): Observable<Book> {
    return this.http.post<Book>(`${API_URL}/books/import`, request);
  }

  copies(id: string): Observable<BookCopy[]> {
    return this.http.get<BookCopy[]>(`${API_URL}/books/${id}/copies`);
  }

  addCopies(id: string, quantity: number): Observable<BookCopy[]> {
    return this.http
      .post<BookCopy[]>(`${API_URL}/books/${id}/copies`, { quantity })
      .pipe(tap(() => this.cache.delete(id)));
  }

  withdrawCopy(id: string, copyId: string): Observable<void> {
    return this.http
      .delete<void>(`${API_URL}/books/${id}/copies/${copyId}`)
      .pipe(tap(() => this.cache.delete(id)));
  }

  uploadEbook(id: string, file: File, licenses: number): Observable<Book> {
    const form = new FormData();
    form.append('File', file);
    form.append('Licenses', String(licenses));

    return this.http
      .post<Book>(`${API_URL}/books/${id}/ebook`, form)
      .pipe(tap(() => this.cache.delete(id)));
  }

  importGutenberg(id: string, gutenbergId: number, licenses: number): Observable<Book> {
    return this.http
      .post<Book>(`${API_URL}/books/${id}/ebook/gutenberg`, { gutenbergId, licenses })
      .pipe(tap(() => this.cache.delete(id)));
  }

  setLicenses(id: string, licenses: number): Observable<Book> {
    return this.http
      .put<Book>(`${API_URL}/books/${id}/ebook/licenses`, { licenses })
      .pipe(tap(() => this.cache.delete(id)));
  }

  waitingList(id: string): Observable<Reservation[]> {
    return this.http.get<Reservation[]>(`${API_URL}/books/${id}/reservations`);
  }
}
