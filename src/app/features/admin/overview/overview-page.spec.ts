import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { buttonWithText, text } from '../../../../testing/dom';
import { Dashboard } from '../../../core/api/models';
import { ReportsApi } from '../../../core/api/reports-api';
import { yearTotals } from '../shared/year-totals';
import { OverviewPage } from './overview-page';

const months = Array.from({ length: 12 }, (_, index) => ({
  month: index + 1,
  totalLoans: index === 0 ? 8 : 0,
  overdueLoans: index === 0 ? 2 : 0,
  overduePercentage: index === 0 ? 25 : 0,
  averageDaysOverdue: 0,
}));

const dashboard: Dashboard = {
  books: 18,
  copies: 32,
  ebooks: 6,
  members: 40,
  newMembersThisMonth: 3,
  activeLoans: 7,
  activeEbookLoans: 2,
  overdueLoans: 1,
  loansToday: 2,
  returnsToday: 1,
  waitingReservations: 4,
  readyReservations: 1,
  unpaidFines: 2,
  unpaidFinesAmount: 5.5,
  topBooksThisMonth: [
    { rank: 1, bookId: 'b1', title: 'Dune', author: 'Frank Herbert', totalLoans: 8 },
  ],
};

describe('OverviewPage', () => {
  const runMaintenance = vi.fn();

  beforeEach(() => {
    runMaintenance.mockReset();
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        {
          provide: ReportsApi,
          useValue: {
            dashboard: () => of(dashboard),
            overdueByMonth: () => of(months),
            runMaintenance,
          },
        },
      ],
    });
  });

  it('summarizes the library from the dashboard report', async () => {
    const fixture = TestBed.createComponent(OverviewPage);
    await fixture.whenStable();
    const content = text(fixture);

    expect(content).toContain('32 copies · 6 e-books');
    expect(content).toContain('3 new this month');
    expect(content).toContain('5.50 outstanding');
    expect(content).toContain('Dune');
  });

  it('runs the maintenance job and shows what it did', async () => {
    runMaintenance.mockReturnValue(
      of({
        expiredEbookLoans: 1,
        expiredHolds: 2,
        promotedReservations: 3,
        dueSoonReminders: 4,
        overdueNotices: 5,
      }),
    );
    const fixture = TestBed.createComponent(OverviewPage);
    await fixture.whenStable();

    buttonWithText(fixture, 'Run maintenance').click();
    await fixture.whenStable();

    expect(text(fixture)).toContain('1 e-books expired, 2 holds expired, 3 promoted');
  });

  it('adds up the loans of the year', () => {
    expect(yearTotals(months)).toEqual({ loans: 8, overdue: 2, rate: 25 });
    expect(yearTotals([])).toEqual({ loans: 0, overdue: 0, rate: 0 });
  });
});
