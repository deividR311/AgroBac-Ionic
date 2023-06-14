import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  {
    path: 'home',
    loadChildren: () => import('./pages/home/home.module').then( m => m.HomePageModule)
  },
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full'
  },
  {
    path: 'register',
    loadChildren: () => import('./pages/register/register.module').then( m => m.RegisterPageModule)
  },
  {
    path: 'password',
    loadChildren: () => import('./pages/password/password.module').then( m => m.PasswordPageModule)
  },
  {
    path: 'login',
    loadChildren: () => import('./pages/login/login.module').then( m => m.LoginPageModule)
  },
  {
    path: 'authorization-data-treatment',
    loadChildren: () =>
      import('./pages/authorization-data-treatment/authorization-data-treatment.module').
      then( m => m.AuthorizationDataTreatmentPageModule)
  },
  {
    path: 'authorizationterms-conditions',
    loadChildren: () =>
      import('./pages/authorizationterms-conditions/authorizationterms-conditions.module').
      then( m => m.AuthorizationtermsConditionsPageModule)
  },
  {
    path: 'token',
    loadChildren: () => import('./pages/token/token.module').then( m => m.TokenPageModule)
  },
  {
    path: 'credits',
    loadChildren: () => import('./pages/credits/credits.module').then( m => m.CreditsPageModule)
  },
  {
    path: 'infraestructure',
    loadChildren: () => import('./pages/infraestructure/infraestructure.module').
    then( m => m.InfraestructurePageModule)
  },
  {
    path: 'implements',
    loadChildren: () => import('./pages/implements/implements.module').then( m => m.ImplementsPageModule)
  },
  {
    path: 'rubro',
    loadChildren: () => import('./pages/rubro/rubro.module').then( m => m.RubroPageModule)
  },
  {
    path: 'productive-unit',
    loadChildren: () => import('./pages/productive-unit/productive-unit.module').
    then( m => m.ProductiveUnitPageModule)
  },
  {
    path: 'actividad',
    loadChildren: () => import('./pages/actividad/actividad.module').then( m => m.ActividadPageModule)
  },
  {
    path: 'principal',
    loadChildren: () => import('./pages/principal/principal.module').then( m => m.PrincipalPageModule)
  },
];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules })
  ],
  exports: [RouterModule]
})
export class AppRoutingModule { }
