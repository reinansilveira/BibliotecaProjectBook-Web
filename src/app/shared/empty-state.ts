import { Component, input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-empty-state',
  imports: [MatIconModule],
  template: `
    <div class="empty">
      <span class="icon"
        ><mat-icon>{{ icon() }}</mat-icon></span
      >
      <h2>{{ title() }}</h2>
      <div class="body"><ng-content /></div>
    </div>
  `,
  styles: `
    .empty {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
      padding: 64px 24px;
      text-align: center;
      color: var(--mat-sys-on-surface-variant);
    }

    .icon {
      display: grid;
      place-items: center;
      width: 88px;
      height: 88px;
      margin-bottom: 12px;
      border-radius: 50%;
      background: var(--mat-sys-primary-container);
      color: var(--mat-sys-on-primary-container);
      box-shadow: 0 0 0 12px color-mix(in srgb, var(--mat-sys-primary-container) 40%, transparent);

      mat-icon {
        font-size: 40px;
        width: 40px;
        height: 40px;
      }
    }

    h2 {
      margin: 0;
      font-family: var(--app-serif);
      font-size: 1.5rem;
      font-weight: 600;
      color: var(--mat-sys-on-surface);
    }

    .body {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 16px;
      max-width: 44ch;
    }
  `,
})
export class EmptyState {
  readonly icon = input.required<string>();
  readonly title = input.required<string>();
}
