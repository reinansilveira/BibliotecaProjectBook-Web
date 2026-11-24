import { DatePipe } from '@angular/common';
import { Component, computed, inject, input, signal } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Router, RouterLink } from '@angular/router';
import { catchError, map, of, switchMap } from 'rxjs';
import { BooksApi } from '../../core/api/books-api';
import { Book } from '../../core/api/models';
import { LoansApi } from '../../core/api/loans-api';
import { AuthService } from '../../core/auth/auth.service';
import { toLoadState } from '../../core/http/load-state';
import { Notifier } from '../../core/notifications/notifier';
import { BookCover } from '../../shared/book-cover';
import { EmptyState } from '../../shared/empty-state';
import { BookCard } from './book-card';

const MORE_BY_AUTHOR = 8;

@Component({
  selector: 'app-book-detail-page',
  imports: [BookCard, BookCover, DatePipe, EmptyState, MatButtonModule, MatIconModule, RouterLink],
  providers: [DatePipe],
  templateUrl: './book-detail-page.html',
  styleUrl: './book-detail-page.scss',
})
export class BookDetailPage {
  private readonly booksApi = inject(BooksApi);
  private readonly loansApi = inject(LoansApi);
  private readonly notifier = inject(Notifier);
  private readonly router = inject(Router);
  private readonly datePipe = inject(DatePipe);
  protected readonly auth = inject(AuthService);

  readonly id = input.required<string>();

  protected readonly borrowing = signal(false);
  protected readonly returnUrl = computed(() => `/books/${this.id()}`);

  protected readonly state = toSignal(
    toObservable(this.id).pipe(switchMap((id) => toLoadState(this.booksApi.get(id)))),
    { initialValue: { status: 'loading' as const } },
  );

  private readonly author = computed(() => {
    const current = this.state();

    return current.status === 'loaded' ? current.value.author : null;
  });

  protected readonly moreByAuthor = toSignal(
    toObservable(this.author).pipe(
      switchMap((author) => {
        if (!author) {
          return of<Book[]>([]);
        }

        return this.booksApi.list({ page: 1, pageSize: MORE_BY_AUTHOR + 1, search: author }).pipe(
          map((page) =>
            page.items
              .filter((book) => book.id !== this.id() && book.author === author)
              .slice(0, MORE_BY_AUTHOR),
          ),
          catchError(() => of<Book[]>([])),
        );
      }),
    ),
    { initialValue: [] as Book[] },
  );

  protected borrow(): void {
    const session = this.auth.session();

    if (!session) {
      return;
    }

    this.borrowing.set(true);
    this.loansApi.borrow(this.id(), session.memberId).subscribe({
      next: (loan) => {
        this.notifier.success(
          `Enjoy your book! Please return it by ${this.datePipe.transform(loan.dueDate, 'mediumDate')}.`,
        );
        void this.router.navigate(['/my-loans']);
      },
      error: (error: unknown) => {
        this.borrowing.set(false);
        this.notifier.error(error);
      },
    });
  }
}
