import { Routes } from '@angular/router';
import { TabsPage } from './tabs.page';

export const routes: Routes = [
  {
    path: 'tabs',
    component: TabsPage,
    children: [
      {
        path: 'portfolio',
        loadComponent: () =>
          import('../portfolio/portfolio.page').then((m) => m.PortfolioPage),
      },
      {
        path: 'market',
        loadComponent: () =>
          import('../market/market.page').then((m) => m.MarketPage),
      },
      {
        path: '',
        redirectTo: '/tabs/portfolio',
        pathMatch: 'full',
      },
    ],
  },
  {
    path: '',
    redirectTo: '/tabs/portfolio',
    pathMatch: 'full',
  },
];
