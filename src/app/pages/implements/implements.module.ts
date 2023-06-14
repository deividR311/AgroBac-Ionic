import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { ImplementsPageRoutingModule } from './implements-routing.module';

import { ImplementsPage } from './implements.page';
import { TranslateModule } from '@ngx-translate/core';
import { MediaHandlerPage } from 'src/app/shared/components/media-handler/media-handler.page';
import { CreditsPageModule } from '../credits/credits.module';
import { MediaHandlerPageModule } from 'src/app/shared/components/media-handler/media-handler.module';
import { CoreModule } from 'src/app/shared/core/core.module';


@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    ImplementsPageRoutingModule,
    TranslateModule,
    ReactiveFormsModule,
    CreditsPageModule,
    MediaHandlerPageModule,
    CoreModule
  ],
  declarations: [ ImplementsPage ]
})
export class ImplementsPageModule {}
