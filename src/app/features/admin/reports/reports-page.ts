import { DOCUMENT } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { switchMap } from 'rxjs';
import { MonthlyOverdue } from '../../../core/api/models';
import { ReportExport, ReportsApi } from '../../../core/api/reports-api';
import { toLoadState } from '../../../core/http/load-state';
import { LocalNumberPipe, TranslatePipe } from '../../../core/i18n/pipes';
import { Notifier } from '../../../core/notifications/notifier';
import { saveFile } from '../../../shared/download';
import { EmptyState } from '../../../shared/empty-state';
import { MonthlyChart } from '../shared/monthly-chart';
import { RankingList } from '../shared/ranking-list';
import { yearTotals } from '../shared/year-totals';

interface RankingFilter {
  from: string | null;
  to: string | null;
}

export interface ReportSummary {
  loans: number;
  overdue: number;
  rate: number;
  averageDaysLate: number;
}

export function summarize(months: MonthlyOverdue[]): ReportSummary {
  const totals = yearTotals(months);
  const daysLate = months.reduce(
    (total, month) => total + month.averageDaysOverdue * month.overdueLoans,
    0,
  );

  return {
    ...totals,
    averageDaysLate: totals.overdue === 0 ? 0 : daysLate / totals.overdue,
  };
}

@Component({
  selector: 'app-reports-page',
  imports: [
    LocalNumberPipe,
    EmptyState,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MonthlyChart,
    RankingList,
    TranslatePipe,
  ],
  templateUrl: './reports-page.html',
  styleUrl: './reports-page.scss',
})
export class ReportsPage {
  private readonly reportsApi = inject(ReportsApi);
  private readonly notifier = inject(Notifier);
  private readonly document = inject(DOCUMENT);

  protected readonly exporting = signal<ReportExport | null>(null);

  protected readonly years = Array.from(
    { length: 5 },
    (_, index) => new Date().getFullYear() - index,
  );
  protected readonly year = signal(new Date().getFullYear());
  protected readonly rankingFilter = signal<RankingFilter>({ from: null, to: null });

  protected readonly ranking = toSignal(
    toObservable(this.rankingFilter).pipe(
      switchMap((filter) =>
        toLoadState(this.reportsApi.mostBorrowedBooks(filter.from, filter.to, 10)),
      ),
    ),
    { initialValue: { status: 'loading' as const } },
  );

  protected readonly overdue = toSignal(
    toObservable(this.year).pipe(
      switchMap((year) => toLoadState(this.reportsApi.overdueByMonth(year))),
    ),
    { initialValue: { status: 'loading' as const } },
  );

  protected readonly summary = computed(() => {
    const current = this.overdue();

    return summarize(current.status === 'loaded' ? current.value : []);
  });

  protected applyRanking(from: string, to: string): void {
    this.rankingFilter.set({ from: from || null, to: to || null });
  }

  protected exportOverdue(): void {
    this.download('overdue-by-month', { year: this.year() }, `overdue-by-month-${this.year()}.csv`);
  }

  protected exportRanking(): void {
    const filter = this.rankingFilter();
    this.download('most-borrowed-books', { ...filter, top: 50 }, 'most-borrowed-books.csv');
  }

  protected exportLoans(from: string, to: string): void {
    this.download('loans', { from: from || null, to: to || null }, 'loans.csv');
  }

  private download(
    report: ReportExport,
    filters: Record<string, string | number | null>,
    fileName: string,
  ): void {
    this.exporting.set(report);
    this.reportsApi.export(report, filters).subscribe({
      next: (blob) => {
        this.exporting.set(null);
        saveFile(blob, fileName, this.document);
      },
      error: (error: unknown) => {
        this.exporting.set(null);
        this.notifier.error(error);
      },
    });
  }
}
