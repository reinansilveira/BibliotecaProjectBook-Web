import { provideHttpClient, withInterceptors } from '@angular/common/http';
import {
  ApplicationConfig,
  inject,
  provideAppInitializer,
  provideBrowserGlobalErrorListeners,
} from '@angular/core';
import { MatIconRegistry } from '@angular/material/icon';
import {
  provideRouter,
  TitleStrategy,
  withComponentInputBinding,
  withInMemoryScrolling,
} from '@angular/router';
import { routes } from './app.routes';
import { authInterceptor } from './core/auth/auth.interceptor';
import { AuthService } from './core/auth/auth.service';
import { COVER_LOOKUP_ENABLED } from './core/covers/cover.service';
import { REALTIME_FACTORY, signalRFactory } from './core/notifications/notification-center';
import { I18n } from './core/i18n/i18n.service';
import { LocalizedTitleStrategy } from './core/i18n/title-strategy';
import { ThemeService } from './core/theme/theme.service';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(
      routes,
      withComponentInputBinding(),
      withInMemoryScrolling({ scrollPositionRestoration: 'top' }),
    ),
    provideHttpClient(withInterceptors([authInterceptor])),
    { provide: COVER_LOOKUP_ENABLED, useValue: true },
    { provide: REALTIME_FACTORY, useValue: signalRFactory },
    { provide: TitleStrategy, useClass: LocalizedTitleStrategy },
    provideAppInitializer(() => {
      inject(MatIconRegistry).setDefaultFontSetClass('material-symbols-rounded');
      inject(ThemeService);
      inject(I18n);
    }),
    provideAppInitializer(() => inject(AuthService).restoreSession()),
  ],
};
