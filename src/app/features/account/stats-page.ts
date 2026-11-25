import { formatDate } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatIconModule } from '@angular/material/icon';
import { MembersApi } from '../../core/api/members-api';
import { MonthCount } from '../../core/api/models';
import { AuthService } from '../../core/auth/auth.service';
import { toLoadState } from '../../core/http/load-state';
import { I18n } from '../../core/i18n/i18n.service';
import { LocalNumberPipe, TranslatePipe } from '../../core/i18n/pipes';
import { EmptyState } from '../../shared/empty-state';

export interface MonthBar {
  label: string;
  loans: number;
  height: number;
}

export function monthBars(months: MonthCount[], locale: string): MonthBar[] {
  const highest = Math.max(1, ...months.map((month) => month.loans));

  return months.map((month) => ({
    label: formatDate(`${month.month}-01T12:00:00`, 'MMM', locale),
    loans: month.loans,
    height: (month.loans / highest) * 100,
  }));
}

@Component({
  selector: 'app-stats-page',
  imports: [EmptyState, LocalNumberPipe, MatIconModule, TranslatePipe],
  template: `
    @if (state(); as current) {
      @switch (current.status) {
        @case ('loading') {
          <span class="skeleton block-skeleton" [attr.aria-label]="'Loading' | t"></span>
        }
        @case ('error') {
          <app-empty-state icon="cloud_off" [title]="'We could not load your stats' | t">
            {{ current.message | t }}
          </app-empty-state>
        }
        @case ('loaded') {
          @let stats = current.value;
          <div class="kpi-grid">
            <div class="kpi">
              <span class="kpi-label"><mat-icon>menu_book</mat-icon>{{ 'Books read' | t }}</span>
              <span class="kpi-value">{{ stats.booksRead }}</span>
              <span class="kpi-note">{{
                '{count} this year' | t: { count: stats.booksThisYear }
              }}</span>
            </div>
            <div class="kpi">
              <span class="kpi-label"><mat-icon>tablet_mac</mat-icon>{{ 'E-books' | t }}</span>
              <span class="kpi-value">{{ stats.ebooksRead }}</span>
              <span class="kpi-note">{{ 'read in the browser' | t }}</span>
            </div>
            <div class="kpi">
              <span class="kpi-label"><mat-icon>rate_review</mat-icon>{{ 'Reviews' | t }}</span>
              <span class="kpi-value">{{ stats.reviewsWritten }}</span>
              <span class="kpi-note">{{
                'average {rating} stars'
                  | t: { rating: (stats.averageRatingGiven | localNumber: '1.1-1') }
              }}</span>
            </div>
            <div class="kpi">
              <span class="kpi-label"><mat-icon>favorite</mat-icon>{{ 'Favorite genre' | t }}</span>
              <span class="kpi-value genre">{{ stats.favoriteGenre ?? '—' | t }}</span>
              <span class="kpi-note">{{
                '{count} loans in total' | t: { count: stats.totalLoans }
              }}</span>
            </div>
          </div>

          <div class="panels">
            <section class="surface card">
              <div class="card-header">
                <div>
                  <h2>{{ 'Your last twelve months' | t }}</h2>
                  <p>{{ 'Books borrowed per month.' | t }}</p>
                </div>
              </div>
              <div class="months" role="img" [attr.aria-label]="'Books borrowed per month.' | t">
                @for (bar of bars(); track $index) {
                  <div class="month" [attr.title]="bar.label + ': ' + bar.loans">
                    <span class="value">{{ bar.loans || '' }}</span>
                    <span class="bar" [style.height.%]="bar.height"></span>
                    <span class="label">{{ bar.label }}</span>
                  </div>
                }
              </div>
            </section>

            <section class="surface card">
              <div class="card-header">
                <div>
                  <h2>{{ 'Top genres' | t }}</h2>
                  <p>{{ 'What you borrow the most.' | t }}</p>
                </div>
              </div>
              @for (genre of stats.topGenres; track genre.genre) {
                <div class="genre-row">
                  <span>{{ genre.genre | t }}</span>
                  <span class="meter"
                    ><span [style.width.%]="(genre.loans / topGenreMax()) * 100"></span
                  ></span>
                  <strong>{{ genre.loans }}</strong>
                </div>
              } @empty {
                <p class="hint">{{ 'Borrow a few books to see your favorites.' | t }}</p>
              }
            </section>
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
    }

    .genre {
      font-size: 1.4rem;
    }

    .months {
      display: grid;
      grid-template-columns: repeat(12, minmax(0, 1fr));
      gap: 8px;
      height: 220px;
    }

    .month {
      display: flex;
      flex-direction: column;
      justify-content: flex-end;
      align-items: center;
      gap: 6px;
      min-width: 0;
    }

    .bar {
      width: min(70%, 28px);
      min-height: 3px;
      border-radius: 8px 8px 3px 3px;
      background: linear-gradient(180deg, var(--mat-sys-tertiary), var(--mat-sys-primary));
      transition: height 400ms ease;
    }

    .value {
      font: var(--mat-sys-label-small);
      color: var(--mat-sys-on-surface-variant);
    }

    .label {
      font: var(--mat-sys-label-small);
      color: var(--mat-sys-on-surface-variant);
      text-transform: capitalize;
    }

    .genre-row {
      display: grid;
      grid-template-columns: 120px 1fr 32px;
      align-items: center;
      gap: 12px;
      padding: 8px 0;
      font: var(--mat-sys-body-medium);

      strong {
        text-align: right;
      }
    }

    .meter {
      height: 8px;
      border-radius: 999px;
      background: var(--mat-sys-surface-container-high);
      overflow: hidden;

      span {
        display: block;
        height: 100%;
        border-radius: inherit;
        background: var(--mat-sys-primary);
      }
    }

    .block-skeleton {
      height: 320px;
      border-radius: var(--app-radius);
    }

    @media (max-width: 1000px) {
      .panels {
        grid-template-columns: 1fr;
      }
    }

    @media (max-width: 520px) {
      .months .label {
        font-size: 9px;
      }
    }
  `,
})
export class StatsPage {
  private readonly membersApi = inject(MembersApi);
  private readonly auth = inject(AuthService);
  private readonly i18n = inject(I18n);

  protected readonly state = toSignal(
    toLoadState(this.membersApi.readingStats(this.auth.session()?.memberId ?? '')),
    { initialValue: { status: 'loading' as const } },
  );

  protected readonly bars = computed(() => {
    const current = this.state();

    return current.status === 'loaded'
      ? monthBars(current.value.lastTwelveMonths, this.i18n.locale())
      : [];
  });

  protected readonly topGenreMax = computed(() => {
    const current = this.state();

    return current.status === 'loaded'
      ? Math.max(1, ...current.value.topGenres.map((genre) => genre.loans))
      : 1;
  });
}
