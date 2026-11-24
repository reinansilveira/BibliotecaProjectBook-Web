import { Loan } from '../../core/api/models';

export type LoanTone = 'ok' | 'soon' | 'late' | 'done';

export interface LoanProgress {
  percent: number;
  label: string;
  tone: LoanTone;
}

const DAY_IN_MS = 86_400_000;

function calendarDay(time: number): number {
  const date = new Date(time);

  return Math.round(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / DAY_IN_MS);
}

export function days(count: number): string {
  return `${count} ${count === 1 ? 'day' : 'days'}`;
}

export function loanProgress(loan: Loan, now: number = Date.now()): LoanProgress {
  if (loan.status === 'Returned') {
    return { percent: 100, label: 'Returned', tone: 'done' };
  }

  const start = Date.parse(loan.loanDate);
  const due = Date.parse(loan.dueDate);
  const daysLeft = calendarDay(due) - calendarDay(now);
  const percent = Math.min(100, Math.max(0, ((now - start) / Math.max(due - start, 1)) * 100));

  if (loan.status === 'Overdue' || daysLeft < 0) {
    return { percent: 100, label: `${days(Math.max(1, -daysLeft))} overdue`, tone: 'late' };
  }

  if (daysLeft === 0) {
    return { percent, label: 'Due today', tone: 'soon' };
  }

  return { percent, label: `${days(daysLeft)} left`, tone: daysLeft <= 2 ? 'soon' : 'ok' };
}
