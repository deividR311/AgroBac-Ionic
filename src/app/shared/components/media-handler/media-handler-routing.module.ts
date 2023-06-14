import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { MediaHandlerPage } from './media-handler.page';

const routes: Routes = [
  {
    path: '',
    component: MediaHandlerPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class MediaHandlerPageRoutingModule {}
