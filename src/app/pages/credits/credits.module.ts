import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { CreditsPageRoutingModule } from './credits-routing.module';

import { CreditsPage } from './credits.page';
import { TranslateModule } from '@ngx-translate/core';
import { NumberMask } from '../../shared/core/numbermask.pipe';
import { CurrencyMask } from 'src/app/shared/core/currencymask.pipe';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { FilterPipe } from 'src/app/pipes/filter.pipe';
import { CoreModule } from 'src/app/shared/core/core.module';
import { PipesModule } from 'src/app/pipes/pipes.module';


@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    CreditsPageRoutingModule,
    TranslateModule,
    ReactiveFormsModule,
    MatDatepickerModule,
    MatNativeDateModule,
    CoreModule,
    PipesModule
  ],
  providers: [
    MatNativeDateModule
  ],
  declarations: [ CreditsPage ]
})
export class CreditsPageModule {}
