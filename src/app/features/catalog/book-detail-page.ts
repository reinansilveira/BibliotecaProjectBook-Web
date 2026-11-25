import { formatDate } from '@angular/common';
import { Component, computed, inject, input, signal } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Router, RouterLink } from '@angular/router';
import { catchError, combineLatest, map, of, switchMap } from 'rxjs';
import { BooksApi } from '../../core/api/books-api';
import { ReservationsApi } from '../../core/api/library-api';
import { LoansApi } from '../../core/api/loans-api';
import { MembersApi } from '../../core/api/members-api';
import { Book, BookFormat, Standing } from '../../core/api/models';
import { AuthService } from '../../core/auth/auth.service';
import { toLoadState } from '../../core/http/load-state';
import { I18n } from '../../core/i18n/i18n.service';
import { LocalDatePipe, TranslatePipe } from '../../core/i18n/pipes';
import { Notifier } from '../../core/notifications/notifier';
import { WishlistStore } from '../../core/wishlist/wishlist-store';
import { BookCover } from '../../shared/book-cover';
import { EmptyState } from '../../shared/empty-state';
import { StarRating } from '../../shared/stars';
import { BookCard } from './book-card';
import { BookReviews } from './book-reviews';

const SHELF_SIZE = 8;

export type FormatAction = 'borrow' | 'reserve' | 'unavailable';

export interface FormatOption {
  format: BookFormat;
  available: number;
  total: number;
  action: FormatAction;
}

export function formatOptions(book: Book): FormatOption[] {
  const options: FormatOption[] = [
    { format: 'Print', available: book.availableCopies, total: book.totalCopies, action: 'borrow' },
  ];

  if (book.hasEbook) {
    options.push({
      format: 'Ebook',
      available: book.availableEbookLicenses,
      total: book.ebookLicenses,
      action: 'borrow',
    });
  }

  return options.map((option) => {
    if (option.available > 0) {
      return option;
    }

    return { ...option, action: option.total > 0 ? 'reserve' : 'unavailable' };
  });
}

@Component({
  selector: 'app-book-detail-page',
  imports: [
    BookCard,
    BookCover,
    BookReviews,
    EmptyState,
    LocalDatePipe,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    RouterLink,
    StarRating,
    TranslatePipe,
  ],
  templateUrl: './book-detail-page.html',
  styleUrl: './book-detail-page.scss',
})
export class BookDetailPage {
  private readonly booksApi = inject(BooksApi);
  private readonly loansApi = inject(LoansApi);
  private readonly reservationsApi = inject(ReservationsApi);
  private readonly membersApi = inject(MembersApi);
  private readonly notifier = inject(Notifier);
  private readonly router = inject(Router);
  protected readonly i18n = inject(I18n);
  protected readonly auth = inject(AuthService);
  protected readonly wishlist = inject(WishlistStore);

  readonly id = input.required<string>();

  protected readonly busy = signal(false);
  protected readonly returnUrl = computed(() => `/books/${this.id()}`);
  private readonly version = signal(0);

  protected readonly state = toSignal(
    combineLatest([toObservable(this.id), toObservable(this.version)]).pipe(
      switchMap(([id, version]) =>
        toLoadState(version === 0 ? this.booksApi.get(id) : this.booksApi.refresh(id)),
      ),
    ),
    { initialValue: { status: 'loading' as const } },
  );

  protected readonly book = computed(() => {
    const current = this.state();

    return current.status === 'loaded' ? current.value : null;
  });

  protected readonly options = computed(() => {
    const book = this.book();

    return book ? formatOptions(book) : [];
  });

  protected readonly standing = toSignal(
    combineLatest([toObservable(this.auth.session), toObservable(this.version)]).pipe(
      switchMap(([session]) => {
        if (!session) {
          return of(null);
        }

        return this.membersApi
          .standing(session.memberId)
          .pipe(catchError(() => of<Standing | null>(null)));
      }),
    ),
    { initialValue: null },
  );

  protected readonly alsoRead = toSignal(
    toObservable(this.id).pipe(
      switchMap((id) => this.booksApi.alsoRead(id).pipe(catchError(() => of<Book[]>([])))),
      map((books) => books.slice(0, SHELF_SIZE)),
    ),
    { initialValue: [] as Book[] },
  );

  protected readonly moreByAuthor = toSignal(
    toObservable(this.book).pipe(
      map((book) => book?.author ?? null),
      switchMap((author) => {
        if (!author) {
          return of<Book[]>([]);
        }

        return this.booksApi.list({ page: 1, pageSize: SHELF_SIZE + 1, author }).pipe(
          map((page) =>
            page.items
              .filter((book) => book.id !== this.id() && book.author === author)
              .slice(0, SHELF_SIZE),
          ),
          catchError(() => of<Book[]>([])),
        );
      }),
    ),
    { initialValue: [] as Book[] },
  );

  protected refreshBook(): void {
    this.version.update((value) => value + 1);
  }

  protected borrow(format: BookFormat): void {
    const session = this.auth.session();

    if (!session) {
      return;
    }

    this.busy.set(true);
    this.loansApi.borrow(this.id(), session.memberId, format).subscribe({
      next: (loan) => {
        this.notifier.success(
          this.i18n.t('Enjoy your book! Please return it by {date}.', {
            date: formatDate(loan.dueDate, 'mediumDate', this.i18n.locale()),
          }),
        );
        void this.router.navigate(format === 'Ebook' ? ['/read', loan.id] : ['/account/loans']);
      },
      error: (error: unknown) => {
        this.busy.set(false);
        this.notifier.error(error);
      },
    });
  }

  protected reserve(format: BookFormat): void {
    const session = this.auth.session();

    if (!session) {
      return;
    }

    this.busy.set(true);
    this.reservationsApi.create(this.id(), session.memberId, format).subscribe({
      next: (reservation) => {
        this.busy.set(false);
        this.notifier.success(
          this.i18n.t('You joined the waiting list. Your position: {position}.', {
            position: reservation.position ?? 1,
          }),
        );
        this.version.update((value) => value + 1);
      },
      error: (error: unknown) => {
        this.busy.set(false);
        this.notifier.error(error);
      },
    });
  }

  protected async toggleWishlist(book: Book): Promise<void> {
    try {
      const added = await this.wishlist.toggle(book);
      this.notifier.success(
        this.i18n.t(added ? 'Saved to your wishlist.' : 'Removed from your wishlist.'),
      );
    } catch (error: unknown) {
      this.notifier.error(error);
    }
  }
}
