import { Loan } from '../../core/api/models';

export type LoanTone = 'ok' | 'soon' | 'late' | 'done';

export interface LoanProgress {
  percent: number;
  label: string;
  count: number;
  tone: LoanTone;
}

const DAY_IN_MS = 86_400_000;

function calendarDay(time: number): number {
  const date = new Date(time);

  return Math.round(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / DAY_IN_MS);
}

export function loanProgress(loan: Loan, now: number = Date.now()): LoanProgress {
  if (loan.status === 'Returned' || loan.status === 'Expired') {
    return { percent: 100, label: loan.status, count: 0, tone: 'done' };
  }

  const start = Date.parse(loan.loanDate);
  const due = Date.parse(loan.dueDate);
  const daysLeft = calendarDay(due) - calendarDay(now);
  const percent = Math.min(100, Math.max(0, ((now - start) / Math.max(due - start, 1)) * 100));

  if (loan.status === 'Overdue' || daysLeft < 0) {
    const late = Math.max(1, -daysLeft);
    const label = late === 1 ? '{count} day overdue' : '{count} days overdue';

    return { percent: 100, label, count: late, tone: 'late' };
  }

  if (daysLeft === 0) {
    return { percent, label: 'Due today', count: 0, tone: 'soon' };
  }

  return {
    percent,
    label: daysLeft === 1 ? '{count} day left' : '{count} days left',
    count: daysLeft,
    tone: daysLeft <= 2 ? 'soon' : 'ok',
  };
}
