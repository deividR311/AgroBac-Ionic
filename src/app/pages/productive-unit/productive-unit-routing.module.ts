import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { ProductiveUnitPage } from './productive-unit.page';

const routes: Routes = [
  {
    path: '',
    component: ProductiveUnitPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ProductiveUnitPageRoutingModule {}
