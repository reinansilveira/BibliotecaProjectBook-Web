import { Component, inject, signal } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { catchError, filter, map, Observable, of, switchMap } from 'rxjs';
import { BooksApi } from '../../../core/api/books-api';
import { Book, PageQuery } from '../../../core/api/models';
import { toLoadState } from '../../../core/http/load-state';
import { I18n } from '../../../core/i18n/i18n.service';
import { provideLocalizedPaginator } from '../../../core/i18n/paginator-intl';
import { TranslatePipe } from '../../../core/i18n/pipes';
import { Notifier } from '../../../core/notifications/notifier';
import { BookCover } from '../../../shared/book-cover';
import { ConfirmDialog, ConfirmDialogData } from '../../../shared/confirm-dialog';
import { EmptyState } from '../../../shared/empty-state';
import { BookFormData, BookFormDialog, BookFormResult } from './book-form-dialog';
import { ManageBookDialog } from './manage-book-dialog';

const PAGE_SIZE = 10;

@Component({
  selector: 'app-admin-books-page',
  imports: [
    BookCover,
    EmptyState,
    MatButtonModule,
    MatIconModule,
    MatPaginatorModule,
    MatTableModule,
    MatTooltipModule,
    TranslatePipe,
  ],
  providers: [provideLocalizedPaginator()],
  templateUrl: './admin-books-page.html',
})
export class AdminBooksPage {
  private readonly booksApi = inject(BooksApi);
  private readonly dialog = inject(MatDialog);
  private readonly notifier = inject(Notifier);
  private readonly i18n = inject(I18n);

  protected readonly pageSize = PAGE_SIZE;
  protected readonly columns = ['book', 'genre', 'copies', 'ebook', 'actions'];
  protected readonly skeletonRows = [1, 2, 3, 4, 5];
  protected readonly query = signal<PageQuery>({ page: 1, pageSize: PAGE_SIZE });

  protected readonly state = toSignal(
    toObservable(this.query).pipe(switchMap((query) => toLoadState(this.booksApi.list(query)))),
    { initialValue: { status: 'loading' as const } },
  );

  private readonly genres = toSignal(
    this.booksApi.genres().pipe(
      map((genres) => genres.map((genre) => genre.name)),
      catchError(() => of<string[]>([])),
    ),
    { initialValue: [] as string[] },
  );

  protected search(term: string): void {
    this.query.set({ page: 1, pageSize: PAGE_SIZE, search: term.trim() || undefined });
  }

  protected changePage(event: PageEvent): void {
    this.query.update((query) => ({ ...query, page: event.pageIndex + 1 }));
  }

  protected create(): void {
    this.openForm(null)
      .pipe(switchMap((result) => this.persist(result, null)))
      .subscribe({
        next: (book) =>
          this.done(this.i18n.t('“{title}” was added to the catalog.', { title: book.title })),
        error: (error: unknown) => this.notifier.error(error),
      });
  }

  protected edit(book: Book): void {
    this.openForm(book)
      .pipe(switchMap((result) => this.persist(result, book)))
      .subscribe({
        next: (updated) =>
          this.done(this.i18n.t('“{title}” was updated.', { title: updated.title })),
        error: (error: unknown) => this.notifier.error(error),
      });
  }

  protected manage(book: Book): void {
    this.dialog
      .open(ManageBookDialog, { data: book, width: '680px', maxWidth: '96vw' })
      .afterClosed()
      .subscribe(() => this.query.update((query) => ({ ...query })));
  }

  protected remove(book: Book): void {
    const data: ConfirmDialogData = {
      title: this.i18n.t('Remove book'),
      message: this.i18n.t('Remove “{title}” from the catalog? Books on loan cannot be removed.', {
        title: book.title,
      }),
      confirmLabel: this.i18n.t('Remove'),
    };

    this.dialog
      .open<ConfirmDialog, ConfirmDialogData, boolean>(ConfirmDialog, { data })
      .afterClosed()
      .pipe(
        filter((confirmed) => confirmed === true),
        switchMap(() => this.booksApi.delete(book.id)),
      )
      .subscribe({
        next: () => this.done(this.i18n.t('“{title}” was removed.', { title: book.title })),
        error: (error: unknown) => this.notifier.error(error),
      });
  }

  private persist(result: BookFormResult, book: Book | null): Observable<Book> {
    if (result.kind === 'import') {
      return this.booksApi.import(result.request);
    }

    if (result.kind === 'create') {
      return this.booksApi.create(result.request);
    }

    return this.booksApi.update(book?.id ?? '', result.request);
  }

  private openForm(book: Book | null): Observable<BookFormResult> {
    const data: BookFormData = { book, genres: this.genres() };

    return this.dialog
      .open<BookFormDialog, BookFormData, BookFormResult>(BookFormDialog, {
        data,
        width: '640px',
        maxWidth: '96vw',
      })
      .afterClosed()
      .pipe(filter((result): result is BookFormResult => result !== undefined));
  }

  private done(message: string): void {
    this.notifier.success(message);
    this.query.update((query) => ({ ...query }));
  }
}
