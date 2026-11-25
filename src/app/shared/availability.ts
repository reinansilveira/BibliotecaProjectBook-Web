import { Component, computed, input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { Book } from '../core/api/models';
import { TranslatePipe } from '../core/i18n/pipes';

export type AvailabilityTone = 'available' | 'waiting' | 'none';

export function availabilityTone(book: Book): AvailabilityTone {
  if (book.availableCopies > 0 || book.availableEbookLicenses > 0) {
    return 'available';
  }

  return book.totalCopies > 0 || book.ebookLicenses > 0 ? 'waiting' : 'none';
}

@Component({
  selector: 'app-availability',
  imports: [MatIconModule, TranslatePipe],
  template: `
    <span class="availability" [class]="tone()">
      <span class="dot" aria-hidden="true"></span>
      @if (book().totalCopies > 0) {
        {{
          '{available} of {total} available'
            | t: { available: book().availableCopies, total: book().totalCopies }
        }}
      } @else {
        {{ 'No printed copies' | t }}
      }
    </span>
    @if (book().hasEbook) {
      <span class="ebook" [class.out]="book().availableEbookLicenses === 0">
        <mat-icon>tablet_mac</mat-icon>
        {{ 'E-book' | t }}
      </span>
    }
  `,
  styles: `
    :host {
      display: inline-flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 6px 10px;
      font: var(--mat-sys-label-medium);
    }

    .availability {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      color: var(--mat-sys-on-surface-variant);
    }

    .dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: var(--mat-sys-outline);
    }

    .available .dot {
      background: #2e8b57;
    }

    .waiting .dot {
      background: var(--mat-sys-tertiary);
    }

    .ebook {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 2px 8px;
      border-radius: 999px;
      background: var(--mat-sys-primary-container);
      color: var(--mat-sys-on-primary-container);

      mat-icon {
        font-size: 14px;
        width: 14px;
        height: 14px;
      }

      &.out {
        background: var(--mat-sys-surface-container-high);
        color: var(--mat-sys-on-surface-variant);
      }
    }
  `,
})
export class Availability {
  readonly book = input.required<Book>();

  protected readonly tone = computed(() => `availability ${availabilityTone(this.book())}`);
}
