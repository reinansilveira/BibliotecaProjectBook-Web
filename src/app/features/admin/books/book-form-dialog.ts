import { NgTemplateOutlet } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatTabsModule } from '@angular/material/tabs';
import { firstValueFrom } from 'rxjs';
import { BooksApi } from '../../../core/api/books-api';
import {
  Book,
  BookMetadata,
  BookRequest,
  CreateBookRequest,
  ImportBookRequest,
} from '../../../core/api/models';
import { errorMessage } from '../../../core/http/error-message';
import { TranslatePipe } from '../../../core/i18n/pipes';
import { BookCover } from '../../../shared/book-cover';

export interface BookFormData {
  book: Book | null;
  genres: string[];
}

export type BookFormResult =
  | { kind: 'create'; request: CreateBookRequest }
  | { kind: 'update'; request: BookRequest }
  | { kind: 'import'; request: ImportBookRequest };

function optional(value: string): string | null {
  return value.trim() || null;
}

@Component({
  selector: 'app-book-form-dialog',
  imports: [
    BookCover,
    NgTemplateOutlet,
    ReactiveFormsModule,
    MatAutocompleteModule,
    MatButtonModule,
    MatDialogModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatTabsModule,
    TranslatePipe,
  ],
  templateUrl: './book-form-dialog.html',
  styles: `
    mat-dialog-content {
      min-width: min(560px, 84vw);
    }

    .two {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
    }

    .lookup {
      display: flex;
      gap: 12px;
      align-items: flex-start;
      padding-top: 16px;

      mat-form-field {
        flex: 1;
      }

      button {
        height: 56px;
      }
    }

    .preview {
      display: flex;
      gap: 16px;
      padding: 16px;
      margin: 4px 0 16px;
      border-radius: var(--app-radius-small);
      background: var(--mat-sys-surface-container-low);

      .thumb {
        width: 72px;
      }

      div {
        display: flex;
        flex-direction: column;
        gap: 4px;
      }

      small {
        color: var(--mat-sys-on-surface-variant);
      }
    }

    .lookup-error {
      color: var(--mat-sys-error);
      margin: 0 0 12px;
    }

    .manual {
      padding-top: 16px;
    }

    @media (max-width: 520px) {
      .two {
        grid-template-columns: 1fr;
        gap: 0;
      }
    }
  `,
})
export class BookFormDialog {
  private readonly dialogRef = inject<MatDialogRef<BookFormDialog, BookFormResult>>(MatDialogRef);
  private readonly booksApi = inject(BooksApi);
  private readonly data = inject<BookFormData>(MAT_DIALOG_DATA);
  private readonly formBuilder = inject(FormBuilder).nonNullable;

  protected readonly book = this.data.book;
  protected readonly genres = this.data.genres;
  protected readonly tab = signal(0);
  protected readonly lookingUp = signal(false);
  protected readonly metadata = signal<BookMetadata | null>(null);
  protected readonly lookupError = signal('');

  protected readonly form = this.formBuilder.group({
    title: [this.book?.title ?? '', [Validators.required, Validators.maxLength(200)]],
    author: [this.book?.author ?? '', [Validators.required, Validators.maxLength(150)]],
    genre: [this.book?.genre ?? '', [Validators.required, Validators.maxLength(60)]],
    description: [this.book?.description ?? '', Validators.maxLength(2000)],
    isbn: [this.book?.isbn ?? ''],
    publishedYear: [this.book?.publishedYear?.toString() ?? ''],
    coverUrl: [this.book?.coverUrl ?? ''],
    copies: [1, [Validators.min(0), Validators.max(50)]],
  });

  protected readonly importForm = this.formBuilder.group({
    isbn: ['', [Validators.required, Validators.pattern(/^[0-9Xx-]{10,17}$/)]],
    genre: [''],
    copies: [1, [Validators.min(0), Validators.max(50)]],
  });

  protected async lookup(): Promise<void> {
    const isbn = this.importForm.controls.isbn.value.trim();

    if (!isbn) {
      this.importForm.markAllAsTouched();
      return;
    }

    this.lookingUp.set(true);
    this.lookupError.set('');
    this.metadata.set(null);

    try {
      const metadata = await firstValueFrom(this.booksApi.lookup(isbn));
      this.metadata.set(metadata);
      this.importForm.controls.genre.setValue(metadata.genre ?? '');
    } catch (error: unknown) {
      this.lookupError.set(errorMessage(error));
    } finally {
      this.lookingUp.set(false);
    }
  }

  protected saveImport(): void {
    if (this.importForm.invalid) {
      this.importForm.markAllAsTouched();
      return;
    }

    const value = this.importForm.getRawValue();
    this.dialogRef.close({
      kind: 'import',
      request: { isbn: value.isbn.trim(), copies: value.copies, genre: optional(value.genre) },
    });
  }

  protected save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const value = this.form.getRawValue();
    const year = Number(value.publishedYear);
    const request: BookRequest = {
      title: value.title.trim(),
      author: value.author.trim(),
      genre: value.genre.trim(),
      description: value.description.trim(),
      isbn: optional(value.isbn),
      publishedYear: Number.isInteger(year) && year > 0 ? year : null,
      coverUrl: optional(value.coverUrl),
    };

    if (this.book) {
      this.dialogRef.close({ kind: 'update', request });
      return;
    }

    this.dialogRef.close({ kind: 'create', request: { ...request, copies: value.copies } });
  }
}
