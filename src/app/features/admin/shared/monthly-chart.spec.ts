import { TestBed } from '@angular/core/testing';
import { chartScale, MonthlyChart } from './monthly-chart';

describe('MonthlyChart', () => {
  it('rounds the scale up to friendly numbers', () => {
    expect(chartScale(4)).toEqual({ max: 4, ticks: [0, 1, 2, 3, 4] });
    expect(chartScale(0)).toEqual({ max: 1, ticks: [0, 1] });
    expect(chartScale(37)).toEqual({ max: 40, ticks: [0, 10, 20, 30, 40] });
    expect(chartScale(130).max).toBe(150);
  });

  it('draws the monthly bars relative to the scale', async () => {
    const fixture = TestBed.createComponent(MonthlyChart);
    fixture.componentRef.setInput(
      'months',
      Array.from({ length: 12 }, (_, index) => ({
        month: index + 1,
        totalLoans: index === 2 ? 4 : 0,
        overdueLoans: index === 2 ? 1 : 0,
        overduePercentage: index === 2 ? 25 : 0,
        averageDaysOverdue: 0,
      })),
    );
    await fixture.whenStable();
    const element = fixture.nativeElement as HTMLElement;
    const bars = element.querySelectorAll<HTMLElement>('.bar.total');

    expect(bars).toHaveLength(12);
    expect(bars[2].style.height).toBe('100%');
    expect(bars[0].style.height).toBe('0%');
    expect(element.querySelectorAll<HTMLElement>('.bar.overdue')[2].style.height).toBe('25%');
    expect(element.querySelectorAll('.column')[2].getAttribute('aria-label')).toBe(
      'Mar: 4 loans, 1 overdue',
    );
  });
});
