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
        title: 'Dashboard',
        loadComponent: () => import('./overview/overview-page').then((m) => m.OverviewPage),
      },
      {
        path: 'books',
        title: 'Manage books',
        loadComponent: () => import('./books/admin-books-page').then((m) => m.AdminBooksPage),
      },
      {
        path: 'members',
        title: 'Members',
        loadComponent: () => import('./members/admin-members-page').then((m) => m.AdminMembersPage),
      },
      {
        path: 'fines',
        title: 'Fines',
        loadComponent: () => import('./fines/admin-fines-page').then((m) => m.AdminFinesPage),
      },
      {
        path: 'reports',
        title: 'Reports',
        loadComponent: () => import('./reports/reports-page').then((m) => m.ReportsPage),
      },
      {
        path: 'audit',
        title: 'Audit log',
        loadComponent: () => import('./audit/audit-page').then((m) => m.AuditPage),
      },
    ],
  },
];
