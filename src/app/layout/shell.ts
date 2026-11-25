import { Component, computed, inject, signal } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { catchError, debounceTime, distinctUntilChanged, map, of, switchMap } from 'rxjs';
import { BooksApi } from '../core/api/books-api';
import { BookSuggestion } from '../core/api/models';
import { AuthService } from '../core/auth/auth.service';
import { I18n, LANGUAGES } from '../core/i18n/i18n.service';
import { LocalDatePipe, TranslatePipe } from '../core/i18n/pipes';
import { NotificationCenter } from '../core/notifications/notification-center';
import { ThemeService } from '../core/theme/theme.service';
import { BookCover } from '../shared/book-cover';
import { initials } from '../shared/initials';

const MIN_QUERY = 2;

const NOTIFICATION_ICONS: Record<string, string> = {
  'loan.created': 'library_add',
  'loan.returned': 'assignment_return',
  'loan.renewed': 'autorenew',
  'loan.due-soon': 'schedule',
  'loan.overdue': 'warning',
  'loan.ebook-expired': 'timer_off',
  'reservation.ready': 'event_available',
  'reservation.expired': 'event_busy',
  'fine.issued': 'receipt_long',
  'fine.settled': 'paid',
  'account.password-changed': 'lock_reset',
};

export function notificationIcon(type: string): string {
  return NOTIFICATION_ICONS[type] ?? 'notifications';
}

@Component({
  selector: 'app-shell',
  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    BookCover,
    LocalDatePipe,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatDividerModule,
    TranslatePipe,
  ],
  templateUrl: './shell.html',
  styleUrl: './shell.scss',
})
export class Shell {
  protected readonly auth = inject(AuthService);
  protected readonly theme = inject(ThemeService);
  protected readonly i18n = inject(I18n);
  protected readonly notifications = inject(NotificationCenter);
  private readonly booksApi = inject(BooksApi);
  private readonly router = inject(Router);

  protected readonly languages = LANGUAGES;
  protected readonly notificationIcon = notificationIcon;
  protected readonly term = signal('');
  protected readonly focused = signal(false);
  protected readonly activeIndex = signal(-1);
  protected readonly initials = computed(() => initials(this.auth.session()?.name ?? ''));
  protected readonly firstName = computed(() => this.auth.session()?.name.split(' ')[0] ?? '');

  protected readonly suggestions = toSignal(
    toObservable(this.term).pipe(
      map((term) => (typeof term === 'string' ? term.trim() : '')),
      debounceTime(250),
      distinctUntilChanged(),
      switchMap((term) => {
        if (term.length < MIN_QUERY) {
          return of<BookSuggestion[]>([]);
        }

        return this.booksApi.suggestions(term).pipe(catchError(() => of<BookSuggestion[]>([])));
      }),
    ),
    { initialValue: [] as BookSuggestion[] },
  );

  protected readonly panelOpen = computed(
    () => this.focused() && this.suggestions().length > 0 && this.term().trim().length >= MIN_QUERY,
  );

  protected onType(value: string): void {
    this.term.set(value);
    this.activeIndex.set(-1);
  }

  protected onSearchKey(event: KeyboardEvent): void {
    const count = this.suggestions().length;

    if (event.key === 'Escape') {
      this.focused.set(false);
      return;
    }

    if (!this.panelOpen() || (event.key !== 'ArrowDown' && event.key !== 'ArrowUp')) {
      this.focused.set(true);
      return;
    }

    event.preventDefault();
    const step = event.key === 'ArrowDown' ? 1 : -1;
    this.activeIndex.update((index) => (index + step + count) % count);
  }

  protected closeSoon(): void {
    setTimeout(() => this.focused.set(false), 120);
  }

  protected search(event: Event): void {
    event.preventDefault();
    const active = this.suggestions()[this.activeIndex()];

    if (this.panelOpen() && active) {
      this.openSuggestion(active);
      return;
    }

    this.focused.set(false);
    const term = this.term().trim();
    void this.router.navigate(['/books'], { queryParams: { search: term || null } });
  }

  protected openSuggestion(suggestion: BookSuggestion): void {
    this.term.set('');
    this.focused.set(false);
    this.activeIndex.set(-1);
    void this.router.navigate(['/books', suggestion.id]);
  }
}
