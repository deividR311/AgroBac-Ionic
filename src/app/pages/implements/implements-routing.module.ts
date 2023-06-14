import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { ImplementsPage } from './implements.page';

const routes: Routes = [
  {
    path: '',
    component: ImplementsPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ImplementsPageRoutingModule {}
