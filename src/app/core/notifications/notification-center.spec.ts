import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { MatSnackBar } from '@angular/material/snack-bar';
import { provideRouter, Router } from '@angular/router';
import { of, Subject } from 'rxjs';
import { aPage } from '../../../testing/test-data';
import { NotificationsApi } from '../api/library-api';
import { AppNotification } from '../api/models';
import { AuthService, Session } from '../auth/auth.service';
import { NotificationCenter, REALTIME_FACTORY, RealtimeConnection } from './notification-center';

function aNotification(overrides: Partial<AppNotification> = {}): AppNotification {
  return {
    id: 'n-1',
    type: 'reservation.ready',
    title: 'Your book is ready',
    message: 'Dune is waiting for you.',
    link: '/account/reservations',
    createdAt: '2026-03-01T10:00:00Z',
    readAt: null,
    ...overrides,
  };
}

describe('NotificationCenter', () => {
  const session = signal<Session | null>(null);
  const action = new Subject<void>();
  const snackBar = { open: vi.fn().mockReturnValue({ onAction: () => action }) };
  const api = {
    list: vi.fn(),
    unreadCount: vi.fn(),
    markRead: vi.fn().mockReturnValue(of(undefined)),
    markAllRead: vi.fn().mockReturnValue(of(undefined)),
  };
  let handler: ((notification: AppNotification) => void) | null = null;
  const connection: RealtimeConnection = {
    start: vi.fn().mockResolvedValue(undefined),
    stop: vi.fn().mockResolvedValue(undefined),
    on: (_event, callback) => (handler = callback),
  };
  const factory = vi.fn().mockResolvedValue(connection);

  beforeEach(() => {
    session.set(null);
    handler = null;
    api.list.mockReturnValue(of(aPage([aNotification()])));
    api.unreadCount.mockReturnValue(of({ unread: 1 }));
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: NotificationsApi, useValue: api },
        { provide: MatSnackBar, useValue: snackBar },
        { provide: REALTIME_FACTORY, useValue: factory },
        {
          provide: AuthService,
          useValue: {
            session,
            isAuthenticated: () => session() !== null,
            accessToken: () => 'token',
          },
        },
      ],
    });
  });

  async function signIn(): Promise<NotificationCenter> {
    const center = TestBed.inject(NotificationCenter);
    session.set({ memberId: 'member-1', name: 'Ana', role: 'Member', accessToken: 'token' });
    TestBed.tick();
    await vi.waitFor(() => expect(connection.start).toHaveBeenCalled());

    return center;
  }

  it('loads the latest notifications and connects in real time after sign in', async () => {
    factory.mockClear();
    const center = TestBed.inject(NotificationCenter);
    session.set({ memberId: 'member-1', name: 'Ana', role: 'Member', accessToken: 'token' });
    TestBed.tick();
    session.set({ memberId: 'member-1', name: 'Ana', role: 'Member', accessToken: 'token-2' });
    TestBed.tick();
    await vi.waitFor(() => expect(factory).toHaveBeenCalled());
    await vi.waitFor(() => expect(center.unread()).toBe(1));

    expect(center.latest()).toHaveLength(1);
    expect(factory).toHaveBeenCalledTimes(1);
    expect(factory).toHaveBeenCalledWith('/hubs/notifications', expect.any(Function));
  });

  it('adds real-time notifications and announces them', async () => {
    const center = await signIn();

    handler?.(aNotification({ id: 'n-2', title: 'Fine issued' }));

    expect(center.unread()).toBe(2);
    expect(center.latest()[0].id).toBe('n-2');
    expect(snackBar.open).toHaveBeenCalledWith(
      'Fine issued · Dune is waiting for you.',
      'Open',
      expect.any(Object),
    );
  });

  it('marks a notification as read and follows its link', async () => {
    const center = await signIn();
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(true);

    await center.open(aNotification());

    expect(api.markRead).toHaveBeenCalledWith('n-1');
    expect(center.unread()).toBe(0);
    expect(navigate).toHaveBeenCalledWith('/account/reservations');
  });

  it('marks everything as read and resets on sign out', async () => {
    const center = await signIn();

    await center.markAllRead();
    expect(center.unread()).toBe(0);
    expect(center.latest().every((item) => item.readAt)).toBe(true);

    session.set(null);
    TestBed.tick();

    expect(center.latest()).toEqual([]);
    expect(connection.stop).toHaveBeenCalled();
  });
});
