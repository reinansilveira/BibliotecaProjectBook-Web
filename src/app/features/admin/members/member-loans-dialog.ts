import { Component, inject, signal } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTableModule } from '@angular/material/table';
import { switchMap } from 'rxjs';
import { LoansApi } from '../../../core/api/loans-api';
import { MembersApi } from '../../../core/api/members-api';
import { Loan, Member } from '../../../core/api/models';
import { toLoadState } from '../../../core/http/load-state';
import { I18n } from '../../../core/i18n/i18n.service';
import { LocalDatePipe, TranslatePipe } from '../../../core/i18n/pipes';
import { Notifier } from '../../../core/notifications/notifier';
import { BookCover } from '../../../shared/book-cover';
import { EmptyState } from '../../../shared/empty-state';
import { LoanStatusChip } from '../../../shared/loan-status-chip';

@Component({
  selector: 'app-member-loans-dialog',
  imports: [
    BookCover,
    LocalDatePipe,
    TranslatePipe,
    EmptyState,
    LoanStatusChip,
    MatButtonModule,
    MatDialogModule,
    MatProgressBarModule,
    MatTableModule,
  ],
  template: `
    <h2 mat-dialog-title>{{ 'Loans of {name}' | t: { name: member.name } }}</h2>
    <mat-dialog-content>
      @if (state(); as current) {
        @switch (current.status) {
          @case ('loading') {
            <mat-progress-bar mode="indeterminate" [attr.aria-label]="'Loading loans' | t" />
          }
          @case ('error') {
            <app-empty-state icon="cloud_off" [title]="'We could not load the loans' | t">{{
              current.message | t
            }}</app-empty-state>
          }
          @case ('loaded') {
            @if (current.value.items.length === 0) {
              <app-empty-state icon="bookmarks" [title]="'No loans' | t">{{
                'This member has not borrowed any book yet.' | t
              }}</app-empty-state>
            } @else {
              <table mat-table class="data-table" [dataSource]="current.value.items">
                <ng-container matColumnDef="book">
                  <th mat-header-cell *matHeaderCellDef>{{ 'Book' | t }}</th>
                  <td mat-cell *matCellDef="let loan">
                    <span class="cell-with-media">
                      <span class="thumb">
                        <app-book-cover
                          [title]="loan.bookTitle"
                          [author]="loan.bookAuthor"
                          [coverUrl]="loan.coverUrl"
                          display="thumb"
                        />
                      </span>
                      <span class="cell-stack">
                        <strong>{{ loan.bookTitle }}</strong>
                        <small>{{ (loan.format === 'Ebook' ? 'E-book' : 'Print') | t }}</small>
                      </span>
                    </span>
                  </td>
                </ng-container>
                <ng-container matColumnDef="dueDate">
                  <th mat-header-cell *matHeaderCellDef>{{ 'Due' | t }}</th>
                  <td mat-cell *matCellDef="let loan">{{ loan.dueDate | localDate }}</td>
                </ng-container>
                <ng-container matColumnDef="status">
                  <th mat-header-cell *matHeaderCellDef>{{ 'Status' | t }}</th>
                  <td mat-cell *matCellDef="let loan">
                    <app-loan-status-chip [status]="loan.status" />
                  </td>
                </ng-container>
                <ng-container matColumnDef="actions">
                  <th mat-header-cell *matHeaderCellDef>
                    <span class="cdk-visually-hidden">{{ 'Actions' | t }}</span>
                  </th>
                  <td mat-cell *matCellDef="let loan" class="actions-cell">
                    @if (loan.status === 'Active' || loan.status === 'Overdue') {
                      <button mat-stroked-button (click)="registerReturn(loan)">
                        {{ 'Register return' | t }}
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
      <button mat-button mat-dialog-close>{{ 'Close' | t }}</button>
    </mat-dialog-actions>
  `,
})
export class MemberLoansDialog {
  private readonly membersApi = inject(MembersApi);
  private readonly loansApi = inject(LoansApi);
  private readonly notifier = inject(Notifier);
  private readonly i18n = inject(I18n);

  protected readonly member = inject<Member>(MAT_DIALOG_DATA);
  protected readonly columns = ['book', 'dueDate', 'status', 'actions'];
  private readonly reload = signal(0);

  protected readonly state = toSignal(
    toObservable(this.reload).pipe(
      switchMap(() => toLoadState(this.membersApi.loans(this.member.id, 1, 50))),
    ),
    { initialValue: { status: 'loading' as const } },
  );

  protected registerReturn(loan: Loan): void {
    this.loansApi.return(loan.id).subscribe({
      next: () => {
        this.notifier.success(this.i18n.t('“{title}” was returned.', { title: loan.bookTitle }));
        this.reload.update((value) => value + 1);
      },
      error: (error: unknown) => this.notifier.error(error),
    });
  }
}
