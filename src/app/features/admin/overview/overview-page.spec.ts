import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { text } from '../../../../testing/dom';
import { aPage } from '../../../../testing/test-data';
import { BlacklistApi } from '../../../core/api/blacklist-api';
import { BooksApi } from '../../../core/api/books-api';
import { MembersApi } from '../../../core/api/members-api';
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

describe('OverviewPage', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: BooksApi, useValue: { list: () => of({ ...aPage([]), totalItems: 14 }) } },
        { provide: MembersApi, useValue: { list: () => throwError(() => new Error('down')) } },
        { provide: BlacklistApi, useValue: { list: () => of({ ...aPage([]), totalItems: 3 }) } },
        {
          provide: ReportsApi,
          useValue: {
            overdueByMonth: () => of(months),
            mostBorrowedBooks: () =>
              of([
                { rank: 1, bookId: 'b1', title: 'Dune', author: 'Frank Herbert', totalLoans: 8 },
              ]),
          },
        },
      ],
    });
  });

  it('summarizes the library and keeps working when one number is missing', async () => {
    const fixture = TestBed.createComponent(OverviewPage);
    await fixture.whenStable();
    const content = text(fixture);

    expect(content).toContain('14');
    expect(content).toContain('—');
    expect(content).toContain('2 overdue · 25%');
    expect(content).toContain('Dune');
  });

  it('adds up the loans of the year', () => {
    expect(yearTotals(months)).toEqual({ loans: 8, overdue: 2, rate: 25 });
    expect(yearTotals([])).toEqual({ loans: 0, overdue: 0, rate: 0 });
  });
});
