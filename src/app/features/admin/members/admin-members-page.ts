import { DatePipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatTableModule } from '@angular/material/table';
import { switchMap } from 'rxjs';
import { MembersApi } from '../../../core/api/members-api';
import { Member, PageQuery } from '../../../core/api/models';
import { toLoadState } from '../../../core/http/load-state';
import { EmptyState } from '../../../shared/empty-state';
import { initials } from '../../../shared/initials';
import { MemberLoansDialog } from './member-loans-dialog';

const PAGE_SIZE = 10;

@Component({
  selector: 'app-admin-members-page',
  imports: [
    DatePipe,
    EmptyState,
    MatButtonModule,
    MatIconModule,
    MatPaginatorModule,
    MatTableModule,
  ],
  templateUrl: './admin-members-page.html',
})
export class AdminMembersPage {
  private readonly membersApi = inject(MembersApi);
  private readonly dialog = inject(MatDialog);

  protected readonly pageSize = PAGE_SIZE;
  protected readonly columns = ['name', 'role', 'createdAt', 'actions'];
  protected readonly skeletonRows = [1, 2, 3, 4, 5];
  protected readonly initialsOf = initials;
  protected readonly query = signal<PageQuery>({ page: 1, pageSize: PAGE_SIZE });

  protected readonly state = toSignal(
    toObservable(this.query).pipe(switchMap((query) => toLoadState(this.membersApi.list(query)))),
    { initialValue: { status: 'loading' as const } },
  );

  protected search(term: string): void {
    this.query.set({ page: 1, pageSize: PAGE_SIZE, search: term.trim() || undefined });
  }

  protected changePage(event: PageEvent): void {
    this.query.update((query) => ({ ...query, page: event.pageIndex + 1 }));
  }

  protected openLoans(member: Member): void {
    this.dialog.open(MemberLoansDialog, { data: member, width: '760px', maxWidth: '95vw' });
  }
}
