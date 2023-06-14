import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { ProductiveUnitPageRoutingModule } from './productive-unit-routing.module';
import { ProductiveUnitPage } from './productive-unit.page';
import { TranslateModule } from '@ngx-translate/core';
import { MediaHandlerPage } from 'src/app/shared/components/media-handler/media-handler.page';
import { CreditsPageModule } from '../credits/credits.module';
import { CurrencyMask } from 'src/app/shared/core/currencymask.pipe';
import { CoreModule } from 'src/app/shared/core/core.module';
import { MediaHandlerPageModule } from 'src/app/shared/components/media-handler/media-handler.module';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    ProductiveUnitPageRoutingModule,
    TranslateModule,
    ReactiveFormsModule,
    CreditsPageModule,
    CoreModule,
    MediaHandlerPageModule
  ],
  declarations: [ ProductiveUnitPage ]
})
export class ProductiveUnitPageModule {}
