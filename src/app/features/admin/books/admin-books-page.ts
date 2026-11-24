import { DatePipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { filter, switchMap } from 'rxjs';
import { BooksApi } from '../../../core/api/books-api';
import { Book, BookRequest, PageQuery } from '../../../core/api/models';
import { toLoadState } from '../../../core/http/load-state';
import { Notifier } from '../../../core/notifications/notifier';
import { ConfirmDialog, ConfirmDialogData } from '../../../shared/confirm-dialog';
import { BookCover } from '../../../shared/book-cover';
import { EmptyState } from '../../../shared/empty-state';
import { BookFormDialog } from './book-form-dialog';

const PAGE_SIZE = 10;

@Component({
  selector: 'app-admin-books-page',
  imports: [
    BookCover,
    DatePipe,
    EmptyState,
    MatButtonModule,
    MatIconModule,
    MatPaginatorModule,
    MatTableModule,
    MatTooltipModule,
  ],
  templateUrl: './admin-books-page.html',
})
export class AdminBooksPage {
  private readonly booksApi = inject(BooksApi);
  private readonly dialog = inject(MatDialog);
  private readonly notifier = inject(Notifier);

  protected readonly pageSize = PAGE_SIZE;
  protected readonly columns = ['book', 'createdAt', 'actions'];
  protected readonly skeletonRows = [1, 2, 3, 4, 5];
  protected readonly query = signal<PageQuery>({ page: 1, pageSize: PAGE_SIZE });

  protected readonly state = toSignal(
    toObservable(this.query).pipe(switchMap((query) => toLoadState(this.booksApi.list(query)))),
    { initialValue: { status: 'loading' as const } },
  );

  protected search(term: string): void {
    this.query.set({ page: 1, pageSize: PAGE_SIZE, search: term.trim() || undefined });
  }

  protected changePage(event: PageEvent): void {
    this.query.update((query) => ({ ...query, page: event.pageIndex + 1 }));
  }

  protected create(): void {
    this.openForm(null)
      .pipe(switchMap((request) => this.booksApi.create(request)))
      .subscribe({
        next: (book) => this.done(`“${book.title}” was added to the catalog.`),
        error: (error: unknown) => this.notifier.error(error),
      });
  }

  protected edit(book: Book): void {
    this.openForm(book)
      .pipe(switchMap((request) => this.booksApi.update(book.id, request)))
      .subscribe({
        next: (updated) => this.done(`“${updated.title}” was updated.`),
        error: (error: unknown) => this.notifier.error(error),
      });
  }

  protected remove(book: Book): void {
    const data: ConfirmDialogData = {
      title: 'Remove book',
      message: `Remove “${book.title}” from the catalog? Books on loan cannot be removed.`,
      confirmLabel: 'Remove',
    };

    this.dialog
      .open<ConfirmDialog, ConfirmDialogData, boolean>(ConfirmDialog, { data })
      .afterClosed()
      .pipe(
        filter((confirmed) => confirmed === true),
        switchMap(() => this.booksApi.delete(book.id)),
      )
      .subscribe({
        next: () => this.done(`“${book.title}” was removed.`),
        error: (error: unknown) => this.notifier.error(error),
      });
  }

  private openForm(book: Book | null) {
    return this.dialog
      .open<BookFormDialog, Book | null, BookRequest>(BookFormDialog, { data: book })
      .afterClosed()
      .pipe(filter((request): request is BookRequest => request !== undefined));
  }

  private done(message: string): void {
    this.notifier.success(message);
    this.query.update((query) => ({ ...query }));
  }
}
