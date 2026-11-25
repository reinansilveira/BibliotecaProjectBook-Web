import { Component, inject, signal } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';
import { map, switchMap } from 'rxjs';
import { LoansApi } from '../../core/api/loans-api';
import { MembersApi } from '../../core/api/members-api';
import { Loan, PagedResult } from '../../core/api/models';
import { AuthService } from '../../core/auth/auth.service';
import { toLoadState } from '../../core/http/load-state';
import { I18n } from '../../core/i18n/i18n.service';
import { LocalDatePipe, LocalNumberPipe, TranslatePipe } from '../../core/i18n/pipes';
import { Notifier } from '../../core/notifications/notifier';
import { BookCover } from '../../shared/book-cover';
import { EmptyState } from '../../shared/empty-state';
import { LoanStatusChip } from '../../shared/loan-status-chip';
import { LoanProgress, loanProgress } from './loan-progress';

const MAX_LOANS = 50;

export interface LoanCard extends Loan {
  progress: LoanProgress;
}

export interface LoanShelf {
  all: LoanCard[];
  reading: LoanCard[];
  history: LoanCard[];
  overdue: number;
}

function isOpen(loan: Loan): boolean {
  return loan.status === 'Active' || loan.status === 'Overdue';
}

export function toShelf(page: PagedResult<Loan>, now: number = Date.now()): LoanShelf {
  const all = page.items.map((loan) => ({ ...loan, progress: loanProgress(loan, now) }));
  const reading = all
    .filter(isOpen)
    .sort((first, second) => Date.parse(first.dueDate) - Date.parse(second.dueDate));

  return {
    all,
    reading,
    history: all.filter((loan) => !isOpen(loan)),
    overdue: reading.filter((loan) => loan.progress.tone === 'late').length,
  };
}

export function canRenew(loan: Loan): boolean {
  return loan.format === 'Print' && loan.status === 'Active' && loan.renewalsLeft > 0;
}

@Component({
  selector: 'app-loans-page',
  imports: [
    LocalDatePipe,
    LocalNumberPipe,
    TranslatePipe,
    RouterLink,
    BookCover,
    EmptyState,
    LoanStatusChip,
    MatButtonModule,
    MatIconModule,
  ],
  templateUrl: './loans-page.html',
  styleUrl: './loans-page.scss',
})
export class LoansPage {
  private readonly membersApi = inject(MembersApi);
  private readonly loansApi = inject(LoansApi);
  private readonly auth = inject(AuthService);
  private readonly notifier = inject(Notifier);
  private readonly i18n = inject(I18n);

  protected readonly busy = signal<string | null>(null);
  protected readonly canRenew = canRenew;
  private readonly version = signal(0);

  protected readonly state = toSignal(
    toObservable(this.version).pipe(
      switchMap(() =>
        toLoadState(
          this.membersApi
            .loans(this.auth.session()?.memberId ?? '', 1, MAX_LOANS)
            .pipe(map((page) => toShelf(page))),
        ),
      ),
    ),
    { initialValue: { status: 'loading' as const } },
  );

  protected renew(loan: Loan): void {
    this.run(loan, this.loansApi.renew(loan.id), (updated) =>
      this.i18n.t('Renewed! The new due date is {date}.', {
        date: new Date(updated.dueDate).toLocaleDateString(this.i18n.locale()),
      }),
    );
  }

  protected returnEbook(loan: Loan): void {
    this.run(loan, this.loansApi.return(loan.id), () =>
      this.i18n.t('“{title}” was returned.', { title: loan.bookTitle }),
    );
  }

  private run(
    loan: Loan,
    request: ReturnType<LoansApi['renew']>,
    message: (updated: Loan) => string,
  ): void {
    this.busy.set(loan.id);
    request.subscribe({
      next: (updated) => {
        this.busy.set(null);
        this.notifier.success(message(updated));
        this.version.update((value) => value + 1);
      },
      error: (error: unknown) => {
        this.busy.set(null);
        this.notifier.error(error);
      },
    });
  }
}
