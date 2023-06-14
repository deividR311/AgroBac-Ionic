import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { TerminosCondiciones } from 'src/app/shared/model/termsconditions';
import { environment } from '../../../environments/environment';
import { ResourceService } from '../resource/resource.service';


@Injectable({
    providedIn: 'root'
})
export class AuthorizationService {
    constructor(private readonly httpClient: HttpClient,
        private readonly resourceService: ResourceService) { }

    TerminosCondiciones(objectValue: TerminosCondiciones): Observable<any> {
        const headers = this.resourceService.GetTransactionContext();
        const urlService = `${environment.urlService.url}ConsultarTerminosCondiciones`;
        return this.httpClient.post(urlService, objectValue, { headers });
    }
}
