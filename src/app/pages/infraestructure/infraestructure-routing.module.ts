import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { InfraestructurePage } from './infraestructure.page';

const routes: Routes = [
  {
    path: '',
    component: InfraestructurePage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class InfraestructurePageRoutingModule {}
