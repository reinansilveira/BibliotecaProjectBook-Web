import { DatePipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatTableModule } from '@angular/material/table';
import { switchMap } from 'rxjs';
import { BlacklistApi } from '../../../core/api/blacklist-api';
import { BlacklistEntry } from '../../../core/api/models';
import { toLoadState } from '../../../core/http/load-state';
import { Notifier } from '../../../core/notifications/notifier';
import { EmptyState } from '../../../shared/empty-state';
import { initials } from '../../../shared/initials';

const PAGE_SIZE = 10;

@Component({
  selector: 'app-blacklist-page',
  imports: [
    DatePipe,
    EmptyState,
    MatButtonModule,
    MatIconModule,
    MatPaginatorModule,
    MatTableModule,
  ],
  templateUrl: './blacklist-page.html',
})
export class BlacklistPage {
  private readonly blacklistApi = inject(BlacklistApi);
  private readonly notifier = inject(Notifier);

  protected readonly pageSize = PAGE_SIZE;
  protected readonly columns = ['memberName', 'addedAt', 'actions'];
  protected readonly skeletonRows = [1, 2, 3];
  protected readonly initialsOf = initials;
  protected readonly page = signal(1);
  protected readonly checking = signal(false);
  private readonly version = signal(0);
  private readonly query = computed(() => ({ page: this.page(), version: this.version() }));

  protected readonly state = toSignal(
    toObservable(this.query).pipe(
      switchMap((query) => toLoadState(this.blacklistApi.list(query.page, PAGE_SIZE))),
    ),
    { initialValue: { status: 'loading' as const } },
  );

  protected changePage(event: PageEvent): void {
    this.page.set(event.pageIndex + 1);
  }

  protected runCheck(): void {
    this.checking.set(true);
    this.blacklistApi.refresh().subscribe({
      next: (added) => {
        this.checking.set(false);
        this.notifier.success(
          added === 0 ? 'No new overdue members.' : `${added} member(s) added to the blacklist.`,
        );
        this.reload();
      },
      error: (error: unknown) => {
        this.checking.set(false);
        this.notifier.error(error);
      },
    });
  }

  protected remove(entry: BlacklistEntry): void {
    this.blacklistApi.remove(entry.memberId).subscribe({
      next: () => {
        this.notifier.success(`${entry.memberName} can borrow books again.`);
        this.reload();
      },
      error: (error: unknown) => this.notifier.error(error),
    });
  }

  private reload(): void {
    this.version.update((version) => version + 1);
  }
}
