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
        title: 'Catalog · Library',
        loadComponent: () => import('./features/catalog/catalog-page').then((m) => m.CatalogPage),
      },
      {
        path: 'books/:id',
        title: 'Book · Library',
        loadComponent: () =>
          import('./features/catalog/book-detail-page').then((m) => m.BookDetailPage),
      },
      {
        path: 'login',
        title: 'Sign in · Library',
        canActivate: [guestGuard],
        loadComponent: () => import('./features/auth/login-page').then((m) => m.LoginPage),
      },
      {
        path: 'register',
        title: 'Create account · Library',
        canActivate: [guestGuard],
        loadComponent: () => import('./features/auth/register-page').then((m) => m.RegisterPage),
      },
      {
        path: 'my-loans',
        title: 'My loans · Library',
        canActivate: [authGuard],
        loadComponent: () => import('./features/account/my-loans-page').then((m) => m.MyLoansPage),
      },
      {
        path: 'profile',
        title: 'Profile · Library',
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
        title: 'Page not found · Library',
        loadComponent: () => import('./layout/not-found-page').then((m) => m.NotFoundPage),
      },
    ],
  },
];
