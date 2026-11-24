import { Component, computed, input } from '@angular/core';
import { LoanStatus } from '../core/api/models';

@Component({
  selector: 'app-loan-status-chip',
  template: `<span class="chip" [class]="cssClass()">{{ status() }}</span>`,
  styles: `
    .chip {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 3px 10px 3px 8px;
      border-radius: 999px;
      font: var(--mat-sys-label-medium);
      white-space: nowrap;
    }

    .chip::before {
      content: '';
      width: 7px;
      height: 7px;
      border-radius: 50%;
      background: currentColor;
    }

    .active {
      background: var(--mat-sys-primary-container);
      color: var(--mat-sys-on-primary-container);
    }

    .overdue {
      background: var(--mat-sys-error-container);
      color: var(--mat-sys-on-error-container);
    }

    .returned {
      background: var(--mat-sys-surface-container-high);
      color: var(--mat-sys-on-surface-variant);
    }
  `,
})
export class LoanStatusChip {
  readonly status = input.required<LoanStatus>();

  protected readonly cssClass = computed(() => `chip ${this.status().toLowerCase()}`);
}
