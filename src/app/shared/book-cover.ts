import { Component, computed, inject, input, signal } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { switchMap, tap } from 'rxjs';
import { CoverService, coverUrl } from '../core/covers/cover.service';

export type CoverDisplay = 'thumb' | 'card' | 'large';

export function coverHue(title: string): number {
  const hash = [...title].reduce(
    (total, character) => (total * 31 + character.charCodeAt(0)) >>> 0,
    7,
  );

  return hash % 360;
}

@Component({
  selector: 'app-book-cover',
  template: `
    <div
      class="cover"
      [class]="display()"
      [class.has-image]="loaded()"
      [style.--hue]="hue()"
      aria-hidden="true"
    >
      <div class="generated">
        <span class="frame">
          <span class="title">{{ title() }}</span>
          <span class="rule"></span>
          <span class="author">{{ author() }}</span>
        </span>
      </div>

      @if (imageUrl(); as url) {
        <img
          [src]="url"
          alt=""
          loading="lazy"
          (load)="loaded.set(true)"
          (error)="failed.set(true)"
        />
      }
    </div>
  `,
  styles: `
    :host {
      display: block;
    }

    .cover {
      --hue: 210;
      position: relative;
      aspect-ratio: 2 / 3;
      width: 100%;
      border-radius: 4px 10px 10px 4px;
      overflow: hidden;
      box-shadow: var(--app-shadow-strong);
      background: hsl(var(--hue) 30% 30%);
    }

    .cover::after {
      content: '';
      position: absolute;
      inset: 0;
      pointer-events: none;
      background:
        linear-gradient(90deg, rgb(0 0 0 / 28%) 0, rgb(255 255 255 / 12%) 3%, transparent 7%),
        linear-gradient(180deg, rgb(255 255 255 / 8%), transparent 40%);
    }

    .generated {
      position: absolute;
      inset: 0;
      display: flex;
      padding: 10% 9% 10% 13%;
      color: hsl(var(--hue) 40% 94%);
      background:
        radial-gradient(
          circle at 80% 10%,
          hsl(calc(var(--hue) + 30) 50% 45% / 55%),
          transparent 55%
        ),
        linear-gradient(165deg, hsl(var(--hue) 42% 36%), hsl(calc(var(--hue) + 25) 48% 20%));
    }

    .frame {
      flex: 1;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      gap: 10px;
      padding: 12% 8%;
      text-align: center;
      border: 1px solid hsl(var(--hue) 40% 85% / 45%);
      border-radius: 2px;
    }

    .title {
      font-family: var(--app-serif);
      font-weight: 600;
      font-size: 1.05rem;
      line-height: 1.15;
      display: -webkit-box;
      -webkit-line-clamp: 5;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }

    .rule {
      width: 24px;
      height: 1px;
      background: currentColor;
      opacity: 0.6;
    }

    .author {
      font-size: 0.62rem;
      font-weight: 600;
      letter-spacing: 0.14em;
      text-transform: uppercase;
      opacity: 0.85;
    }

    img {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
      object-fit: cover;
      opacity: 0;
      transition: opacity 300ms ease;
    }

    .has-image img {
      opacity: 1;
    }

    .thumb {
      border-radius: 2px 5px 5px 2px;
      box-shadow: var(--app-shadow);

      .frame {
        display: none;
      }
    }

    .large .title {
      font-size: 1.9rem;
    }

    .large .author {
      font-size: 0.8rem;
    }
  `,
})
export class BookCover {
  private readonly covers = inject(CoverService);

  readonly title = input.required<string>();
  readonly author = input.required<string>();
  readonly display = input<CoverDisplay>('card');

  protected readonly loaded = signal(false);
  protected readonly failed = signal(false);
  protected readonly hue = computed(() => coverHue(this.title()));

  private readonly book = computed(() => ({ title: this.title(), author: this.author() }));

  private readonly coverId = toSignal(
    toObservable(this.book).pipe(
      tap(() => {
        this.loaded.set(false);
        this.failed.set(false);
      }),
      switchMap((book) => this.covers.coverId(book.title, book.author)),
    ),
    { initialValue: null },
  );

  protected readonly imageUrl = computed(() => {
    const id = this.coverId();

    if (id === null || this.failed()) {
      return null;
    }

    return coverUrl(id, this.display() === 'thumb' ? 'M' : 'L');
  });
}
