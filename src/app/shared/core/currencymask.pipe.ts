import { Pipe, PipeTransform } from '@angular/core';

@Pipe({name: 'currencyMask'})
export class CurrencyMask implements PipeTransform {
  transform(number: string): string {
    return number.toString().replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1,');
  }
}
