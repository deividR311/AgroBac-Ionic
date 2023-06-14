import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CurrencyMask } from './currencymask.pipe';
import { NumberMask } from './numbermask.pipe';

const CORE_FUNCTIONS = [
  CurrencyMask,
  NumberMask
]

@NgModule({
  declarations: [...CORE_FUNCTIONS],
  exports: [...CORE_FUNCTIONS],
  imports: [
    CommonModule
  ]
})
export class CoreModule { }
