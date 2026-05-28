import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./pages/login/login.component').then(m => m.LoginComponent)
  },
  {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full'
  },
  {
    path: 'dashboard',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/dashboard/dashboard.component').then(m => m.DashboardComponent)
  },
  {
    path: 'firmware',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/firmware/firmware-list.component').then(m => m.FirmwareListComponent)
  },
  {
    path: 'firmware/:id',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/firmware/firmware-detail.component').then(m => m.FirmwareDetailComponent)
  },
  {
    path: 'stage/1',
    canActivate: [authGuard],
    data: { stage: 1 },
    loadComponent: () => import('./pages/testing/stage-testing.component').then(m => m.StageTestingComponent)
  },
  {
    path: 'stage/2',
    canActivate: [authGuard],
    data: { stage: 2 },
    loadComponent: () => import('./pages/testing/stage-testing.component').then(m => m.StageTestingComponent)
  },
  {
    path: 'stage/3',
    canActivate: [authGuard],
    data: { stage: 3 },
    loadComponent: () => import('./pages/testing/stage-testing.component').then(m => m.StageTestingComponent)
  },
  {
    path: 'testing/:id',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/testing/testing-session.component').then(m => m.TestingSessionComponent)
  },
  {
    path: 'changelog',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/changelog/changelog.component').then(m => m.ChangeLogComponent)
  },
  {
    path: '**',
    redirectTo: 'dashboard'
  }
];
