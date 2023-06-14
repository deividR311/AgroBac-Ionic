import { Pipe, PipeTransform } from '@angular/core';

@Pipe({name: 'numberMask'})
export class NumberMask implements PipeTransform {
  transform(number: string, exponent?: number): string {
    if (number !== null && number !== undefined) {
      return `${'*'.repeat(number.length - exponent)}${number.substr(number.length - exponent)}`;
    } else {
      return '';
    }
  }
}
