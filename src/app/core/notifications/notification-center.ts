import { effect, inject, Injectable, InjectionToken, signal } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { NOTIFICATIONS_HUB_URL } from '../api/api-url';
import { NotificationsApi } from '../api/library-api';
import { AppNotification } from '../api/models';
import { AuthService } from '../auth/auth.service';
import { I18n } from '../i18n/i18n.service';

export interface RealtimeConnection {
  start(): Promise<void>;
  stop(): Promise<void>;
  on(event: string, handler: (notification: AppNotification) => void): void;
}

export type RealtimeFactory = (
  url: string,
  accessToken: () => string,
) => Promise<RealtimeConnection>;

export const REALTIME_FACTORY = new InjectionToken<RealtimeFactory | null>('REALTIME_FACTORY', {
  factory: () => null,
});

export const signalRFactory: RealtimeFactory = async (url, accessToken) => {
  const signalR = await import('@microsoft/signalr');

  return new signalR.HubConnectionBuilder()
    .withUrl(url, { accessTokenFactory: accessToken })
    .withAutomaticReconnect()
    .configureLogging(signalR.LogLevel.Warning)
    .build();
};

const LATEST = 8;

@Injectable({ providedIn: 'root' })
export class NotificationCenter {
  private readonly api = inject(NotificationsApi);
  private readonly auth = inject(AuthService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly router = inject(Router);
  private readonly i18n = inject(I18n);
  private readonly realtime = inject(REALTIME_FACTORY);
  private connection: RealtimeConnection | null = null;
  private connecting: Promise<void> | null = null;

  readonly unread = signal(0);
  readonly latest = signal<AppNotification[]>([]);
  readonly loading = signal(false);

  constructor() {
    effect(() => {
      const memberId = this.auth.session()?.memberId;

      if (!memberId) {
        this.reset();
        return;
      }

      void this.connect();
    });
  }

  async refresh(): Promise<void> {
    if (!this.auth.isAuthenticated()) {
      return;
    }

    this.loading.set(true);

    try {
      const [page, count] = await Promise.all([
        firstValueFrom(this.api.list(false, 1, LATEST)),
        firstValueFrom(this.api.unreadCount()),
      ]);
      this.latest.set(page.items);
      this.unread.set(count.unread);
    } catch {
      return;
    } finally {
      this.loading.set(false);
    }
  }

  async open(notification: AppNotification): Promise<void> {
    if (!notification.readAt) {
      await firstValueFrom(this.api.markRead(notification.id)).catch(() => undefined);
      this.markLocally(notification.id);
    }

    if (notification.link) {
      await this.router.navigateByUrl(notification.link);
    }
  }

  async markAllRead(): Promise<void> {
    await firstValueFrom(this.api.markAllRead()).catch(() => undefined);
    const now = new Date().toISOString();
    this.latest.update((items) => items.map((item) => ({ ...item, readAt: item.readAt ?? now })));
    this.unread.set(0);
  }

  receive(notification: AppNotification): void {
    this.latest.update((items) => [notification, ...items].slice(0, LATEST));
    this.unread.update((count) => count + 1);

    const reference = this.snackBar.open(
      `${notification.title} · ${notification.message}`,
      notification.link ? this.i18n.t('Open') : this.i18n.t('OK'),
      { duration: 6000 },
    );
    reference.onAction().subscribe(() => void this.open(notification));
  }

  private connect(): Promise<void> {
    this.connecting ??= this.openConnection().finally(() => (this.connecting = null));

    return this.connecting;
  }

  private async openConnection(): Promise<void> {
    await this.refresh();

    if (!this.realtime || this.connection) {
      return;
    }

    try {
      const connection = await this.realtime(
        NOTIFICATIONS_HUB_URL,
        () => this.auth.accessToken() ?? '',
      );
      connection.on('notification', (notification) => this.receive(notification));
      this.connection = connection;
      await connection.start();
    } catch {
      this.connection = null;
    }
  }

  private markLocally(id: string): void {
    const now = new Date().toISOString();
    this.latest.update((items) =>
      items.map((item) => (item.id === id ? { ...item, readAt: now } : item)),
    );
    this.unread.update((count) => Math.max(0, count - 1));
  }

  private reset(): void {
    this.unread.set(0);
    this.latest.set([]);
    const connection = this.connection;
    this.connection = null;
    void connection?.stop().catch(() => undefined);
  }
}
