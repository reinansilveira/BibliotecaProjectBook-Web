import { Routes } from '@angular/router';
import { AdminShell } from './admin-shell';

export const adminRoutes: Routes = [
  {
    path: '',
    component: AdminShell,
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'overview' },
      {
        path: 'overview',
        title: 'Dashboard · Library',
        loadComponent: () => import('./overview/overview-page').then((m) => m.OverviewPage),
      },
      {
        path: 'books',
        title: 'Manage books · Library',
        loadComponent: () => import('./books/admin-books-page').then((m) => m.AdminBooksPage),
      },
      {
        path: 'members',
        title: 'Members · Library',
        loadComponent: () => import('./members/admin-members-page').then((m) => m.AdminMembersPage),
      },
      {
        path: 'blacklist',
        title: 'Blacklist · Library',
        loadComponent: () => import('./blacklist/blacklist-page').then((m) => m.BlacklistPage),
      },
      {
        path: 'reports',
        title: 'Reports · Library',
        loadComponent: () => import('./reports/reports-page').then((m) => m.ReportsPage),
      },
    ],
  },
];
