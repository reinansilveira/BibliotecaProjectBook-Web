import { Component, computed, input } from '@angular/core';
import { TranslatePipe } from '../core/i18n/pipes';

@Component({
  selector: 'app-loan-status-chip',
  imports: [TranslatePipe],
  template: `<span class="chip" [class]="cssClass()">{{ status() | t }}</span>`,
  styles: `
    .chip {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 3px 10px 3px 8px;
      border-radius: 999px;
      font: var(--mat-sys-label-medium);
      white-space: nowrap;
      background: var(--mat-sys-surface-container-high);
      color: var(--mat-sys-on-surface-variant);
    }

    .chip::before {
      content: '';
      width: 7px;
      height: 7px;
      border-radius: 50%;
      background: currentColor;
    }

    .active,
    .ready,
    .paid {
      background: var(--mat-sys-primary-container);
      color: var(--mat-sys-on-primary-container);
    }

    .overdue,
    .unpaid {
      background: var(--mat-sys-error-container);
      color: var(--mat-sys-on-error-container);
    }

    .waiting {
      background: var(--mat-sys-tertiary-container);
      color: var(--mat-sys-on-tertiary-container);
    }
  `,
})
export class LoanStatusChip {
  readonly status = input.required<string>();

  protected readonly cssClass = computed(() => `chip ${this.status().toLowerCase()}`);
}
