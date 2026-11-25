import { Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { catchError, of } from 'rxjs';
import { MembersApi } from '../../core/api/members-api';
import { Standing } from '../../core/api/models';
import { AuthService } from '../../core/auth/auth.service';
import { LocalNumberPipe, TranslatePipe } from '../../core/i18n/pipes';

interface AccountLink {
  path: string;
  label: string;
  icon: string;
}

@Component({
  selector: 'app-account-shell',
  imports: [
    LocalNumberPipe,
    MatButtonModule,
    MatIconModule,
    RouterLink,
    RouterLinkActive,
    RouterOutlet,
    TranslatePipe,
  ],
  template: `
    <section class="page">
      <span class="eyebrow">{{ 'Your shelf' | t }}</span>
      <h1 class="page-title">{{ 'My library' | t }}</h1>
      <p class="page-subtitle">
        {{ 'Loans, waiting lists, fines, saved books and your reading year in one place.' | t }}
      </p>

      @if (standing(); as standing) {
        @if (!standing.canBorrow) {
          <div class="standing blocked" role="status">
            <mat-icon>block</mat-icon>
            <div>
              <strong>{{ 'Borrowing is paused on your account' | t }}</strong>
              @for (reason of standing.reasons; track reason) {
                <span>{{ reason | t }}</span>
              }
            </div>
            @if (standing.unpaidFines > 0) {
              <a mat-flat-button routerLink="fines">
                {{
                  'Pay {amount}'
                    | t
                      : {
                          amount:
                            standing.currency + ' ' + (standing.unpaidFines | localNumber: '1.2-2'),
                        }
                }}
              </a>
            }
          </div>
        } @else {
          <div class="standing" role="status">
            <mat-icon>verified</mat-icon>
            <span>{{
              'You can borrow: {active} of {max} loans in use.'
                | t: { active: standing.activeLoans, max: standing.maxActiveLoans }
            }}</span>
          </div>
        }
      }

      <nav class="tabs" [attr.aria-label]="'My library sections' | t">
        @for (link of links; track link.path) {
          <a [routerLink]="link.path" routerLinkActive="active" ariaCurrentWhenActive="page">
            <mat-icon>{{ link.icon }}</mat-icon>
            {{ link.label | t }}
          </a>
        }
      </nav>

      <router-outlet />
    </section>
  `,
  styles: `
    .standing {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 12px;
      padding: 14px 18px;
      margin-bottom: 24px;
      border-radius: var(--app-radius-small);
      background: var(--mat-sys-primary-container);
      color: var(--mat-sys-on-primary-container);
      font: var(--mat-sys-body-medium);

      div {
        flex: 1 1 260px;
        display: flex;
        flex-direction: column;
        gap: 2px;
      }

      &.blocked {
        background: var(--mat-sys-error-container);
        color: var(--mat-sys-on-error-container);
      }
    }

    .tabs {
      display: flex;
      gap: 6px;
      margin-bottom: 28px;
      padding: 4px;
      border-radius: 999px;
      background: var(--mat-sys-surface-container);
      overflow-x: auto;
      scrollbar-width: none;

      a {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        flex-shrink: 0;
        padding: 9px 16px;
        border-radius: 999px;
        font: var(--mat-sys-label-large);
        text-decoration: none;
        color: var(--mat-sys-on-surface-variant);

        mat-icon {
          font-size: 19px;
          width: 19px;
          height: 19px;
        }

        &.active {
          background: var(--mat-sys-surface);
          color: var(--mat-sys-on-surface);
          box-shadow: var(--app-shadow);
        }
      }
    }
  `,
})
export class AccountShell {
  private readonly membersApi = inject(MembersApi);
  private readonly auth = inject(AuthService);

  protected readonly links: AccountLink[] = [
    { path: 'loans', label: 'Loans', icon: 'bookmarks' },
    { path: 'reservations', label: 'Waiting list', icon: 'hourglass_top' },
    { path: 'fines', label: 'Fines', icon: 'receipt_long' },
    { path: 'wishlist', label: 'Wishlist', icon: 'favorite' },
    { path: 'stats', label: 'Reading stats', icon: 'insights' },
  ];

  protected readonly standing = toSignal(
    this.membersApi
      .standing(this.auth.session()?.memberId ?? '')
      .pipe(catchError(() => of<Standing | null>(null))),
    { initialValue: null },
  );
}
