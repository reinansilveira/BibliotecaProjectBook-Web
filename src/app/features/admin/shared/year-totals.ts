import { MonthlyOverdue } from '../../../core/api/models';

export interface YearTotals {
  loans: number;
  overdue: number;
  rate: number;
}

export function yearTotals(months: MonthlyOverdue[]): YearTotals {
  const loans = months.reduce((total, month) => total + month.totalLoans, 0);
  const overdue = months.reduce((total, month) => total + month.overdueLoans, 0);

  return { loans, overdue, rate: loans === 0 ? 0 : (overdue / loans) * 100 };
}
