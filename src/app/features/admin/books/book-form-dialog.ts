import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { Book, BookRequest } from '../../../core/api/models';

@Component({
  selector: 'app-book-form-dialog',
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
  ],
  template: `
    <h2 mat-dialog-title>{{ book ? 'Edit book' : 'Add a book' }}</h2>
    <form [formGroup]="form" (ngSubmit)="save()">
      <mat-dialog-content class="form-grid">
        <mat-form-field appearance="outline">
          <mat-label>Title</mat-label>
          <input matInput formControlName="title" />
          <mat-error>Title is required (up to 200 characters).</mat-error>
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Author</mat-label>
          <input matInput formControlName="author" />
          <mat-error>Author is required (up to 150 characters).</mat-error>
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Description</mat-label>
          <textarea matInput rows="5" formControlName="description"></textarea>
          <mat-error>Use up to 1000 characters.</mat-error>
        </mat-form-field>
      </mat-dialog-content>

      <mat-dialog-actions align="end">
        <button mat-button type="button" mat-dialog-close>Cancel</button>
        <button mat-flat-button type="submit">Save</button>
      </mat-dialog-actions>
    </form>
  `,
  styles: `
    mat-dialog-content {
      min-width: min(480px, 80vw);
    }
  `,
})
export class BookFormDialog {
  private readonly dialogRef = inject<MatDialogRef<BookFormDialog, BookRequest>>(MatDialogRef);
  protected readonly book = inject<Book | null>(MAT_DIALOG_DATA);

  protected readonly form = inject(FormBuilder).nonNullable.group({
    title: [this.book?.title ?? '', [Validators.required, Validators.maxLength(200)]],
    author: [this.book?.author ?? '', [Validators.required, Validators.maxLength(150)]],
    description: [this.book?.description ?? '', Validators.maxLength(1000)],
  });

  protected save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.dialogRef.close(this.form.getRawValue());
  }
}
