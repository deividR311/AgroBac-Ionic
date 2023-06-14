import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { AuthorizationtermsConditionsPageRoutingModule } from './authorizationterms-conditions-routing.module';

import { AuthorizationtermsConditionsPage } from './authorizationterms-conditions.page';
import { TranslateModule } from '@ngx-translate/core';
@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    TranslateModule,
    AuthorizationtermsConditionsPageRoutingModule
  ],
  declarations: [AuthorizationtermsConditionsPage]
})
export class AuthorizationtermsConditionsPageModule {}
