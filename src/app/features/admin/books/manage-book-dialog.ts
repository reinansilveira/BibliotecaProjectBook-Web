import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatTabsModule } from '@angular/material/tabs';
import { firstValueFrom, Observable } from 'rxjs';
import { BooksApi } from '../../../core/api/books-api';
import { Book, BookCopy, Reservation } from '../../../core/api/models';
import { I18n } from '../../../core/i18n/i18n.service';
import { LocalDatePipe, TranslatePipe } from '../../../core/i18n/pipes';
import { Notifier } from '../../../core/notifications/notifier';
import { LoanStatusChip } from '../../../shared/loan-status-chip';

@Component({
  selector: 'app-manage-book-dialog',
  imports: [
    FormsModule,
    LoanStatusChip,
    LocalDatePipe,
    MatButtonModule,
    MatDialogModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatTabsModule,
    TranslatePipe,
  ],
  templateUrl: './manage-book-dialog.html',
  styleUrl: './manage-book-dialog.scss',
})
export class ManageBookDialog {
  private readonly booksApi = inject(BooksApi);
  private readonly notifier = inject(Notifier);
  private readonly i18n = inject(I18n);

  protected readonly book = signal(inject<Book>(MAT_DIALOG_DATA));
  protected readonly copies = signal<BookCopy[] | null>(null);
  protected readonly waiting = signal<Reservation[] | null>(null);
  protected readonly busy = signal(false);
  protected readonly quantity = signal(1);
  protected readonly licenses = signal(this.book().ebookLicenses || 3);
  protected readonly gutenbergId = signal<number | null>(null);
  protected readonly file = signal<File | null>(null);

  constructor() {
    void this.loadCopies();
    void this.loadWaiting();
  }

  protected async addCopies(): Promise<void> {
    await this.run(this.booksApi.addCopies(this.book().id, this.quantity()), (copies) => {
      this.copies.set(copies);
      return this.i18n.t('Copies added.');
    });
    await this.refreshBook();
  }

  protected async withdraw(copy: BookCopy): Promise<void> {
    await this.run(this.booksApi.withdrawCopy(this.book().id, copy.id), () => {
      void this.loadCopies();
      return this.i18n.t('Copy withdrawn.');
    });
    await this.refreshBook();
  }

  protected pick(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.file.set(input.files?.item(0) ?? null);
  }

  protected async upload(): Promise<void> {
    const file = this.file();

    if (!file) {
      return;
    }

    await this.run(this.booksApi.uploadEbook(this.book().id, file, this.licenses()), (book) => {
      this.book.set(book);
      return this.i18n.t('E-book uploaded.');
    });
  }

  protected async importGutenberg(): Promise<void> {
    const id = this.gutenbergId();

    if (!id || id < 1) {
      return;
    }

    await this.run(this.booksApi.importGutenberg(this.book().id, id, this.licenses()), (book) => {
      this.book.set(book);
      return this.i18n.t('E-book imported from Project Gutenberg.');
    });
  }

  protected async saveLicenses(): Promise<void> {
    await this.run(this.booksApi.setLicenses(this.book().id, this.licenses()), (book) => {
      this.book.set(book);
      return this.i18n.t('Licenses updated.');
    });
  }

  private async run<T>(request: Observable<T>, onSuccess: (value: T) => string): Promise<void> {
    this.busy.set(true);

    try {
      const value = await firstValueFrom(request);
      this.notifier.success(onSuccess(value));
    } catch (error: unknown) {
      this.notifier.error(error);
    } finally {
      this.busy.set(false);
    }
  }

  private async refreshBook(): Promise<void> {
    const book = await firstValueFrom(this.booksApi.refresh(this.book().id)).catch(() => null);

    if (book) {
      this.book.set(book);
    }
  }

  private async loadCopies(): Promise<void> {
    const copies = await firstValueFrom(this.booksApi.copies(this.book().id)).catch(() => []);
    this.copies.set(copies);
  }

  private async loadWaiting(): Promise<void> {
    const waiting = await firstValueFrom(this.booksApi.waitingList(this.book().id)).catch(() => []);
    this.waiting.set(waiting);
  }
}
