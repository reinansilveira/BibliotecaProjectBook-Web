import { booleanAttribute, Component, computed, input, model } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { TranslatePipe } from '../core/i18n/pipes';

export type StarKind = 'full' | 'half' | 'empty';

export function starKinds(rating: number): StarKind[] {
  return [1, 2, 3, 4, 5].map((position) => {
    if (rating >= position - 0.25) {
      return 'full';
    }

    return rating >= position - 0.75 ? 'half' : 'empty';
  });
}

@Component({
  selector: 'app-star-rating',
  imports: [MatIconModule, TranslatePipe],
  template: `
    <span
      class="rating"
      [class.compact]="compact()"
      role="img"
      [attr.aria-label]="'Rated {rating} out of 5' | t: { rating: rounded() }"
    >
      <span class="stars" aria-hidden="true">
        @for (kind of kinds(); track $index) {
          <mat-icon [class]="kind">{{ kind === 'half' ? 'star_half' : 'star' }}</mat-icon>
        }
      </span>
      @if (count() !== null) {
        <span class="value">{{ rounded() }}</span>
        <span class="count">({{ count() }})</span>
      }
    </span>
  `,
  styles: `
    .rating {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      font: var(--mat-sys-label-large);
    }

    .stars {
      display: inline-flex;
      color: var(--mat-sys-tertiary);
    }

    mat-icon {
      font-size: 20px;
      width: 20px;
      height: 20px;
      font-variation-settings: 'FILL' 1;
    }

    .empty {
      color: var(--mat-sys-outline-variant);
    }

    .compact mat-icon {
      font-size: 15px;
      width: 15px;
      height: 15px;
    }

    .compact {
      gap: 4px;
      font: var(--mat-sys-label-medium);
    }

    .count {
      color: var(--mat-sys-on-surface-variant);
      font-weight: 400;
    }
  `,
})
export class StarRating {
  readonly rating = input.required<number>();
  readonly count = input<number | null>(null);
  readonly compact = input(false, { transform: booleanAttribute });

  protected readonly kinds = computed(() => starKinds(this.rating()));
  protected readonly rounded = computed(() => Math.round(this.rating() * 10) / 10);
}

@Component({
  selector: 'app-star-input',
  imports: [MatIconModule, TranslatePipe],
  template: `
    <div class="input" role="radiogroup" [attr.aria-label]="'Your rating' | t">
      @for (star of stars; track star) {
        <button
          type="button"
          role="radio"
          [attr.aria-checked]="value() === star"
          [attr.aria-label]="(star === 1 ? '{count} star' : '{count} stars') | t: { count: star }"
          [class.on]="star <= value()"
          (click)="value.set(star)"
        >
          <mat-icon>star</mat-icon>
        </button>
      }
    </div>
  `,
  styles: `
    .input {
      display: inline-flex;
      gap: 2px;
    }

    button {
      display: grid;
      place-items: center;
      padding: 2px;
      border: none;
      border-radius: 8px;
      background: transparent;
      color: var(--mat-sys-outline-variant);
      cursor: pointer;
      transition:
        transform 120ms ease,
        color 120ms ease;

      &:hover {
        transform: scale(1.12);
      }

      &.on {
        color: var(--mat-sys-tertiary);
      }
    }

    mat-icon {
      font-size: 30px;
      width: 30px;
      height: 30px;
      font-variation-settings: 'FILL' 1;
    }
  `,
})
export class StarInput {
  readonly value = model(0);

  protected readonly stars = [1, 2, 3, 4, 5];
}
