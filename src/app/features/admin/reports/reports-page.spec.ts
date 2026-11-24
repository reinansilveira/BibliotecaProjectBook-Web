import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { buttonWithText, text } from '../../../../testing/dom';
import { ReportsApi } from '../../../core/api/reports-api';
import { ReportsPage, summarize } from './reports-page';

describe('ReportsPage', () => {
  const months = Array.from({ length: 12 }, (_, index) => ({
    month: index + 1,
    totalLoans: index === 2 ? 4 : 0,
    overdueLoans: index === 2 ? 1 : 0,
    overduePercentage: index === 2 ? 25 : 0,
    averageDaysOverdue: index === 2 ? 3 : 0,
  }));
  const overdueByMonth = vi.fn();

  beforeEach(() => {
    overdueByMonth.mockReset().mockReturnValue(of(months));
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        {
          provide: ReportsApi,
          useValue: {
            overdueByMonth,
            mostBorrowedBooks: vi
              .fn()
              .mockReturnValue(
                of([
                  { rank: 1, bookId: 'b1', title: 'Dune', author: 'Frank Herbert', totalLoans: 4 },
                ]),
              ),
          },
        },
      ],
    });
  });

  it('summarizes the year and draws the monthly chart', async () => {
    const fixture = TestBed.createComponent(ReportsPage);
    await fixture.whenStable();
    const element = fixture.nativeElement as HTMLElement;

    expect(element.querySelectorAll('.bar.total')).toHaveLength(12);
    expect(text(fixture)).toContain('25%');
  });

  it('loads another year', async () => {
    const fixture = TestBed.createComponent(ReportsPage);
    await fixture.whenStable();
    const previousYear = String(new Date().getFullYear() - 1);

    buttonWithText(fixture, previousYear).click();
    await fixture.whenStable();

    expect(overdueByMonth).toHaveBeenLastCalledWith(Number(previousYear));
  });

  it('shows the most borrowed books ranking', async () => {
    const fixture = TestBed.createComponent(ReportsPage);
    await fixture.whenStable();

    expect(text(fixture)).toContain('Dune');
    expect(text(fixture)).toContain('Frank Herbert');
  });

  it('weights the average delay by the overdue loans', () => {
    const summary = summarize([
      { ...months[0], totalLoans: 2, overdueLoans: 1, averageDaysOverdue: 2 },
      { ...months[1], totalLoans: 6, overdueLoans: 3, averageDaysOverdue: 6 },
    ]);

    expect(summary).toEqual({ loans: 8, overdue: 4, rate: 50, averageDaysLate: 5 });
    expect(summarize([]).averageDaysLate).toBe(0);
  });
});
