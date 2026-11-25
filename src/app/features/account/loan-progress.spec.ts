import { aLoan } from '../../../testing/test-data';
import { interpolate } from '../../core/i18n/i18n.service';
import { LoanProgress, loanProgress } from './loan-progress';

function describe_(progress: LoanProgress): string {
  return interpolate(progress.label, { count: progress.count });
}

describe('loanProgress', () => {
  const loan = aLoan({ loanDate: '2026-03-01T12:00:00Z', dueDate: '2026-03-08T12:00:00Z' });

  it('counts the days left and how much of the loan has passed', () => {
    const progress = loanProgress(loan, Date.parse('2026-03-04T12:00:00Z'));

    expect(describe_(progress)).toBe('4 days left');
    expect(progress.tone).toBe('ok');
    expect(progress.percent).toBeCloseTo(42.86, 1);
  });

  it('warns when the return date is close', () => {
    const tomorrow = loanProgress(loan, Date.parse('2026-03-07T12:00:00Z'));

    expect(describe_(tomorrow)).toBe('1 day left');
    expect(tomorrow.tone).toBe('soon');
    expect(describe_(loanProgress(loan, Date.parse('2026-03-08T12:00:00Z')))).toBe('Due today');
  });

  it('counts the days overdue', () => {
    const overdue = aLoan({ ...loan, status: 'Overdue' });

    expect(describe_(loanProgress(overdue, Date.parse('2026-03-10T12:00:00Z')))).toBe(
      '2 days overdue',
    );
    expect(describe_(loanProgress(overdue, Date.parse('2026-03-09T12:00:00Z')))).toBe(
      '1 day overdue',
    );
    expect(loanProgress(overdue).tone).toBe('late');
  });

  it('marks returned loans as done', () => {
    expect(loanProgress(aLoan({ status: 'Returned' })).tone).toBe('done');
  });
});
