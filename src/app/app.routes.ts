import { Routes } from '@angular/router';
import { adminGuard, authGuard, guestGuard } from './core/auth/auth.guards';
import { Shell } from './layout/shell';

export const routes: Routes = [
  {
    path: '',
    component: Shell,
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'books' },
      {
        path: 'books',
        title: 'Catalog',
        loadComponent: () => import('./features/catalog/catalog-page').then((m) => m.CatalogPage),
      },
      {
        path: 'books/:id',
        title: 'Book',
        loadComponent: () =>
          import('./features/catalog/book-detail-page').then((m) => m.BookDetailPage),
      },
      {
        path: 'login',
        title: 'Sign in',
        canActivate: [guestGuard],
        loadComponent: () => import('./features/auth/login-page').then((m) => m.LoginPage),
      },
      {
        path: 'register',
        title: 'Create account',
        canActivate: [guestGuard],
        loadComponent: () => import('./features/auth/register-page').then((m) => m.RegisterPage),
      },
      {
        path: 'forgot-password',
        title: 'Forgot your password?',
        loadComponent: () =>
          import('./features/auth/account-recovery').then((m) => m.ForgotPasswordPage),
      },
      {
        path: 'reset-password',
        title: 'Choose a new password',
        loadComponent: () =>
          import('./features/auth/account-recovery').then((m) => m.ResetPasswordPage),
      },
      {
        path: 'confirm-email',
        title: 'Email confirmed',
        loadComponent: () =>
          import('./features/auth/account-recovery').then((m) => m.ConfirmEmailPage),
      },
      { path: 'my-loans', pathMatch: 'full', redirectTo: 'account/loans' },
      {
        path: 'account',
        canActivate: [authGuard],
        loadChildren: () =>
          import('./features/account/account.routes').then((m) => m.accountRoutes),
      },
      {
        path: 'read/:loanId',
        title: 'Reader',
        canActivate: [authGuard],
        loadComponent: () => import('./features/reader/reader-page').then((m) => m.ReaderPage),
      },
      {
        path: 'profile',
        title: 'Profile',
        canActivate: [authGuard],
        loadComponent: () => import('./features/account/profile-page').then((m) => m.ProfilePage),
      },
      {
        path: 'admin',
        canActivate: [adminGuard],
        loadChildren: () => import('./features/admin/admin.routes').then((m) => m.adminRoutes),
      },
      {
        path: '**',
        title: 'Page not found',
        loadComponent: () => import('./layout/not-found-page').then((m) => m.NotFoundPage),
      },
    ],
  },
];
