import { Component, computed, inject, signal } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatTableModule } from '@angular/material/table';
import { switchMap } from 'rxjs';
import { FinesApi } from '../../../core/api/library-api';
import { Fine, FineStatus } from '../../../core/api/models';
import { toLoadState } from '../../../core/http/load-state';
import { I18n } from '../../../core/i18n/i18n.service';
import { provideLocalizedPaginator } from '../../../core/i18n/paginator-intl';
import { LocalDatePipe, LocalNumberPipe, TranslatePipe } from '../../../core/i18n/pipes';
import { Notifier } from '../../../core/notifications/notifier';
import { EmptyState } from '../../../shared/empty-state';
import { initials } from '../../../shared/initials';
import { LoanStatusChip } from '../../../shared/loan-status-chip';

const PAGE_SIZE = 10;

@Component({
  selector: 'app-admin-fines-page',
  imports: [
    EmptyState,
    LoanStatusChip,
    LocalDatePipe,
    LocalNumberPipe,
    MatButtonModule,
    MatIconModule,
    MatPaginatorModule,
    MatTableModule,
    TranslatePipe,
  ],
  providers: [provideLocalizedPaginator()],
  template: `
    <div class="banner surface">
      <span class="banner-icon"><mat-icon>receipt_long</mat-icon></span>
      <p class="hint">
        {{
          'Fines are issued automatically when a printed book comes back late. Members with unpaid fines cannot borrow.'
            | t
        }}
      </p>
      <div class="filters" role="group" [attr.aria-label]="'Status' | t">
        @for (option of statuses; track option.label) {
          <button
            type="button"
            class="filter"
            [class.selected]="status() === option.value"
            [attr.aria-pressed]="status() === option.value"
            (click)="filter(option.value)"
          >
            {{ option.label | t }}
          </button>
        }
      </div>
    </div>

    @if (state(); as current) {
      @switch (current.status) {
        @case ('loading') {
          <div class="surface table-skeleton" aria-busy="true" [attr.aria-label]="'Loading' | t">
            @for (row of [1, 2, 3, 4]; track row) {
              <span class="skeleton row-skeleton"></span>
            }
          </div>
        }
        @case ('error') {
          <app-empty-state icon="cloud_off" [title]="'We could not load the fines' | t">{{
            current.message | t
          }}</app-empty-state>
        }
        @case ('loaded') {
          @if (current.value.items.length === 0) {
            <app-empty-state icon="verified" [title]="'No fines here' | t">{{
              'Every member is up to date with their returns.' | t
            }}</app-empty-state>
          } @else {
            <div class="surface table-wrapper">
              <table mat-table class="data-table" [dataSource]="current.value.items">
                <ng-container matColumnDef="member">
                  <th mat-header-cell *matHeaderCellDef>{{ 'Member' | t }}</th>
                  <td mat-cell *matCellDef="let fine">
                    <span class="cell-with-media">
                      <span class="avatar">{{ initialsOf(fine.memberName) }}</span>
                      <span class="cell-stack">
                        <strong>{{ fine.memberName }}</strong>
                        <small>{{ fine.bookTitle }}</small>
                      </span>
                    </span>
                  </td>
                </ng-container>
                <ng-container matColumnDef="days">
                  <th mat-header-cell *matHeaderCellDef class="hide-mobile">
                    {{ 'Days late' | t }}
                  </th>
                  <td mat-cell *matCellDef="let fine" class="hide-mobile">
                    {{ fine.daysOverdue }}
                  </td>
                </ng-container>
                <ng-container matColumnDef="amount">
                  <th mat-header-cell *matHeaderCellDef>{{ 'Amount' | t }}</th>
                  <td mat-cell *matCellDef="let fine">
                    <strong>{{ fine.currency }} {{ fine.amount | localNumber: '1.2-2' }}</strong>
                  </td>
                </ng-container>
                <ng-container matColumnDef="issued">
                  <th mat-header-cell *matHeaderCellDef class="hide-mobile">
                    {{ 'Issued' | t }}
                  </th>
                  <td mat-cell *matCellDef="let fine" class="hide-mobile">
                    {{ fine.issuedAt | localDate }}
                  </td>
                </ng-container>
                <ng-container matColumnDef="status">
                  <th mat-header-cell *matHeaderCellDef>{{ 'Status' | t }}</th>
                  <td mat-cell *matCellDef="let fine">
                    <app-loan-status-chip [status]="fine.status" />
                  </td>
                </ng-container>
                <ng-container matColumnDef="actions">
                  <th mat-header-cell *matHeaderCellDef>
                    <span class="cdk-visually-hidden">{{ 'Actions' | t }}</span>
                  </th>
                  <td mat-cell *matCellDef="let fine" class="actions-cell">
                    @if (fine.status === 'Unpaid') {
                      <button
                        mat-stroked-button
                        type="button"
                        [disabled]="busy() === fine.id"
                        (click)="waive(fine)"
                      >
                        {{ 'Waive' | t }}
                      </button>
                    }
                  </td>
                </ng-container>
                <tr mat-header-row *matHeaderRowDef="columns"></tr>
                <tr mat-row *matRowDef="let row; columns: columns"></tr>
              </table>
              <mat-paginator
                [length]="current.value.totalItems"
                [pageIndex]="current.value.page - 1"
                [pageSize]="pageSize"
                [hidePageSize]="true"
                (page)="changePage($event)"
                [attr.aria-label]="'Fine pages' | t"
              />
            </div>
          }
        }
      }
    }
  `,
  styles: `
    .filters {
      display: flex;
      gap: 4px;
      padding: 4px;
      border-radius: 999px;
      background: var(--mat-sys-surface-container);
    }

    .filter {
      padding: 6px 12px;
      border: none;
      border-radius: 999px;
      background: transparent;
      color: var(--mat-sys-on-surface-variant);
      font: var(--mat-sys-label-large);
      cursor: pointer;

      &.selected {
        background: var(--mat-sys-surface);
        color: var(--mat-sys-on-surface);
        box-shadow: var(--app-shadow);
      }
    }
  `,
})
export class AdminFinesPage {
  private readonly finesApi = inject(FinesApi);
  private readonly notifier = inject(Notifier);
  private readonly i18n = inject(I18n);

  protected readonly pageSize = PAGE_SIZE;
  protected readonly columns = ['member', 'days', 'amount', 'issued', 'status', 'actions'];
  protected readonly initialsOf = initials;
  protected readonly statuses: { value: FineStatus | null; label: string }[] = [
    { value: 'Unpaid', label: 'Unpaid' },
    { value: 'Paid', label: 'Paid' },
    { value: 'Waived', label: 'Waived' },
    { value: null, label: 'All' },
  ];
  protected readonly status = signal<FineStatus | null>('Unpaid');
  protected readonly page = signal(1);
  protected readonly busy = signal<string | null>(null);
  private readonly version = signal(0);
  private readonly query = computed(() => ({
    status: this.status(),
    page: this.page(),
    version: this.version(),
  }));

  protected readonly state = toSignal(
    toObservable(this.query).pipe(
      switchMap((query) => toLoadState(this.finesApi.list(query.status, query.page, PAGE_SIZE))),
    ),
    { initialValue: { status: 'loading' as const } },
  );

  protected filter(status: FineStatus | null): void {
    this.status.set(status);
    this.page.set(1);
  }

  protected changePage(event: PageEvent): void {
    this.page.set(event.pageIndex + 1);
  }

  protected waive(fine: Fine): void {
    this.busy.set(fine.id);
    this.finesApi.waive(fine.id).subscribe({
      next: () => {
        this.busy.set(null);
        this.notifier.success(
          this.i18n.t('The fine of {name} was waived.', { name: fine.memberName }),
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
