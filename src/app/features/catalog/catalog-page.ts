import { DOCUMENT } from '@angular/common';
import { Component, computed, inject, input } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { Router, RouterLink } from '@angular/router';
import { switchMap } from 'rxjs';
import { BooksApi } from '../../core/api/books-api';
import { PageQuery } from '../../core/api/models';
import { AuthService } from '../../core/auth/auth.service';
import { toLoadState } from '../../core/http/load-state';
import { BookCover } from '../../shared/book-cover';
import { EmptyState } from '../../shared/empty-state';
import { BookCard } from './book-card';

const PAGE_SIZE = 12;
const FEATURED_COUNT = 5;

export function fanPosition(index: number, count: number): { offset: number; distance: number } {
  const offset = index - (count - 1) / 2;

  return { offset, distance: Math.abs(offset) };
}

@Component({
  selector: 'app-catalog-page',
  imports: [
    BookCard,
    BookCover,
    EmptyState,
    MatPaginatorModule,
    MatButtonModule,
    MatIconModule,
    RouterLink,
  ],
  templateUrl: './catalog-page.html',
  styleUrl: './catalog-page.scss',
})
export class CatalogPage {
  private readonly booksApi = inject(BooksApi);
  private readonly router = inject(Router);
  private readonly document = inject(DOCUMENT);
  protected readonly auth = inject(AuthService);

  readonly search = input<string>();
  readonly page = input<string>();

  protected readonly pageSize = PAGE_SIZE;
  protected readonly skeletons = Array.from({ length: PAGE_SIZE }, (_, index) => index);
  protected readonly fanPlaceholders = Array.from({ length: FEATURED_COUNT }, (_, index) =>
    fanPosition(index, FEATURED_COUNT),
  );

  protected readonly query = computed<PageQuery>(() => ({
    page: Math.max(Number(this.page()) || 1, 1),
    pageSize: PAGE_SIZE,
    search: this.search()?.trim() || undefined,
  }));

  protected readonly state = toSignal(
    toObservable(this.query).pipe(switchMap((query) => toLoadState(this.booksApi.list(query)))),
    { initialValue: { status: 'loading' as const } },
  );

  protected readonly totalBooks = computed(() => {
    const current = this.state();

    return current.status === 'loaded' ? current.value.totalItems : null;
  });

  protected readonly featured = computed(() => {
    const current = this.state();

    if (current.status !== 'loaded') {
      return [];
    }

    const books = current.value.items.slice(0, FEATURED_COUNT);

    return books.map((book, index) => ({ book, ...fanPosition(index, books.length) }));
  });

  protected changePage(event: PageEvent): void {
    void this.router.navigate([], {
      queryParams: { page: event.pageIndex + 1 },
      queryParamsHandling: 'merge',
    });
  }

  protected scrollToCatalog(event: Event): void {
    event.preventDefault();
    this.document.getElementById('catalog')?.scrollIntoView({ behavior: 'smooth' });
  }
}
