import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadChildren: () => import('./tabs/tabs.routes').then((m) => m.routes),
  },
  {
    path: 'market/:symbol',
    loadComponent: () => import('./product-detail/product-detail.page').then(m => m.ProductDetailPage),
  },
];
