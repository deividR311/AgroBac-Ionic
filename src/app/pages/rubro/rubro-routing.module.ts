import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { RubroPage } from './rubro.page';

const routes: Routes = [
  {
    path: '',
    component: RubroPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class RubroPageRoutingModule {}
