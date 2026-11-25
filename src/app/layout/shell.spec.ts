import { computed, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { of } from 'rxjs';
import { text } from '../../testing/dom';
import { BooksApi } from '../core/api/books-api';
import { AppNotification } from '../core/api/models';
import { AuthService, Session } from '../core/auth/auth.service';
import { NotificationCenter } from '../core/notifications/notification-center';
import { notificationIcon, Shell } from './shell';

describe('Shell', () => {
  const session = signal<Session | null>(null);
  const suggestions = vi.fn();
  const notifications = {
    unread: signal(0),
    latest: signal<AppNotification[]>([]),
    refresh: vi.fn(),
    open: vi.fn(),
    markAllRead: vi.fn(),
  };

  beforeEach(() => {
    session.set(null);
    notifications.unread.set(0);
    suggestions
      .mockReset()
      .mockReturnValue(
        of([{ id: 'book-9', title: 'Dune', author: 'Frank Herbert', coverUrl: null }]),
      );
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: BooksApi, useValue: { suggestions } },
        { provide: NotificationCenter, useValue: notifications },
        {
          provide: AuthService,
          useValue: {
            session,
            isAuthenticated: computed(() => session() !== null),
            isAdmin: computed(() => session()?.role === 'Admin'),
            logout: vi.fn(),
          },
        },
      ],
    });
  });

  function searchInput(element: HTMLElement): HTMLInputElement {
    return element.querySelector<HTMLInputElement>('input[name=search]')!;
  }

  it('offers sign in and sign up to visitors', async () => {
    const fixture = TestBed.createComponent(Shell);
    await fixture.whenStable();

    expect(text(fixture)).toContain('Sign in');
    expect(text(fixture)).toContain('Create account');
  });

  it('shows the initials, the library, the admin link and unread notifications', async () => {
    session.set({
      memberId: 'member-1',
      name: 'Ana Maria Smith',
      role: 'Admin',
      accessToken: 'token',
    });
    notifications.unread.set(3);
    const fixture = TestBed.createComponent(Shell);
    await fixture.whenStable();
    const element = fixture.nativeElement as HTMLElement;

    expect(text(fixture)).toContain('AM');
    expect(text(fixture)).toContain('Admin');
    expect(text(fixture)).toContain('My library');
    expect(element.querySelector('.bell-badge')?.textContent).toContain('3');
  });

  it('searches the catalog from the header', async () => {
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    const fixture = TestBed.createComponent(Shell);
    await fixture.whenStable();
    const element = fixture.nativeElement as HTMLElement;
    const input = searchInput(element);

    input.value = '  tolkien ';
    input.dispatchEvent(new Event('input'));
    element.querySelector('form')!.dispatchEvent(new Event('submit'));

    expect(navigate).toHaveBeenCalledWith(['/books'], { queryParams: { search: 'tolkien' } });
  });

  it('suggests books while typing and opens the chosen one', async () => {
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    const fixture = TestBed.createComponent(Shell);
    await fixture.whenStable();
    const element = fixture.nativeElement as HTMLElement;
    const input = searchInput(element);

    input.dispatchEvent(new Event('focus'));
    input.value = 'du';
    input.dispatchEvent(new Event('input'));
    await fixture.whenStable();
    await new Promise((resolve) => setTimeout(resolve, 350));
    await fixture.whenStable();

    expect(suggestions).toHaveBeenCalledWith('du');
    expect(input.getAttribute('aria-expanded')).toBe('true');

    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown' }));
    await fixture.whenStable();
    expect(input.getAttribute('aria-activedescendant')).toBe('suggestion-0');

    element.querySelector('form')!.dispatchEvent(new Event('submit'));

    expect(navigate).toHaveBeenCalledWith(['/books', 'book-9']);
  });

  it('picks an icon for each kind of notification', () => {
    expect(notificationIcon('reservation.ready')).toBe('event_available');
    expect(notificationIcon('something.new')).toBe('notifications');
  });
});
