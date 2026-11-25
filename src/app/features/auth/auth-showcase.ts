import { Component, input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { TranslatePipe } from '../../core/i18n/pipes';
import { BookCover } from '../../shared/book-cover';

interface ShowcaseBook {
  title: string;
  author: string;
}

@Component({
  selector: 'app-auth-showcase',
  imports: [BookCover, MatIconModule, TranslatePipe],
  template: `
    <aside class="showcase">
      <div class="covers" aria-hidden="true">
        @for (book of books; track book.title) {
          <app-book-cover [title]="book.title" [author]="book.author" display="thumb" />
        }
      </div>
      <div class="copy">
        <span class="mark"><mat-icon>auto_stories</mat-icon></span>
        <h2>{{ headline() | t }}</h2>
        <ul>
          <li>
            <mat-icon>check_circle</mat-icon>{{ 'Borrow printed books or read e-books online' | t }}
          </li>
          <li><mat-icon>check_circle</mat-icon>{{ 'Follow due dates in one place' | t }}</li>
          <li><mat-icon>check_circle</mat-icon>{{ 'Free for every member' | t }}</li>
        </ul>
      </div>
    </aside>
  `,
  styles: `
    .showcase {
      position: relative;
      display: flex;
      flex-direction: column;
      justify-content: flex-end;
      height: 100%;
      min-height: 560px;
      padding: 40px;
      overflow: hidden;
      border-radius: var(--app-radius);
      color: #f5efe4;
      background:
        radial-gradient(circle at 20% 0%, rgb(240 184 114 / 30%), transparent 50%),
        linear-gradient(160deg, #24533f, #102a1f);
    }

    .covers {
      position: absolute;
      top: -40px;
      left: -30px;
      right: -30px;
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 16px;
      transform: rotate(-8deg);
      opacity: 0.55;
      mask-image: linear-gradient(180deg, #000 40%, transparent 85%);
    }

    .copy {
      position: relative;
    }

    .mark {
      display: inline-grid;
      place-items: center;
      width: 44px;
      height: 44px;
      border-radius: 12px;
      background: rgb(255 255 255 / 14%);
      margin-bottom: 20px;
    }

    h2 {
      font-family: var(--app-serif);
      font-size: 2.2rem;
      line-height: 1.1;
      font-weight: 600;
      letter-spacing: -0.02em;
      margin: 0 0 20px;
    }

    ul {
      display: grid;
      gap: 10px;
      margin: 0;
      padding: 0;
      list-style: none;
    }

    li {
      display: flex;
      align-items: center;
      gap: 10px;
      opacity: 0.9;

      mat-icon {
        color: #f0b872;
      }
    }
  `,
})
export class AuthShowcase {
  readonly headline = input.required<string>();

  protected readonly books: ShowcaseBook[] = [
    { title: 'Pride and Prejudice', author: 'Jane Austen' },
    { title: 'Dracula', author: 'Bram Stoker' },
    { title: 'Moby-Dick', author: 'Herman Melville' },
    { title: 'Jane Eyre', author: 'Charlotte Bronte' },
    { title: 'Frankenstein', author: 'Mary Shelley' },
    { title: 'The Great Gatsby', author: 'F. Scott Fitzgerald' },
    { title: 'The Odyssey', author: 'Homer' },
    { title: 'Crime and Punishment', author: 'Fyodor Dostoevsky' },
    { title: 'Don Quixote', author: 'Miguel de Cervantes' },
    { title: 'The Picture of Dorian Gray', author: 'Oscar Wilde' },
    { title: 'The Adventures of Sherlock Holmes', author: 'Arthur Conan Doyle' },
    { title: "Alice's Adventures in Wonderland", author: 'Lewis Carroll' },
  ];
}
