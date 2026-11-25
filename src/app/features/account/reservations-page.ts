import { Component, inject, signal } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';
import { map, switchMap } from 'rxjs';
import { ReservationsApi } from '../../core/api/library-api';
import { LoansApi } from '../../core/api/loans-api';
import { MembersApi } from '../../core/api/members-api';
import { Reservation } from '../../core/api/models';
import { AuthService } from '../../core/auth/auth.service';
import { toLoadState } from '../../core/http/load-state';
import { I18n } from '../../core/i18n/i18n.service';
import { LocalDatePipe, TranslatePipe } from '../../core/i18n/pipes';
import { Notifier } from '../../core/notifications/notifier';
import { BookCover } from '../../shared/book-cover';
import { EmptyState } from '../../shared/empty-state';
import { LoanStatusChip } from '../../shared/loan-status-chip';

export function isOpenReservation(reservation: Reservation): boolean {
  return reservation.status === 'Waiting' || reservation.status === 'Ready';
}

@Component({
  selector: 'app-reservations-page',
  imports: [
    BookCover,
    EmptyState,
    LoanStatusChip,
    LocalDatePipe,
    MatButtonModule,
    MatIconModule,
    RouterLink,
    TranslatePipe,
  ],
  template: `
    @if (state(); as current) {
      @switch (current.status) {
        @case ('loading') {
          <span class="skeleton block-skeleton" [attr.aria-label]="'Loading' | t"></span>
        }
        @case ('error') {
          <app-empty-state icon="cloud_off" [title]="'We could not load your waiting list' | t">
            {{ current.message | t }}
          </app-empty-state>
        }
        @case ('loaded') {
          @if (current.value.length === 0) {
            <app-empty-state icon="hourglass_empty" [title]="'No waiting lists' | t">
              {{ 'When every copy is out, join the waiting list from the book page.' | t }}
              <a mat-stroked-button routerLink="/books">{{ 'Browse the catalog' | t }}</a>
            </app-empty-state>
          } @else {
            <ul class="list surface">
              @for (reservation of current.value; track reservation.id) {
                <li class="row" [class.ready]="reservation.status === 'Ready'">
                  <span class="thumb">
                    <app-book-cover
                      [title]="reservation.bookTitle"
                      [author]="reservation.bookAuthor"
                      [coverUrl]="reservation.coverUrl"
                      display="thumb"
                    />
                  </span>
                  <span class="cell-stack grow">
                    <a class="title" [routerLink]="['/books', reservation.bookId]">{{
                      reservation.bookTitle
                    }}</a>
                    <small>
                      {{ (reservation.format === 'Ebook' ? 'E-book' : 'Print') | t }} ·
                      {{ 'Joined {date}' | t: { date: reservation.createdAt | localDate } }}
                    </small>
                    @if (reservation.status === 'Waiting' && reservation.position) {
                      <span class="detail">{{
                        'Position {position} in line' | t: { position: reservation.position }
                      }}</span>
                    }
                    @if (reservation.status === 'Ready' && reservation.expiresAt) {
                      <span class="detail ready-text">{{
                        'Your copy is ready! Borrow it by {date}.'
                          | t: { date: reservation.expiresAt | localDate: 'medium' }
                      }}</span>
                    }
                  </span>
                  <app-loan-status-chip [status]="reservation.status" />
                  <span class="actions">
                    @if (reservation.status === 'Ready') {
                      <button
                        mat-flat-button
                        type="button"
                        [disabled]="busy() === reservation.id"
                        (click)="borrow(reservation)"
                      >
                        {{ 'Borrow now' | t }}
                      </button>
                    }
                    @if (isOpen(reservation)) {
                      <button
                        mat-button
                        type="button"
                        [disabled]="busy() === reservation.id"
                        (click)="cancel(reservation)"
                      >
                        {{ 'Leave the list' | t }}
                      </button>
                    }
                  </span>
                </li>
              }
            </ul>
          }
        }
      }
    }
  `,
  styles: `
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

      &.ready {
        background: color-mix(in srgb, var(--mat-sys-primary-container) 40%, transparent);
      }
    }

    .grow {
      flex: 1 1 220px;
    }

    .title {
      font-family: var(--app-serif);
      font-weight: 600;
      text-decoration: none;
    }

    .detail {
      font: var(--mat-sys-label-large);
      color: var(--mat-sys-tertiary);
    }

    .ready-text {
      color: var(--mat-sys-primary);
    }

    .actions {
      display: flex;
      gap: 8px;
    }

    .block-skeleton {
      height: 220px;
      border-radius: var(--app-radius);
    }
  `,
})
export class ReservationsPage {
  private readonly membersApi = inject(MembersApi);
  private readonly reservationsApi = inject(ReservationsApi);
  private readonly loansApi = inject(LoansApi);
  private readonly auth = inject(AuthService);
  private readonly notifier = inject(Notifier);
  private readonly i18n = inject(I18n);

  protected readonly busy = signal<string | null>(null);
  protected readonly isOpen = isOpenReservation;
  private readonly version = signal(0);

  protected readonly state = toSignal(
    toObservable(this.version).pipe(
      switchMap(() =>
        toLoadState(
          this.membersApi
            .reservations(this.auth.session()?.memberId ?? '')
            .pipe(map((page) => page.items)),
        ),
      ),
    ),
    { initialValue: { status: 'loading' as const } },
  );

  protected cancel(reservation: Reservation): void {
    this.busy.set(reservation.id);
    this.reservationsApi.cancel(reservation.id).subscribe({
      next: () => this.done(this.i18n.t('You left the waiting list.')),
      error: (error: unknown) => this.fail(error),
    });
  }

  protected borrow(reservation: Reservation): void {
    this.busy.set(reservation.id);
    this.loansApi.borrow(reservation.bookId, reservation.memberId, reservation.format).subscribe({
      next: () => this.done(this.i18n.t('Enjoy “{title}”!', { title: reservation.bookTitle })),
      error: (error: unknown) => this.fail(error),
    });
  }

  private done(message: string): void {
    this.busy.set(null);
    this.notifier.success(message);
    this.version.update((value) => value + 1);
  }

  private fail(error: unknown): void {
    this.busy.set(null);
    this.notifier.error(error);
  }
}
