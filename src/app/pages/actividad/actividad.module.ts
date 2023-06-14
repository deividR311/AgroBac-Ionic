import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule,ReactiveFormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { ActividadPageRoutingModule } from './actividad-routing.module';

import { ActividadPage } from './actividad.page';
import { TranslateModule } from '@ngx-translate/core';
import { MediaHandlerPage } from 'src/app/shared/components/media-handler/media-handler.page';
import { CreditsPageModule } from '../credits/credits.module';
import { MediaHandlerPageModule } from 'src/app/shared/components/media-handler/media-handler.module';
import { CoreModule } from 'src/app/shared/core/core.module';


@NgModule({
  imports: [
    CommonModule,
    TranslateModule,
    FormsModule,
    ReactiveFormsModule,
    IonicModule,
    ActividadPageRoutingModule,
    CreditsPageModule,
    MediaHandlerPageModule,
    CoreModule
  ],
  declarations: [ ActividadPage ]
})
export class ActividadPageModule {}
