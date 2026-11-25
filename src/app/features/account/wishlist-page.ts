import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '../../core/i18n/pipes';
import { WishlistStore } from '../../core/wishlist/wishlist-store';
import { EmptyState } from '../../shared/empty-state';
import { BookCard } from '../catalog/book-card';

@Component({
  selector: 'app-wishlist-page',
  imports: [BookCard, EmptyState, MatButtonModule, RouterLink, TranslatePipe],
  template: `
    @if (!wishlist.loaded()) {
      <span class="skeleton block-skeleton" [attr.aria-label]="'Loading' | t"></span>
    } @else {
      @if (wishlist.books().length === 0) {
        <app-empty-state icon="favorite" [title]="'Your wishlist is empty' | t">
          {{ 'Tap the heart on any book page to save it for later.' | t }}
          <a mat-stroked-button routerLink="/books">{{ 'Browse the catalog' | t }}</a>
        </app-empty-state>
      } @else {
        <div class="grid">
          @for (book of wishlist.books(); track book.id) {
            <app-book-card [book]="book" />
          }
        </div>
      }
    }
  `,
  styles: `
    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
      gap: 32px 24px;
    }

    .block-skeleton {
      height: 260px;
      border-radius: var(--app-radius);
    }

    @media (max-width: 760px) {
      .grid {
        grid-template-columns: repeat(auto-fill, minmax(130px, 1fr));
        gap: 24px 16px;
      }
    }
  `,
})
export class WishlistPage {
  protected readonly wishlist = inject(WishlistStore);

  constructor() {
    void this.wishlist.reload();
  }
}
