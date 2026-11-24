import { aLoan } from '../../../testing/test-data';
import { days, loanProgress } from './loan-progress';

describe('loanProgress', () => {
  const loan = aLoan({ loanDate: '2026-03-01T12:00:00Z', dueDate: '2026-03-08T12:00:00Z' });

  it('counts the days left and how much of the loan has passed', () => {
    const progress = loanProgress(loan, Date.parse('2026-03-04T12:00:00Z'));

    expect(progress.label).toBe('4 days left');
    expect(progress.tone).toBe('ok');
    expect(progress.percent).toBeCloseTo(42.86, 1);
  });

  it('warns when the return date is close', () => {
    expect(loanProgress(loan, Date.parse('2026-03-07T12:00:00Z'))).toMatchObject({
      label: '1 day left',
      tone: 'soon',
    });
    expect(loanProgress(loan, Date.parse('2026-03-08T12:00:00Z')).label).toBe('Due today');
  });

  it('counts the days overdue', () => {
    const progress = loanProgress(
      aLoan({ ...loan, status: 'Overdue' }),
      Date.parse('2026-03-10T12:00:00Z'),
    );

    expect(progress).toEqual({ percent: 100, label: '2 days overdue', tone: 'late' });
  });

  it('marks returned loans as done', () => {
    expect(loanProgress(aLoan({ status: 'Returned' })).tone).toBe('done');
  });

  it('writes singular and plural days', () => {
    expect(days(1)).toBe('1 day');
    expect(days(3)).toBe('3 days');
  });
});
