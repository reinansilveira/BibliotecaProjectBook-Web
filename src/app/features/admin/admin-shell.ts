import { Component } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { TranslatePipe } from '../../core/i18n/pipes';

interface AdminLink {
  path: string;
  label: string;
  icon: string;
}

@Component({
  selector: 'app-admin-shell',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, MatIconModule, TranslatePipe],
  template: `
    <section class="page">
      <span class="eyebrow">{{ 'Administration' | t }}</span>
      <h1 class="page-title">{{ 'Library dashboard' | t }}</h1>
      <p class="page-subtitle">
        {{ 'Manage the catalog, members, overdue loans and reports.' | t }}
      </p>

      <div class="layout">
        <nav class="side-nav" [attr.aria-label]="'Administration sections' | t">
          @for (link of links; track link.path) {
            <a [routerLink]="link.path" routerLinkActive="active" ariaCurrentWhenActive="page">
              <mat-icon>{{ link.icon }}</mat-icon>
              <span>{{ link.label | t }}</span>
            </a>
          }
        </nav>

        <div class="content">
          <router-outlet />
        </div>
      </div>
    </section>
  `,
  styles: `
    .layout {
      display: grid;
      grid-template-columns: 220px minmax(0, 1fr);
      gap: 32px;
      align-items: start;
    }

    .side-nav {
      position: sticky;
      top: 92px;
      display: flex;
      flex-direction: column;
      gap: 4px;
      padding: 8px;
      border-radius: var(--app-radius);
      background: var(--mat-sys-surface);
      border: 1px solid var(--mat-sys-outline-variant);

      a {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 11px 14px;
        border-radius: 12px;
        font: var(--mat-sys-label-large);
        text-decoration: none;
        color: var(--mat-sys-on-surface-variant);
        white-space: nowrap;
        transition:
          background 150ms ease,
          color 150ms ease;

        &:hover {
          background: var(--mat-sys-surface-container);
          color: var(--mat-sys-on-surface);
        }

        &.active {
          background: var(--mat-sys-primary-container);
          color: var(--mat-sys-on-primary-container);
        }
      }
    }

    @media (max-width: 1000px) {
      .layout {
        grid-template-columns: 1fr;
        gap: 20px;
      }

      .side-nav {
        position: static;
        flex-direction: row;
        overflow-x: auto;
        scrollbar-width: none;

        a {
          padding: 9px 14px;
        }
      }
    }
  `,
})
export class AdminShell {
  protected readonly links: AdminLink[] = [
    { path: 'overview', label: 'Overview', icon: 'space_dashboard' },
    { path: 'books', label: 'Books', icon: 'menu_book' },
    { path: 'members', label: 'Members', icon: 'group' },
    { path: 'fines', label: 'Fines', icon: 'receipt_long' },
    { path: 'reports', label: 'Reports', icon: 'insights' },
    { path: 'audit', label: 'Audit log', icon: 'history' },
  ];
}
