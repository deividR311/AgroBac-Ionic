import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { AuthorizationDataTreatmentPageRoutingModule } from './authorization-data-treatment-routing.module';

import { AuthorizationDataTreatmentPage } from './authorization-data-treatment.page';
import { TranslateModule } from '@ngx-translate/core';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    TranslateModule,
    AuthorizationDataTreatmentPageRoutingModule
  ],
  declarations: [AuthorizationDataTreatmentPage]
})
export class AuthorizationDataTreatmentPageModule {}
