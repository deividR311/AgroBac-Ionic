import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { MediaHandlerPageRoutingModule } from './media-handler-routing.module';

import { MediaHandlerPage } from './media-handler.page';
import { TranslateModule } from '@ngx-translate/core';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    MediaHandlerPageRoutingModule,
    TranslateModule
  ],
  entryComponents: [MediaHandlerPage],
  declarations: [MediaHandlerPage],
  exports : [MediaHandlerPage]
})
export class MediaHandlerPageModule {}
