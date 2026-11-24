import { HttpBackend, HttpClient } from '@angular/common/http';
import { inject, Injectable, InjectionToken } from '@angular/core';
import { catchError, map, Observable, of, shareReplay, tap } from 'rxjs';

export type CoverSize = 'S' | 'M' | 'L';

interface SearchResponse {
  docs: { cover_i?: number }[];
}

const SEARCH_URL = 'https://openlibrary.org/search.json';
const STORAGE_KEY = 'library.covers';

export const COVER_LOOKUP_ENABLED = new InjectionToken<boolean>('COVER_LOOKUP_ENABLED', {
  factory: () => false,
});

export function coverUrl(coverId: number, size: CoverSize): string {
  return `https://covers.openlibrary.org/b/id/${coverId}-${size}.jpg`;
}

@Injectable({ providedIn: 'root' })
export class CoverService {
  private readonly enabled = inject(COVER_LOOKUP_ENABLED);
  private readonly http = new HttpClient(inject(HttpBackend));
  private readonly requests = new Map<string, Observable<number | null>>();
  private readonly stored = readStored();

  coverId(title: string, author: string): Observable<number | null> {
    const key = `${title}|${author}`.trim().toLowerCase();

    if (!this.enabled) {
      return of(null);
    }

    if (key in this.stored) {
      return of(this.stored[key]);
    }

    const cached = this.requests.get(key);

    if (cached) {
      return cached;
    }

    const request = this.http
      .get<SearchResponse>(SEARCH_URL, {
        params: { title, author, limit: 5, fields: 'cover_i' },
      })
      .pipe(
        map((response) => response.docs.find((doc) => doc.cover_i)?.cover_i ?? null),
        tap((coverId) => this.remember(key, coverId)),
        catchError(() => of(null)),
        shareReplay(1),
      );
    this.requests.set(key, request);

    return request;
  }

  private remember(key: string, coverId: number | null): void {
    this.stored[key] = coverId;

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.stored));
    } catch {
      return;
    }
  }
}

function readStored(): Record<string, number | null> {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}') as Record<string, number | null>;
  } catch {
    return {};
  }
}
