import { Component, computed, inject, input } from '@angular/core';
import { MonthlyOverdue } from '../../../core/api/models';
import { I18n } from '../../../core/i18n/i18n.service';
import { LocalNumberPipe, TranslatePipe } from '../../../core/i18n/pipes';

export const MONTHS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

const STEPS = [1, 2, 5, 10];
const TICK_COUNT = 4;

export interface ChartScale {
  max: number;
  ticks: number[];
}

export function chartScale(highest: number): ChartScale {
  const raw = Math.max(highest, 1) / TICK_COUNT;
  const magnitude = 10 ** Math.floor(Math.log10(raw));
  const normalized = raw / magnitude;
  const step = Math.max(1, (STEPS.find((candidate) => normalized <= candidate) ?? 10) * magnitude);
  const max = Math.max(step, Math.ceil(highest / step) * step);
  const ticks = Array.from({ length: Math.round(max / step) + 1 }, (_, index) => index * step);

  return { max, ticks };
}

@Component({
  selector: 'app-monthly-chart',
  imports: [LocalNumberPipe, TranslatePipe],
  template: `
    <div class="chart" role="img" [attr.aria-label]="'Loans and overdue returns per month' | t">
      <div class="y-axis" aria-hidden="true">
        @for (tick of scale().ticks; track tick) {
          <span [style.bottom.%]="(tick / scale().max) * 100">{{ tick }}</span>
        }
      </div>
      <div class="plot">
        <div class="grid" aria-hidden="true">
          @for (tick of scale().ticks; track tick) {
            <span class="gridline" [style.bottom.%]="(tick / scale().max) * 100"></span>
          }
        </div>
        <div class="columns">
          @for (month of months(); track month.month) {
            <div class="column" tabindex="0" [attr.aria-label]="label(month)">
              <div class="bars">
                <span class="bar total" [style.height]="height(month.totalLoans)"></span>
                <span class="bar overdue" [style.height]="height(month.overdueLoans)"></span>
              </div>
              <div class="tooltip" aria-hidden="true">
                <strong>{{ monthNames[month.month - 1] | t }}</strong>
                <span>{{ '{count} loans' | t: { count: month.totalLoans } }}</span>
                <span
                  >{{ '{count} overdue' | t: { count: month.overdueLoans } }} ·
                  {{ month.overduePercentage | localNumber: '1.0-1' }}%</span
                >
              </div>
            </div>
          }
        </div>
        <div class="x-axis" aria-hidden="true">
          @for (month of months(); track month.month) {
            <span>{{ monthNames[month.month - 1] | t }}</span>
          }
        </div>
      </div>
    </div>
    <div class="legend">
      <span><i class="swatch total"></i>{{ 'Loans' | t }}</span>
      <span><i class="swatch overdue"></i>{{ 'Overdue' | t }}</span>
    </div>
  `,
  styles: `
    .chart {
      display: grid;
      grid-template-columns: 28px 1fr;
      gap: 8px;
    }

    .y-axis {
      position: relative;
      height: 220px;
      font: var(--mat-sys-label-small);
      color: var(--mat-sys-on-surface-variant);

      span {
        position: absolute;
        right: 0;
        transform: translateY(50%);
      }
    }

    .plot {
      position: relative;
      min-width: 0;
    }

    .grid {
      position: absolute;
      inset: 0 0 auto;
      height: 220px;
      pointer-events: none;
    }

    .gridline {
      position: absolute;
      left: 0;
      right: 0;
      border-top: 1px dashed var(--mat-sys-outline-variant);
    }

    .columns {
      position: relative;
      display: grid;
      grid-template-columns: repeat(12, minmax(0, 1fr));
      height: 220px;
    }

    .column {
      position: relative;
      display: flex;
      border-radius: 8px;
      outline: none;

      &:hover,
      &:focus-visible {
        background: color-mix(in srgb, var(--mat-sys-primary) 8%, transparent);

        .tooltip {
          opacity: 1;
          transform: translate(-50%, -8px);
        }
      }
    }

    .bars {
      flex: 1;
      display: flex;
      align-items: flex-end;
      justify-content: center;
      gap: 3px;
    }

    .bar {
      width: min(36%, 18px);
      min-height: 2px;
      border-radius: 6px 6px 2px 2px;
      transition: height 400ms cubic-bezier(0.2, 0.8, 0.2, 1);
    }

    .total {
      background: var(--mat-sys-primary);
    }

    .overdue {
      background: var(--mat-sys-tertiary);
    }

    .tooltip {
      position: absolute;
      bottom: 100%;
      left: 50%;
      z-index: 2;
      display: flex;
      flex-direction: column;
      gap: 2px;
      min-width: 128px;
      padding: 10px 12px;
      border-radius: 10px;
      background: var(--mat-sys-inverse-surface);
      color: var(--mat-sys-inverse-on-surface);
      font: var(--mat-sys-body-small);
      white-space: nowrap;
      opacity: 0;
      transform: translate(-50%, 0);
      transition:
        opacity 150ms ease,
        transform 150ms ease;
      pointer-events: none;
    }

    .x-axis {
      display: grid;
      grid-template-columns: repeat(12, minmax(0, 1fr));
      margin-top: 8px;
      font: var(--mat-sys-label-small);
      color: var(--mat-sys-on-surface-variant);
      text-align: center;
    }

    .legend {
      display: flex;
      gap: 20px;
      margin-top: 16px;
      font: var(--mat-sys-body-small);
      color: var(--mat-sys-on-surface-variant);

      span {
        display: flex;
        align-items: center;
        gap: 6px;
      }
    }

    .swatch {
      width: 10px;
      height: 10px;
      border-radius: 3px;
    }

    @media (max-width: 520px) {
      .x-axis span:nth-child(even) {
        visibility: hidden;
      }
    }
  `,
})
export class MonthlyChart {
  private readonly i18n = inject(I18n);

  readonly months = input.required<MonthlyOverdue[]>();

  protected readonly monthNames = MONTHS;

  protected readonly scale = computed(() =>
    chartScale(Math.max(0, ...this.months().map((month) => month.totalLoans))),
  );

  protected height(value: number): string {
    return `${(value / this.scale().max) * 100}%`;
  }

  protected label(month: MonthlyOverdue): string {
    return this.i18n.t('{month}: {loans} loans, {overdue} overdue', {
      month: this.i18n.t(MONTHS[month.month - 1]),
      loans: month.totalLoans,
      overdue: month.overdueLoans,
    });
  }
}
