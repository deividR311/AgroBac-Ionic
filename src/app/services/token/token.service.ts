import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { VerifyToken } from 'src/app/shared/model/verifyToken';
import { environment } from 'src/environments/environment';
import { PersistenceService } from 'angular-persistence';

@Injectable({
    providedIn: 'root'
})

export class TokenService {
    constructor(private readonly httpClient: HttpClient, private readonly persistence: PersistenceService) { }
    ValidarToken(objectValue: VerifyToken, bearer ): Observable<any> {
        const headers = new HttpHeaders({
            Authentication: `${bearer.toString()}`,
            ContextoTransaccional:  `{"identificadorTransaccional":1,"fecTransaccion":"2021-02-01T14:52:38.114Z","codCanalOriginador":"28","codProcesoOriginador":"28","codFuncionalidadOriginador":"Control Inversion","ipConsumidor":""}`
         });
        const urlService = `${environment.urlService.url}VerificarToken`;
        return this.httpClient.post(urlService, objectValue, { headers });
    }
}
