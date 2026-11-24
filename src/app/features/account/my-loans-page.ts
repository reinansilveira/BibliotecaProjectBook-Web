import { DatePipe, DecimalPipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';
import { map, switchMap } from 'rxjs';
import { BooksApi } from '../../core/api/books-api';
import { MembersApi } from '../../core/api/members-api';
import { PagedResult } from '../../core/api/models';
import { AuthService } from '../../core/auth/auth.service';
import { toLoadState } from '../../core/http/load-state';
import { BookCover } from '../../shared/book-cover';
import { EmptyState } from '../../shared/empty-state';
import { LoanStatusChip } from '../../shared/loan-status-chip';
import { LoanWithBook, withBooks } from './loan-with-book';
import { LoanProgress, loanProgress } from './loan-progress';

const MAX_LOANS = 50;

export interface LoanCard extends LoanWithBook {
  progress: LoanProgress;
}

export interface LoanShelf {
  all: LoanCard[];
  reading: LoanCard[];
  history: LoanCard[];
  overdue: number;
}

export function toShelf(page: PagedResult<LoanWithBook>, now: number = Date.now()): LoanShelf {
  const all = page.items.map((loan) => ({ ...loan, progress: loanProgress(loan, now) }));
  const reading = all
    .filter((loan) => loan.status !== 'Returned')
    .sort((first, second) => Date.parse(first.dueDate) - Date.parse(second.dueDate));

  return {
    all,
    reading,
    history: all.filter((loan) => loan.status === 'Returned'),
    overdue: reading.filter((loan) => loan.progress.tone === 'late').length,
  };
}

@Component({
  selector: 'app-my-loans-page',
  imports: [
    DatePipe,
    DecimalPipe,
    RouterLink,
    BookCover,
    EmptyState,
    LoanStatusChip,
    MatButtonModule,
    MatIconModule,
  ],
  templateUrl: './my-loans-page.html',
  styleUrl: './my-loans-page.scss',
})
export class MyLoansPage {
  private readonly membersApi = inject(MembersApi);
  private readonly booksApi = inject(BooksApi);
  private readonly auth = inject(AuthService);

  protected readonly state = toSignal(
    toLoadState(
      this.membersApi.loans(this.auth.session()?.memberId ?? '', 1, MAX_LOANS).pipe(
        switchMap((loans) => withBooks(loans, this.booksApi)),
        map((page) => toShelf(page)),
      ),
    ),
    { initialValue: { status: 'loading' as const } },
  );
}
