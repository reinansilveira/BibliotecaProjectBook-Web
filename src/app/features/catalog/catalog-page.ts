import { DOCUMENT } from '@angular/common';
import { Component, computed, inject, input } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { Params, Router, RouterLink } from '@angular/router';
import { catchError, of, switchMap } from 'rxjs';
import { BooksApi } from '../../core/api/books-api';
import { BookFormat, BookQuery, BookSort, Genre } from '../../core/api/models';
import { AuthService } from '../../core/auth/auth.service';
import { I18n } from '../../core/i18n/i18n.service';
import { provideLocalizedPaginator } from '../../core/i18n/paginator-intl';
import { TranslatePipe } from '../../core/i18n/pipes';
import { toLoadState } from '../../core/http/load-state';
import { BookCover } from '../../shared/book-cover';
import { EmptyState } from '../../shared/empty-state';
import { BookCard } from './book-card';

const PAGE_SIZE = 12;
const FEATURED_COUNT = 5;
const SORTS: { value: BookSort; label: string }[] = [
  { value: 'Title', label: 'Title (A–Z)' },
  { value: 'Newest', label: 'Newest arrivals' },
  { value: 'Rating', label: 'Best rated' },
  { value: 'Popular', label: 'Most popular' },
  { value: 'Year', label: 'Publication year' },
];

export interface CatalogFilters {
  search?: string;
  genre?: string;
  author?: string;
  format?: string;
  available?: string;
  sort?: string;
  yearFrom?: string;
  yearTo?: string;
  page?: string;
}

export function fanPosition(index: number, count: number): { offset: number; distance: number } {
  const offset = index - (count - 1) / 2;

  return { offset, distance: Math.abs(offset) };
}

function year(value: string | undefined): number | undefined {
  const parsed = Number(value);

  return Number.isInteger(parsed) && parsed > 0 ? parsed : undefined;
}

export function toBookQuery(filters: CatalogFilters): BookQuery {
  const format =
    filters.format === 'Print' || filters.format === 'Ebook' ? filters.format : undefined;
  const sort = SORTS.find((option) => option.value === filters.sort)?.value;

  return {
    page: Math.max(Number(filters.page) || 1, 1),
    pageSize: PAGE_SIZE,
    search: filters.search?.trim() || undefined,
    genre: filters.genre || undefined,
    author: filters.author || undefined,
    format: format as BookFormat | undefined,
    availableOnly: filters.available === 'true' || undefined,
    sort,
    yearFrom: year(filters.yearFrom),
    yearTo: year(filters.yearTo),
  };
}

export function isFiltered(query: BookQuery): boolean {
  return [
    query.search,
    query.genre,
    query.author,
    query.format,
    query.availableOnly,
    query.yearFrom,
    query.yearTo,
  ].some((value) => value !== undefined);
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
    MatSelectModule,
    MatSlideToggleModule,
    RouterLink,
    TranslatePipe,
  ],
  providers: [provideLocalizedPaginator()],
  templateUrl: './catalog-page.html',
  styleUrl: './catalog-page.scss',
})
export class CatalogPage {
  private readonly booksApi = inject(BooksApi);
  private readonly router = inject(Router);
  private readonly document = inject(DOCUMENT);
  protected readonly auth = inject(AuthService);
  protected readonly i18n = inject(I18n);

  readonly search = input<string>();
  readonly page = input<string>();
  readonly genre = input<string>();
  readonly author = input<string>();
  readonly format = input<string>();
  readonly available = input<string>();
  readonly sort = input<string>();
  readonly yearFrom = input<string>();
  readonly yearTo = input<string>();

  protected readonly pageSize = PAGE_SIZE;
  protected readonly sorts = SORTS;
  protected readonly skeletons = Array.from({ length: PAGE_SIZE }, (_, index) => index);
  protected readonly fanPlaceholders = Array.from({ length: FEATURED_COUNT }, (_, index) =>
    fanPosition(index, FEATURED_COUNT),
  );

  protected readonly query = computed(() =>
    toBookQuery({
      search: this.search(),
      page: this.page(),
      genre: this.genre(),
      author: this.author(),
      format: this.format(),
      available: this.available(),
      sort: this.sort(),
      yearFrom: this.yearFrom(),
      yearTo: this.yearTo(),
    }),
  );

  protected readonly filtered = computed(() => isFiltered(this.query()));

  protected readonly state = toSignal(
    toObservable(this.query).pipe(switchMap((query) => toLoadState(this.booksApi.list(query)))),
    { initialValue: { status: 'loading' as const } },
  );

  protected readonly genres = toSignal(
    this.booksApi.genres().pipe(catchError(() => of<Genre[]>([]))),
    { initialValue: [] as Genre[] },
  );

  protected readonly totalBooks = computed(() =>
    this.genres().reduce((total, genre) => total + genre.books, 0),
  );

  protected readonly featured = computed(() => {
    const current = this.state();

    if (current.status !== 'loaded') {
      return [];
    }

    const books = current.value.items.slice(0, FEATURED_COUNT);

    return books.map((book, index) => ({ book, ...fanPosition(index, books.length) }));
  });

  protected changePage(event: PageEvent): void {
    this.applyFilters({ page: event.pageIndex + 1 }, false);
    this.document.getElementById('catalog')?.scrollIntoView({ behavior: 'smooth' });
  }

  protected applyFilters(params: Params, resetPage = true): void {
    void this.router.navigate(['/books'], {
      queryParams: resetPage ? { ...params, page: null } : params,
      queryParamsHandling: 'merge',
    });
  }

  protected setYear(field: 'yearFrom' | 'yearTo', value: string): void {
    this.applyFilters({ [field]: year(value) ?? null });
  }

  protected scrollToCatalog(event: Event): void {
    event.preventDefault();
    this.document.getElementById('catalog')?.scrollIntoView({ behavior: 'smooth' });
  }
}
