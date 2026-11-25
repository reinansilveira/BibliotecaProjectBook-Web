import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { buttonWithText, text } from '../../../testing/dom';
import { aLoan, aPage } from '../../../testing/test-data';
import { LoansApi } from '../../core/api/loans-api';
import { MembersApi } from '../../core/api/members-api';
import { Loan } from '../../core/api/models';
import { AuthService } from '../../core/auth/auth.service';
import { Notifier } from '../../core/notifications/notifier';
import { canRenew, LoansPage, toShelf } from './loans-page';

describe('LoansPage', () => {
  const loansApi = { renew: vi.fn(), return: vi.fn() };
  const notifier = { success: vi.fn(), error: vi.fn() };

  function setup(loans: Loan[]) {
    const membersApi = { loans: vi.fn().mockReturnValue(of(aPage(loans))) };
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: MembersApi, useValue: membersApi },
        { provide: LoansApi, useValue: loansApi },
        { provide: Notifier, useValue: notifier },
        { provide: AuthService, useValue: { session: signal({ memberId: 'member-1' }) } },
      ],
    });

    return membersApi;
  }

  async function render() {
    const fixture = TestBed.createComponent(LoansPage);
    await fixture.whenStable();

    return fixture;
  }

  it('lists the current loans and the history of the signed-in member', async () => {
    const membersApi = setup([
      aLoan({ status: 'Overdue' }),
      aLoan({ id: 'loan-2', status: 'Returned', returnedAt: '2026-02-01T00:00:00Z' }),
    ]);
    const fixture = await render();
    const element = fixture.nativeElement as HTMLElement;

    expect(membersApi.loans).toHaveBeenCalledWith('member-1', 1, 50);
    expect(text(fixture)).toContain('Dune');
    expect(text(fixture)).toContain('Overdue');
    expect(element.querySelectorAll('.loan')).toHaveLength(1);
    expect(element.querySelectorAll('.history-item')).toHaveLength(1);
  });

  it('invites new members to browse the catalog', async () => {
    setup([]);
    const fixture = await render();

    expect(text(fixture)).toContain('No loans yet');
  });

  it('renews a printed loan', async () => {
    setup([aLoan()]);
    loansApi.renew.mockReturnValue(of(aLoan({ dueDate: '2026-03-15T12:00:00Z' })));
    const fixture = await render();

    buttonWithText(fixture, 'Renew for 7 more days').click();

    expect(loansApi.renew).toHaveBeenCalledWith('loan-1');
    expect(notifier.success).toHaveBeenCalled();
  });

  it('opens and returns e-books', async () => {
    setup([aLoan({ format: 'Ebook', readingProgress: 30 })]);
    loansApi.return.mockReturnValue(of(aLoan({ format: 'Ebook', status: 'Returned' })));
    const fixture = await render();
    const element = fixture.nativeElement as HTMLElement;

    expect(element.querySelector('a[href="/read/loan-1"]')?.textContent).toContain(
      'Continue reading',
    );

    buttonWithText(fixture, 'Return early').click();

    expect(loansApi.return).toHaveBeenCalledWith('loan-1');
  });

  it('puts the loans due first on top and counts the overdue ones', () => {
    const shelf = toShelf(
      aPage([
        aLoan({ id: 'later', dueDate: '2026-03-20T00:00:00Z' }),
        aLoan({ id: 'late', status: 'Overdue' }),
        aLoan({ id: 'done', status: 'Returned' }),
        aLoan({ id: 'expired', status: 'Expired', format: 'Ebook' }),
      ]),
      Date.parse('2026-03-10T00:00:00Z'),
    );

    expect(shelf.reading.map((loan) => loan.id)).toEqual(['late', 'later']);
    expect(shelf.history.map((loan) => loan.id)).toEqual(['done', 'expired']);
    expect(shelf.overdue).toBe(1);
  });

  it('only renews active printed loans that still have renewals', () => {
    expect(canRenew(aLoan())).toBe(true);
    expect(canRenew(aLoan({ renewalsLeft: 0 }))).toBe(false);
    expect(canRenew(aLoan({ format: 'Ebook' }))).toBe(false);
    expect(canRenew(aLoan({ status: 'Overdue' }))).toBe(false);
  });
});
