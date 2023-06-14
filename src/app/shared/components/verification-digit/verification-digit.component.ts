import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-verification-digit',
  templateUrl: './verification-digit.component.html',
  styleUrls: ['./verification-digit.component.scss'],
})
export class VerificationDigitComponent implements OnInit {
  Vector: Array<number>;
  digitoValidacion: string;
  costExecutedMaxCharacters : number = 16;
  costExecutedMaxCharactersWithSigns : number = 22;

  constructor() {
    this.inicializarVector();
  }

  ngOnInit() {}

  inicializarVector() {
    this.Vector = [];
    this.Vector[0] = 3;
    this.Vector[1] = 7;
    this.Vector[2] = 13;
    this.Vector[3] = 17;
    this.Vector[4] = 19;
    this.Vector[5] = 23;
    this.Vector[6] = 29;
    this.Vector[7] = 37;
    this.Vector[8] = 41;
    this.Vector[9] = 43;
    this.Vector[10] = 47;
    this.Vector[11] = 53;
    this.Vector[12] = 59;
    this.Vector[13] = 67;
    this.Vector[14] = 71;
  }
  calcularDigitoVerificacion(nit) {
    let temp;
    let nitLength;
    let contador;
    let residuo;
    let acumulador;

    nitLength = nit.length;
    acumulador = 0;
    residuo = 0;

    for (contador = 0; contador < nitLength; contador++) {
      temp = nit[nitLength - 1 - contador];
      acumulador = acumulador + Number(temp) * this.Vector[contador];
    }

    residuo = acumulador % 11;

    if (residuo > 1){
      this.digitoValidacion = (11 - residuo).toString();
    } else {
      this.digitoValidacion = residuo.toString();
    }
    return this.digitoValidacion;
  }

  InputChange(valorString) {
    if (valorString !== undefined && valorString !== null){
      valorString = valorString.toString();
      if (valorString.length > 16 && !valorString.includes(',')) {
        valorString = valorString.substr(0, 16);
      }
      return valorString;
    }
  }

  InputBlur(valorString) {
    valorString = valorString.toString();
    const regular = /[^0-9]*/g;
    valorString = valorString.replace(regular, '');
    if (valorString !== '' && valorString !== null) {
      valorString = this.addThousandsSeparator(valorString);
    }
    return valorString;
  }

  addThousandsSeparator(valor) {
    let newStr = '';
    const valorColumnaString = valor.toString();
    const lengthStr = valor.length;
    const resStr = lengthStr % 3;
    for (let i = 0; i < lengthStr; i++) {
      if ((i === resStr || (i - resStr) % 3 === 0) && i !== 0) {
        newStr = newStr + ',';
      }
      newStr = newStr + valorColumnaString.charAt(i);
    }
    newStr = '$' + newStr;
    return newStr;
  }

  InputFocus(valorString) {
    if (valorString) {
      valorString = valorString.replace('$', '');
      if (valorString.includes(',')) {
        valorString = valorString.replace(/,/g, "");
      }
    }
    return valorString;
  }
}
