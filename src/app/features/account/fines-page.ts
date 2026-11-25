import { Component, computed, inject, signal } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { map, switchMap } from 'rxjs';
import { FinesApi } from '../../core/api/library-api';
import { MembersApi } from '../../core/api/members-api';
import { Fine } from '../../core/api/models';
import { AuthService } from '../../core/auth/auth.service';
import { toLoadState } from '../../core/http/load-state';
import { I18n } from '../../core/i18n/i18n.service';
import { LocalDatePipe, LocalNumberPipe, TranslatePipe } from '../../core/i18n/pipes';
import { Notifier } from '../../core/notifications/notifier';
import { EmptyState } from '../../shared/empty-state';
import { LoanStatusChip } from '../../shared/loan-status-chip';

export function unpaidTotal(fines: Fine[]): number {
  return fines
    .filter((fine) => fine.status === 'Unpaid')
    .reduce((total, fine) => total + fine.amount, 0);
}

@Component({
  selector: 'app-fines-page',
  imports: [
    EmptyState,
    LoanStatusChip,
    LocalDatePipe,
    LocalNumberPipe,
    MatButtonModule,
    MatIconModule,
    TranslatePipe,
  ],
  template: `
    @if (state(); as current) {
      @switch (current.status) {
        @case ('loading') {
          <span class="skeleton block-skeleton" [attr.aria-label]="'Loading' | t"></span>
        }
        @case ('error') {
          <app-empty-state icon="cloud_off" [title]="'We could not load your fines' | t">
            {{ current.message | t }}
          </app-empty-state>
        }
        @case ('loaded') {
          @if (current.value.length === 0) {
            <app-empty-state icon="sentiment_satisfied" [title]="'No fines' | t">
              {{ 'Return printed books on time and you will never see one here.' | t }}
            </app-empty-state>
          } @else {
            <div class="total surface">
              <span>
                <small>{{ 'Outstanding' | t }}</small>
                <strong>{{ currency() }} {{ outstanding() | localNumber: '1.2-2' }}</strong>
              </span>
              <p class="hint">
                {{
                  'Fines are charged per day for printed books returned late. Payment here is simulated.'
                    | t
                }}
              </p>
            </div>
            <ul class="list surface">
              @for (fine of current.value; track fine.id) {
                <li class="row">
                  <span class="icon"><mat-icon>receipt_long</mat-icon></span>
                  <span class="cell-stack grow">
                    <strong>{{ fine.bookTitle }}</strong>
                    <small>{{
                      '{days} days late × {currency} {rate}'
                        | t
                          : {
                              days: fine.daysOverdue,
                              currency: fine.currency,
                              rate: (fine.dailyRate | localNumber: '1.2-2'),
                            }
                    }}</small>
                    <small>{{ 'Issued {date}' | t: { date: fine.issuedAt | localDate } }}</small>
                    @if (fine.paymentReference) {
                      <small>{{
                        'Payment reference: {reference}' | t: { reference: fine.paymentReference }
                      }}</small>
                    }
                  </span>
                  <strong class="amount"
                    >{{ fine.currency }} {{ fine.amount | localNumber: '1.2-2' }}</strong
                  >
                  <app-loan-status-chip [status]="fine.status" />
                  @if (fine.status === 'Unpaid') {
                    <button
                      mat-flat-button
                      type="button"
                      [disabled]="busy() === fine.id"
                      (click)="pay(fine)"
                    >
                      <mat-icon>credit_card</mat-icon>
                      {{ 'Pay' | t }}
                    </button>
                  }
                </li>
              }
            </ul>
          }
        }
      }
    }
  `,
  styles: `
    .total {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 12px 32px;
      padding: 18px 20px;
      margin-bottom: 16px;

      span {
        display: flex;
        flex-direction: column;
      }

      strong {
        font-family: var(--app-serif);
        font-size: 1.8rem;
      }

      .hint {
        flex: 1 1 260px;
      }
    }

    .list {
      margin: 0;
      padding: 4px 0;
      list-style: none;
    }

    .row {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 12px 16px;
      padding: 14px 20px;

      & + .row {
        border-top: 1px solid var(--mat-sys-outline-variant);
      }
    }

    .icon {
      display: grid;
      place-items: center;
      width: 40px;
      height: 40px;
      border-radius: 12px;
      background: var(--mat-sys-tertiary-container);
      color: var(--mat-sys-on-tertiary-container);
    }

    .grow {
      flex: 1 1 220px;
    }

    .amount {
      font-family: var(--app-serif);
      font-size: 1.15rem;
    }

    .block-skeleton {
      height: 220px;
      border-radius: var(--app-radius);
    }
  `,
})
export class FinesPage {
  private readonly membersApi = inject(MembersApi);
  private readonly finesApi = inject(FinesApi);
  private readonly auth = inject(AuthService);
  private readonly notifier = inject(Notifier);
  private readonly i18n = inject(I18n);

  protected readonly busy = signal<string | null>(null);
  private readonly version = signal(0);

  protected readonly state = toSignal(
    toObservable(this.version).pipe(
      switchMap(() =>
        toLoadState(
          this.membersApi
            .fines(this.auth.session()?.memberId ?? '')
            .pipe(map((page) => page.items)),
        ),
      ),
    ),
    { initialValue: { status: 'loading' as const } },
  );

  protected readonly outstanding = computed(() => {
    const current = this.state();

    return current.status === 'loaded' ? unpaidTotal(current.value) : 0;
  });

  protected readonly currency = computed(() => {
    const current = this.state();

    return current.status === 'loaded' ? (current.value[0]?.currency ?? '') : '';
  });

  protected pay(fine: Fine): void {
    this.busy.set(fine.id);
    this.finesApi.pay(fine.id).subscribe({
      next: (paid) => {
        this.busy.set(null);
        this.notifier.success(
          this.i18n.t('Paid! Reference {reference}.', { reference: paid.paymentReference ?? '' }),
        );
        this.version.update((value) => value + 1);
      },
      error: (error: unknown) => {
        this.busy.set(null);
        this.notifier.error(error);
      },
    });
  }
}
