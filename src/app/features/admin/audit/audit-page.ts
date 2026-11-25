import { Component, computed, inject, signal } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatSelectModule } from '@angular/material/select';
import { switchMap } from 'rxjs';
import { AuditApi } from '../../../core/api/library-api';
import { AuditEntry, AuditQuery } from '../../../core/api/models';
import { toLoadState } from '../../../core/http/load-state';
import { provideLocalizedPaginator } from '../../../core/i18n/paginator-intl';
import { LocalDatePipe, TranslatePipe } from '../../../core/i18n/pipes';
import { EmptyState } from '../../../shared/empty-state';

const PAGE_SIZE = 15;

export interface AuditChange {
  field: string;
  value: string;
}

export function auditChanges(entry: AuditEntry): AuditChange[] {
  if (!entry.changes) {
    return [];
  }

  try {
    const parsed = JSON.parse(entry.changes) as Record<string, unknown>;

    return Object.entries(parsed).map(([field, value]) => ({
      field,
      value: typeof value === 'string' ? value : JSON.stringify(value),
    }));
  } catch {
    return [{ field: '', value: entry.changes }];
  }
}

@Component({
  selector: 'app-audit-page',
  imports: [
    EmptyState,
    LocalDatePipe,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatPaginatorModule,
    MatSelectModule,
    TranslatePipe,
  ],
  providers: [provideLocalizedPaginator()],
  template: `
    <form
      class="toolbar-row filters surface"
      (submit)="$event.preventDefault(); apply(entity.value, from.value, to.value)"
    >
      <mat-form-field appearance="outline" subscriptSizing="dynamic">
        <mat-label>{{ 'Entity' | t }}</mat-label>
        <mat-select #entity [value]="query().entityType ?? ''">
          <mat-option value="">{{ 'All' | t }}</mat-option>
          @for (type of entityTypes; track type) {
            <mat-option [value]="type">{{ type }}</mat-option>
          }
        </mat-select>
      </mat-form-field>
      <mat-form-field appearance="outline" subscriptSizing="dynamic">
        <mat-label>{{ 'From' | t }}</mat-label>
        <input matInput #from type="date" />
      </mat-form-field>
      <mat-form-field appearance="outline" subscriptSizing="dynamic">
        <mat-label>{{ 'To' | t }}</mat-label>
        <input matInput #to type="date" />
      </mat-form-field>
      <button mat-flat-button type="submit">{{ 'Apply' | t }}</button>
    </form>

    @if (state(); as current) {
      @switch (current.status) {
        @case ('loading') {
          <div class="surface table-skeleton" aria-busy="true" [attr.aria-label]="'Loading' | t">
            @for (row of [1, 2, 3, 4, 5]; track row) {
              <span class="skeleton row-skeleton"></span>
            }
          </div>
        }
        @case ('error') {
          <app-empty-state icon="cloud_off" [title]="'We could not load the audit log' | t">{{
            current.message | t
          }}</app-empty-state>
        }
        @case ('loaded') {
          @if (current.value.items.length === 0) {
            <app-empty-state icon="history" [title]="'Nothing recorded' | t">{{
              'Try another entity or period.' | t
            }}</app-empty-state>
          } @else {
            <ol class="timeline surface">
              @for (entry of current.value.items; track entry.id) {
                <li>
                  <button
                    type="button"
                    class="entry"
                    [attr.aria-expanded]="expanded() === entry.id"
                    (click)="toggle(entry.id)"
                  >
                    <span class="action">{{ entry.action }}</span>
                    <span class="who">
                      <mat-icon>{{
                        entry.actorName === 'system' ? 'smart_toy' : 'person'
                      }}</mat-icon>
                      {{ entry.actorName ?? ('Unknown' | t) }}
                    </span>
                    <time>{{ entry.occurredAt | localDate: 'medium' }}</time>
                    <mat-icon class="chevron">{{
                      expanded() === entry.id ? 'expand_less' : 'expand_more'
                    }}</mat-icon>
                  </button>
                  @if (expanded() === entry.id) {
                    <dl class="changes">
                      <div>
                        <dt>{{ 'Entity' | t }}</dt>
                        <dd>{{ entry.entityType }} · {{ entry.entityId }}</dd>
                      </div>
                      @for (change of changesOf(entry); track change.field) {
                        <div>
                          <dt>{{ change.field }}</dt>
                          <dd>{{ change.value }}</dd>
                        </div>
                      }
                    </dl>
                  }
                </li>
              }
            </ol>
            <mat-paginator
              [length]="current.value.totalItems"
              [pageIndex]="current.value.page - 1"
              [pageSize]="pageSize"
              [hidePageSize]="true"
              (page)="changePage($event)"
              [attr.aria-label]="'Audit pages' | t"
            />
          }
        }
      }
    }
  `,
  styles: `
    .filters {
      padding: 14px 16px;

      mat-form-field {
        width: 180px;
      }
    }

    .timeline {
      margin: 0;
      padding: 4px 0;
      list-style: none;

      li + li {
        border-top: 1px solid var(--mat-sys-outline-variant);
      }
    }

    .entry {
      display: grid;
      grid-template-columns: minmax(0, 1.4fr) minmax(0, 1fr) auto auto;
      align-items: center;
      gap: 12px;
      width: 100%;
      padding: 12px 20px;
      border: none;
      background: transparent;
      color: var(--mat-sys-on-surface);
      text-align: left;
      cursor: pointer;

      &:hover {
        background: var(--mat-sys-surface-container-low);
      }
    }

    .action {
      font: var(--mat-sys-label-large);
      font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .who {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      color: var(--mat-sys-on-surface-variant);

      mat-icon {
        font-size: 18px;
        width: 18px;
        height: 18px;
      }
    }

    time {
      font: var(--mat-sys-body-small);
      color: var(--mat-sys-on-surface-variant);
    }

    .chevron {
      color: var(--mat-sys-on-surface-variant);
    }

    .changes {
      display: grid;
      gap: 6px;
      margin: 0 20px 14px;
      padding: 12px 14px;
      border-radius: var(--app-radius-small);
      background: var(--mat-sys-surface-container-low);
      font: var(--mat-sys-body-small);

      div {
        display: grid;
        grid-template-columns: 140px 1fr;
        gap: 12px;
      }

      dt {
        color: var(--mat-sys-on-surface-variant);
      }

      dd {
        margin: 0;
        font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
        word-break: break-all;
      }
    }

    @media (max-width: 760px) {
      .entry {
        grid-template-columns: 1fr auto;
      }

      .who,
      time {
        grid-column: 1;
      }

      .changes div {
        grid-template-columns: 1fr;
        gap: 0;
      }
    }
  `,
})
export class AuditPage {
  private readonly auditApi = inject(AuditApi);

  protected readonly pageSize = PAGE_SIZE;
  protected readonly entityTypes = [
    'Book',
    'BookCopy',
    'Ebook',
    'Loan',
    'Member',
    'Reservation',
    'Review',
    'Fine',
  ];
  protected readonly query = signal<AuditQuery>({ page: 1, pageSize: PAGE_SIZE });
  protected readonly expanded = signal<string | null>(null);
  protected readonly changesOf = auditChanges;

  private readonly request = computed(() => this.query());

  protected readonly state = toSignal(
    toObservable(this.request).pipe(switchMap((query) => toLoadState(this.auditApi.list(query)))),
    { initialValue: { status: 'loading' as const } },
  );

  protected apply(entityType: string, from: string, to: string): void {
    this.query.set({
      page: 1,
      pageSize: PAGE_SIZE,
      entityType: entityType || undefined,
      from: from || undefined,
      to: to || undefined,
    });
  }

  protected changePage(event: PageEvent): void {
    this.query.update((query) => ({ ...query, page: event.pageIndex + 1 }));
  }

  protected toggle(id: string): void {
    this.expanded.update((current) => (current === id ? null : id));
  }
}
