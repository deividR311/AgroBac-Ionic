import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { AuthorizationDataTreatmentPage } from './authorization-data-treatment.page';

const routes: Routes = [
  {
    path: '',
    component: AuthorizationDataTreatmentPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class AuthorizationDataTreatmentPageRoutingModule {}
