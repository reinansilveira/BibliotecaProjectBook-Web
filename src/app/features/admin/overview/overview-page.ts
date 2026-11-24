import { DecimalPipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';
import { catchError, forkJoin, map, Observable, of } from 'rxjs';
import { BlacklistApi } from '../../../core/api/blacklist-api';
import { BooksApi } from '../../../core/api/books-api';
import { MembersApi } from '../../../core/api/members-api';
import { MonthlyOverdue, MostBorrowedBook, PagedResult } from '../../../core/api/models';
import { ReportsApi } from '../../../core/api/reports-api';
import { toLoadState } from '../../../core/http/load-state';
import { MonthlyChart } from '../shared/monthly-chart';
import { RankingList } from '../shared/ranking-list';
import { YearTotals, yearTotals } from '../shared/year-totals';

export interface Overview {
  books: number | null;
  members: number | null;
  blocked: number | null;
  months: MonthlyOverdue[];
  totals: YearTotals;
  top: MostBorrowedBook[];
}

function total<T>(source: Observable<PagedResult<T>>): Observable<number | null> {
  return source.pipe(
    map((page) => page.totalItems),
    catchError(() => of(null)),
  );
}

@Component({
  selector: 'app-overview-page',
  imports: [DecimalPipe, MatIconModule, MonthlyChart, RankingList, RouterLink],
  template: `
    @if (state(); as current) {
      @switch (current.status) {
        @case ('loading') {
          <div class="kpi-grid" aria-busy="true" aria-label="Loading dashboard">
            @for (placeholder of [1, 2, 3, 4]; track placeholder) {
              <span class="skeleton kpi-skeleton"></span>
            }
          </div>
          <span class="skeleton chart-skeleton"></span>
        }
        @case ('error') {
          <p class="hint">{{ current.message }}</p>
        }
        @case ('loaded') {
          <div class="kpi-grid">
            <div class="kpi">
              <span class="kpi-label"><mat-icon>menu_book</mat-icon>Books</span>
              <span class="kpi-value">{{ current.value.books ?? '—' }}</span>
              <span class="kpi-note">in the catalog</span>
            </div>
            <div class="kpi">
              <span class="kpi-label"><mat-icon>group</mat-icon>Members</span>
              <span class="kpi-value">{{ current.value.members ?? '—' }}</span>
              <span class="kpi-note">registered readers</span>
            </div>
            <div class="kpi" [class.alert]="(current.value.blocked ?? 0) > 0">
              <span class="kpi-label"><mat-icon>block</mat-icon>Blocked</span>
              <span class="kpi-value">{{ current.value.blocked ?? '—' }}</span>
              <span class="kpi-note">with overdue returns</span>
            </div>
            <div class="kpi">
              <span class="kpi-label"><mat-icon>swap_horiz</mat-icon>Loans in {{ year }}</span>
              <span class="kpi-value">{{ current.value.totals.loans | number }}</span>
              <span class="kpi-note"
                >{{ current.value.totals.overdue }} overdue ·
                {{ current.value.totals.rate | number: '1.0-1' }}%</span
              >
            </div>
          </div>

          <div class="panels">
            <section class="surface card">
              <div class="card-header">
                <div>
                  <h2>Loans in {{ year }}</h2>
                  <p>Monthly loans and overdue returns, grouped by due date.</p>
                </div>
                <a class="link" routerLink="../reports">Open reports</a>
              </div>
              <app-monthly-chart [months]="current.value.months" />
            </section>

            <section class="surface card">
              <div class="card-header">
                <div>
                  <h2>Most borrowed</h2>
                  <p>All-time top five.</p>
                </div>
              </div>
              @if (current.value.top.length > 0) {
                <app-ranking-list [items]="current.value.top" />
              } @else {
                <p class="hint">No loans yet.</p>
              }
            </section>
          </div>

          <div class="shortcuts">
            <a class="shortcut surface" routerLink="../books">
              <mat-icon>library_add</mat-icon>
              <span><strong>Add a book</strong><small>Grow the catalog</small></span>
            </a>
            <a class="shortcut surface" routerLink="../members">
              <mat-icon>assignment_return</mat-icon>
              <span><strong>Register a return</strong><small>Find the member</small></span>
            </a>
            <a class="shortcut surface" routerLink="../blacklist">
              <mat-icon>update</mat-icon>
              <span><strong>Check overdue loans</strong><small>Review the blacklist</small></span>
            </a>
          </div>
        }
      }
    }
  `,
  styles: `
    .panels {
      display: grid;
      grid-template-columns: minmax(0, 1.6fr) minmax(0, 1fr);
      gap: 24px;
      margin-bottom: 24px;
    }

    .shortcuts {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 16px;
    }

    .shortcut {
      display: flex;
      align-items: center;
      gap: 14px;
      padding: 18px 20px;
      text-decoration: none;
      transition: transform 150ms ease;

      &:hover {
        transform: translateY(-2px);
      }

      mat-icon {
        display: grid;
        place-items: center;
        width: 44px;
        height: 44px;
        border-radius: 12px;
        background: var(--mat-sys-tertiary-container);
        color: var(--mat-sys-on-tertiary-container);
      }

      span {
        display: flex;
        flex-direction: column;
      }

      small {
        color: var(--mat-sys-on-surface-variant);
      }
    }

    .kpi-skeleton {
      height: 112px;
      border-radius: var(--app-radius);
    }

    .chart-skeleton {
      height: 340px;
      border-radius: var(--app-radius);
    }

    @media (max-width: 1100px) {
      .panels {
        grid-template-columns: 1fr;
      }
    }
  `,
})
export class OverviewPage {
  private readonly booksApi = inject(BooksApi);
  private readonly membersApi = inject(MembersApi);
  private readonly blacklistApi = inject(BlacklistApi);
  private readonly reportsApi = inject(ReportsApi);

  protected readonly year = new Date().getFullYear();

  protected readonly state = toSignal(
    toLoadState(
      forkJoin({
        books: total(this.booksApi.list({ page: 1, pageSize: 1 })),
        members: total(this.membersApi.list({ page: 1, pageSize: 1 })),
        blocked: total(this.blacklistApi.list(1, 1)),
        months: this.reportsApi.overdueByMonth(this.year),
        top: this.reportsApi.mostBorrowedBooks(null, null, 5).pipe(catchError(() => of([]))),
      }).pipe(map((overview): Overview => ({ ...overview, totals: yearTotals(overview.months) }))),
    ),
    { initialValue: { status: 'loading' as const } },
  );
}
