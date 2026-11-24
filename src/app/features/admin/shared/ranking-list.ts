import { DecimalPipe } from '@angular/common';
import { Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MostBorrowedBook } from '../../../core/api/models';
import { BookCover } from '../../../shared/book-cover';

@Component({
  selector: 'app-ranking-list',
  imports: [BookCover, DecimalPipe, RouterLink],
  template: `
    <ol class="ranking">
      @for (item of items(); track item.bookId) {
        <li [class.podium]="item.rank <= 3">
          <span class="rank">{{ item.rank }}</span>
          <span class="thumb">
            <app-book-cover [title]="item.title" [author]="item.author" display="thumb" />
          </span>
          <span class="details">
            <a class="title" [routerLink]="['/books', item.bookId]">{{ item.title }}</a>
            <small>{{ item.author }}</small>
            <span class="meter" aria-hidden="true">
              <span [style.width.%]="(item.totalLoans / highest()) * 100"></span>
            </span>
          </span>
          <span class="total">{{ item.totalLoans | number }}<small>loans</small></span>
        </li>
      }
    </ol>
  `,
  styles: `
    :host {
      display: block;
      min-width: 0;
    }

    .ranking {
      display: grid;
      gap: 4px;
      margin: 0;
      padding: 0;
      list-style: none;
    }

    li {
      display: flex;
      align-items: center;
      gap: 14px;
      padding: 10px 8px;
      border-radius: 12px;

      &:hover {
        background: var(--mat-sys-surface-container-low);
      }
    }

    .rank {
      display: grid;
      place-items: center;
      width: 28px;
      height: 28px;
      flex-shrink: 0;
      border-radius: 50%;
      font: var(--mat-sys-label-large);
      background: var(--mat-sys-surface-container-high);
      color: var(--mat-sys-on-surface-variant);
    }

    .podium .rank {
      background: var(--mat-sys-tertiary-container);
      color: var(--mat-sys-on-tertiary-container);
    }

    .thumb {
      width: 36px;
      flex-shrink: 0;
    }

    .details {
      flex: 1;
      min-width: 0;
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .title {
      font-weight: 600;
      text-decoration: none;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;

      &:hover {
        color: var(--mat-sys-primary);
      }
    }

    small {
      font: var(--mat-sys-body-small);
      color: var(--mat-sys-on-surface-variant);
    }

    .meter {
      height: 4px;
      margin-top: 6px;
      border-radius: 999px;
      background: var(--mat-sys-surface-container-high);
      overflow: hidden;

      span {
        display: block;
        height: 100%;
        border-radius: inherit;
        background: var(--mat-sys-primary);
      }
    }

    .total {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      font-family: var(--app-serif);
      font-size: 1.2rem;
      font-weight: 600;

      small {
        font-family: Inter, sans-serif;
        font-size: 0.7rem;
      }
    }
  `,
})
export class RankingList {
  readonly items = input.required<MostBorrowedBook[]>();

  protected readonly highest = computed(() =>
    Math.max(1, ...this.items().map((item) => item.totalLoans)),
  );
}
