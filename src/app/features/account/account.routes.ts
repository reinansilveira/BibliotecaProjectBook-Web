import { Routes } from '@angular/router';
import { AccountShell } from './account-shell';

export const accountRoutes: Routes = [
  {
    path: '',
    component: AccountShell,
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'loans' },
      {
        path: 'loans',
        title: 'My loans',
        loadComponent: () => import('./loans-page').then((m) => m.LoansPage),
      },
      {
        path: 'reservations',
        title: 'Waiting list',
        loadComponent: () => import('./reservations-page').then((m) => m.ReservationsPage),
      },
      {
        path: 'fines',
        title: 'Fines',
        loadComponent: () => import('./fines-page').then((m) => m.FinesPage),
      },
      {
        path: 'wishlist',
        title: 'Wishlist',
        loadComponent: () => import('./wishlist-page').then((m) => m.WishlistPage),
      },
      {
        path: 'stats',
        title: 'Reading stats',
        loadComponent: () => import('./stats-page').then((m) => m.StatsPage),
      },
    ],
  },
];
