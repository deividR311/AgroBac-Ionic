import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { InfraestructurePageRoutingModule } from './infraestructure-routing.module';

import { InfraestructurePage } from './infraestructure.page';
import { TranslateModule } from '@ngx-translate/core';
import { CreditsPageModule } from '../credits/credits.module';
import { MediaHandlerPage } from 'src/app/shared/components/media-handler/media-handler.page';

import { MatDatepickerModule} from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatNativeDateModule } from '@angular/material/core';
import { MatInputModule } from '@angular/material/input';
import { MediaHandlerPageModule } from 'src/app/shared/components/media-handler/media-handler.module';
import { CoreModule } from 'src/app/shared/core/core.module';


@NgModule({
  imports: [
    CommonModule,
    ReactiveFormsModule,
    IonicModule,
    InfraestructurePageRoutingModule,
    TranslateModule,
    CreditsPageModule,
    MatDatepickerModule,
    MatFormFieldModule,
    MatNativeDateModule,
    MatInputModule,
    MediaHandlerPageModule,
    CoreModule
  ],
  declarations: [InfraestructurePage]
})
export class InfraestructurePageModule {}
