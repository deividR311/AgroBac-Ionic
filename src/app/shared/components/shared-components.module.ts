import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { RetryUnlockingFailedComponent } from './retry-unlocking-failed/retry-unlocking-failed.component';
import { RejectionReasonComponent } from './rejection-reason/rejection-reason.component';
import { IonicModule } from '@ionic/angular';

const COMPONENTS = [
  RetryUnlockingFailedComponent,
  RejectionReasonComponent
]

@NgModule({
  declarations: [...COMPONENTS],
  imports: [
    CommonModule,
    TranslateModule,
    IonicModule
  ],
  exports: [...COMPONENTS]
})
export class SharedComponentsModule { }
