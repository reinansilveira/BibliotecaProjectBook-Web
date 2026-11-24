import { TestBed } from '@angular/core/testing';
import { LoanStatusChip } from './loan-status-chip';

describe('LoanStatusChip', () => {
  it.each(['Active', 'Overdue', 'Returned'] as const)('styles the %s status', async (status) => {
    const fixture = TestBed.createComponent(LoanStatusChip);
    fixture.componentRef.setInput('status', status);
    await fixture.whenStable();

    const chip = (fixture.nativeElement as HTMLElement).querySelector('.chip');

    expect(chip?.textContent).toBe(status);
    expect(chip?.classList).toContain(status.toLowerCase());
  });
});
