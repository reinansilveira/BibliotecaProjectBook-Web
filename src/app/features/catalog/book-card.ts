import { Component, input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';
import { Book } from '../../core/api/models';
import { TranslatePipe } from '../../core/i18n/pipes';
import { availabilityTone } from '../../shared/availability';
import { BookCover } from '../../shared/book-cover';
import { StarRating } from '../../shared/stars';

@Component({
  selector: 'app-book-card',
  imports: [RouterLink, BookCover, MatIconModule, StarRating, TranslatePipe],
  template: `
    <a class="card" [routerLink]="['/books', book().id]" [attr.aria-label]="book().title">
      <div class="cover">
        <app-book-cover
          [title]="book().title"
          [author]="book().author"
          [coverUrl]="book().coverUrl"
        />
        @if (book().hasEbook) {
          <span class="ebook" [attr.title]="'E-book available' | t">
            <mat-icon>tablet_mac</mat-icon>
          </span>
        }
      </div>
      <div class="info">
        <span class="title">{{ book().title }}</span>
        <span class="author">{{ book().author }}</span>
        @if (book().ratingsCount > 0) {
          <app-star-rating [rating]="book().averageRating" [count]="book().ratingsCount" compact />
        }
        <span class="status" [class]="'status ' + tone()">
          <span class="dot"></span>
          @switch (tone()) {
            @case ('available') {
              {{ 'Available' | t }}
            }
            @case ('waiting') {
              {{ 'Waiting list' | t }}
            }
            @default {
              {{ 'Not available' | t }}
            }
          }
        </span>
      </div>
    </a>
  `,
  styles: `
    .card {
      display: flex;
      flex-direction: column;
      gap: 14px;
      text-decoration: none;
      border-radius: 12px;
      outline-offset: 6px;
    }

    .cover {
      position: relative;
      transition: transform 200ms ease;
    }

    .card:hover .cover,
    .card:focus-visible .cover {
      transform: translateY(-6px) rotate(-1deg);
    }

    .ebook {
      position: absolute;
      right: 8px;
      bottom: 8px;
      display: grid;
      place-items: center;
      width: 30px;
      height: 30px;
      border-radius: 50%;
      background: var(--mat-sys-surface);
      color: var(--mat-sys-primary);
      box-shadow: var(--app-shadow);

      mat-icon {
        font-size: 17px;
        width: 17px;
        height: 17px;
      }
    }

    .info {
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      gap: 4px;
    }

    .title {
      font-family: var(--app-serif);
      font-size: 1.02rem;
      font-weight: 600;
      line-height: 1.25;
      color: var(--mat-sys-on-surface);
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }

    .author {
      font: var(--mat-sys-body-small);
      color: var(--mat-sys-on-surface-variant);
    }

    .status {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      margin-top: 2px;
      font: var(--mat-sys-label-small);
      color: var(--mat-sys-on-surface-variant);
    }

    .dot {
      width: 7px;
      height: 7px;
      border-radius: 50%;
      background: var(--mat-sys-outline);
    }

    .available .dot {
      background: #2e8b57;
    }

    .waiting .dot {
      background: var(--mat-sys-tertiary);
    }
  `,
})
export class BookCard {
  readonly book = input.required<Book>();

  protected tone() {
    return availabilityTone(this.book());
  }
}
