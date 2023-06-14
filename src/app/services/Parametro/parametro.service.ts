import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Catalogs } from 'src/app/shared/core/constants/catalog.enum';
import { Enumerator } from 'src/app/shared/enum/enumerator.enum';
import { environment } from '../../../environments/environment';
import { ResourceService } from '../resource/resource.service';


@Injectable({
    providedIn: 'root'
})
export class ParametroService {

    constructor(
        private readonly httpClient: HttpClient,
        private readonly resourceService: ResourceService
    ) { }

    ConsultarParametro(id: Enumerator | Catalogs): Observable<any> {
        const headers = this.resourceService.GetTransactionContext();
        const urlService = `${environment.urlService.url}ConsultarParametro?id=${id}`;

        return this.httpClient.get(urlService, {headers}).pipe(
            map((res : any) => {
                return {resultData: res.resultData.filter((item: { estado: number; }) => item.estado == 1)}
            })
        )
    }
}
