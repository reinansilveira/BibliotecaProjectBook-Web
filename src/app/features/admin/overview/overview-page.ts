import { Component, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';
import { catchError, forkJoin, of } from 'rxjs';
import { MaintenanceResult, MonthlyOverdue } from '../../../core/api/models';
import { ReportsApi } from '../../../core/api/reports-api';
import { toLoadState } from '../../../core/http/load-state';
import { LocalNumberPipe, TranslatePipe } from '../../../core/i18n/pipes';
import { Notifier } from '../../../core/notifications/notifier';
import { MonthlyChart } from '../shared/monthly-chart';
import { RankingList } from '../shared/ranking-list';

@Component({
  selector: 'app-overview-page',
  imports: [
    LocalNumberPipe,
    MatButtonModule,
    MatIconModule,
    MonthlyChart,
    RankingList,
    RouterLink,
    TranslatePipe,
  ],
  templateUrl: './overview-page.html',
  styleUrl: './overview-page.scss',
})
export class OverviewPage {
  private readonly reportsApi = inject(ReportsApi);
  private readonly notifier = inject(Notifier);

  protected readonly year = new Date().getFullYear();
  protected readonly running = signal(false);
  protected readonly maintenance = signal<MaintenanceResult | null>(null);

  protected readonly state = toSignal(
    toLoadState(
      forkJoin({
        dashboard: this.reportsApi.dashboard(),
        months: this.reportsApi
          .overdueByMonth(this.year)
          .pipe(catchError(() => of<MonthlyOverdue[]>([]))),
      }),
    ),
    { initialValue: { status: 'loading' as const } },
  );

  protected runMaintenance(): void {
    this.running.set(true);
    this.reportsApi.runMaintenance().subscribe({
      next: (result) => {
        this.running.set(false);
        this.maintenance.set(result);
      },
      error: (error: unknown) => {
        this.running.set(false);
        this.notifier.error(error);
      },
    });
  }
}
