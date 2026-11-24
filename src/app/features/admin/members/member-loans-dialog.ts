import { DatePipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTableModule } from '@angular/material/table';
import { switchMap } from 'rxjs';
import { BooksApi } from '../../../core/api/books-api';
import { LoansApi } from '../../../core/api/loans-api';
import { MembersApi } from '../../../core/api/members-api';
import { Member } from '../../../core/api/models';
import { toLoadState } from '../../../core/http/load-state';
import { Notifier } from '../../../core/notifications/notifier';
import { BookCover } from '../../../shared/book-cover';
import { EmptyState } from '../../../shared/empty-state';
import { LoanStatusChip } from '../../../shared/loan-status-chip';
import { LoanWithBook, withBooks } from '../../account/loan-with-book';

@Component({
  selector: 'app-member-loans-dialog',
  imports: [
    BookCover,
    DatePipe,
    EmptyState,
    LoanStatusChip,
    MatButtonModule,
    MatDialogModule,
    MatProgressBarModule,
    MatTableModule,
  ],
  template: `
    <h2 mat-dialog-title>Loans of {{ member.name }}</h2>
    <mat-dialog-content>
      @if (state(); as current) {
        @switch (current.status) {
          @case ('loading') {
            <mat-progress-bar mode="indeterminate" aria-label="Loading loans" />
          }
          @case ('error') {
            <app-empty-state icon="cloud_off" title="We could not load the loans">{{
              current.message
            }}</app-empty-state>
          }
          @case ('loaded') {
            @if (current.value.items.length === 0) {
              <app-empty-state icon="bookmarks" title="No loans"
                >This member has not borrowed any book yet.</app-empty-state
              >
            } @else {
              <table mat-table class="data-table" [dataSource]="current.value.items">
                <ng-container matColumnDef="book">
                  <th mat-header-cell *matHeaderCellDef>Book</th>
                  <td mat-cell *matCellDef="let loan">
                    <span class="cell-with-media">
                      <span class="thumb">
                        <app-book-cover
                          [title]="loan.book.title"
                          [author]="loan.book.author"
                          display="thumb"
                        />
                      </span>
                      <span class="cell-stack">
                        <strong>{{ loan.book.title }}</strong>
                        <small>{{ loan.book.author }}</small>
                      </span>
                    </span>
                  </td>
                </ng-container>
                <ng-container matColumnDef="dueDate">
                  <th mat-header-cell *matHeaderCellDef>Due</th>
                  <td mat-cell *matCellDef="let loan">{{ loan.dueDate | date: 'mediumDate' }}</td>
                </ng-container>
                <ng-container matColumnDef="status">
                  <th mat-header-cell *matHeaderCellDef>Status</th>
                  <td mat-cell *matCellDef="let loan">
                    <app-loan-status-chip [status]="loan.status" />
                  </td>
                </ng-container>
                <ng-container matColumnDef="actions">
                  <th mat-header-cell *matHeaderCellDef>
                    <span class="cdk-visually-hidden">Actions</span>
                  </th>
                  <td mat-cell *matCellDef="let loan" class="actions-cell">
                    @if (loan.status !== 'Returned') {
                      <button mat-stroked-button (click)="registerReturn(loan)">
                        Register return
                      </button>
                    }
                  </td>
                </ng-container>
                <tr mat-header-row *matHeaderRowDef="columns"></tr>
                <tr mat-row *matRowDef="let row; columns: columns"></tr>
              </table>
            }
          }
        }
      }
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Close</button>
    </mat-dialog-actions>
  `,
})
export class MemberLoansDialog {
  private readonly membersApi = inject(MembersApi);
  private readonly booksApi = inject(BooksApi);
  private readonly loansApi = inject(LoansApi);
  private readonly notifier = inject(Notifier);

  protected readonly member = inject<Member>(MAT_DIALOG_DATA);
  protected readonly columns = ['book', 'dueDate', 'status', 'actions'];
  private readonly reload = signal(0);

  protected readonly state = toSignal(
    toObservable(this.reload).pipe(
      switchMap(() =>
        toLoadState(
          this.membersApi
            .loans(this.member.id, 1, 50)
            .pipe(switchMap((page) => withBooks(page, this.booksApi))),
        ),
      ),
    ),
    { initialValue: { status: 'loading' as const } },
  );

  protected registerReturn(loan: LoanWithBook): void {
    this.loansApi.return(loan.id).subscribe({
      next: () => {
        this.notifier.success(`“${loan.book.title}” was returned.`);
        this.reload.update((value) => value + 1);
      },
      error: (error: unknown) => this.notifier.error(error),
    });
  }
}
