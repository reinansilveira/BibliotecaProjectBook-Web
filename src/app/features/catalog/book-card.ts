import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Book } from '../../core/api/models';
import { BookCover } from '../../shared/book-cover';

@Component({
  selector: 'app-book-card',
  imports: [RouterLink, BookCover],
  template: `
    <a class="card" [routerLink]="['/books', book().id]" [attr.aria-label]="book().title">
      <app-book-cover class="cover" [title]="book().title" [author]="book().author" />
      <div class="info">
        <span class="title">{{ book().title }}</span>
        <span class="author">{{ book().author }}</span>
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
      transition: transform 200ms ease;
    }

    .card:hover .cover,
    .card:focus-visible .cover {
      transform: translateY(-6px) rotate(-1deg);
    }

    .info {
      display: flex;
      flex-direction: column;
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
  `,
})
export class BookCard {
  readonly book = input.required<Book>();
}
