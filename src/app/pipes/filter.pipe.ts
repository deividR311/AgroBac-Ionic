import { Pipe, PipeTransform } from '@angular/core';
import { ToasterService } from '../services/toaster/toaster.service';
import { Credit } from '../shared/model/credit';

@Pipe({
  name: 'filter'
})
export class FilterPipe implements PipeTransform {
  menssageError = 'Con los parámetros de búsqueda, no se encontraron obligaciones';
 constructor(private readonly toaster: ToasterService){}
  transform(credits: Array<Credit>, tipoDocumento: string, numDocumento: string): Array<Credit> {

    if (tipoDocumento !== undefined && numDocumento !== '' && credits !== undefined){
      const arrayFilterTd = credits.filter(credit => credit.tipoDocumento === tipoDocumento);
      const arrayFinal = arrayFilterTd.filter(credit => credit.numeroDocumento === numDocumento);
      if (arrayFinal.length === 0){
        this.toaster.PresentToastMessage(this.menssageError);
        return credits;
      }
      return arrayFinal;
    }
    else{
      return credits;
    }
  }
}
